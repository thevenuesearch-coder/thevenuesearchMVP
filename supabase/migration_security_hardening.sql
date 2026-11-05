-- ============================================================
-- The Venue Search: Supabase security hardening
--
-- Corrective migration. Does NOT edit any previously applied
-- migration. Idempotent (safe to run twice). No data is deleted,
-- no table is dropped, RLS is never disabled.
--
-- Built from the LIVE catalog (read via Security Advisor and
-- pg_catalog on 2026-11-05), not just the repo files. The repo
-- had drifted from production (audit_log RLS,
-- expire_stale_payment_pending, booking_type column and the
-- _image_url_backup_wm table exist live but not in migrations).
--
-- WHAT THIS FIXES (all confirmed live)
--  1. create_venue_hold() was SECURITY DEFINER, trusted a
--     caller-supplied p_user_id, and was executable by anon and
--     authenticated through /rest/v1/rpc.
--  2. Any signed-in user could INSERT into booking_requests with
--     any status (e.g. 'confirmed') and any payment fields.
--  3. Any signed-in user could UPDATE their own profiles.role.
--  4. anon and authenticated held ALL privileges (including
--     TRUNCATE, DELETE, TRIGGER) on every public table, relying
--     on RLS alone.
--  5. SECURITY DEFINER helper functions executable by anon.
--  6. Mutable search_path on set_hold_fee.
--  7. venue_availability readable for unpublished venues.
--
-- ASSUMPTIONS (verified against app code on 2026-11-05)
--  - All booking_requests / enquiries writes go through server
--    routes using the service-role key (bypasses RLS and grants).
--  - Browser writes are limited to: profiles upsert (login),
--    wishlists insert/delete, weddings insert (planner).
--
-- ROLLBACK: see the commented block at the bottom.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. FUNCTIONS
-- ------------------------------------------------------------

-- 1a. set_hold_fee: pin search_path (advisor: function_search_path_mutable)
alter function public.set_hold_fee(numeric) set search_path = '';

-- 1b. create_venue_hold: never trust p_user_id.
--     Same signature (nothing else is rebuilt). Identity comes from
--     auth.uid(). Only a service_role caller (a trusted server
--     route that has already authenticated the user) may pass an
--     explicit p_user_id.
create or replace function public.create_venue_hold(
  p_venue_id    uuid,
  p_event_date  date,
  p_user_id     uuid,
  p_guest_count integer,
  p_event_type  text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_claims  jsonb := coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
  v_id      uuid;
  v_price   numeric;
  v_fee     numeric;
  v_expires timestamptz;
begin
  if v_uid is null then
    if coalesce(v_claims ->> 'role', '') = 'service_role' and p_user_id is not null then
      v_uid := p_user_id;
    else
      raise exception 'Authentication required' using errcode = '28000';
    end if;
  end if;

  if p_event_date is null
     or p_event_date < current_date
     or p_event_date > current_date + 730 then
    raise exception 'Invalid event date' using errcode = '22023';
  end if;

  if p_guest_count is not null and (p_guest_count < 1 or p_guest_count > 10000) then
    raise exception 'Invalid guest count' using errcode = '22023';
  end if;

  if p_event_type is not null and length(p_event_type) > 100 then
    raise exception 'Invalid event type' using errcode = '22023';
  end if;

  -- At most 3 live holds per user.
  if (select count(*)
        from public.booking_requests
       where user_id = v_uid
         and status = 'held'
         and hold_expires_at > now()) >= 3 then
    raise exception 'Hold limit reached' using errcode = '53400';
  end if;

  select indicative_price
    into v_price
    from public.venues
   where id = p_venue_id
     and status = 'published'
     for update;

  if v_price is null then
    raise exception 'Venue not available';
  end if;

  if exists (
    select 1
      from public.booking_requests
     where venue_id = p_venue_id
       and event_date = p_event_date
       and status in ('held', 'payment_pending', 'confirmed')
  ) then
    raise exception 'This venue date is no longer available';
  end if;

  v_fee     := public.set_hold_fee(v_price);
  v_expires := now() + interval '72 hours';

  insert into public.booking_requests (
    venue_id, user_id, event_date, guest_count, event_type,
    mode, status, hold_fee, hold_expires_at
  ) values (
    p_venue_id, v_uid, p_event_date, p_guest_count, p_event_type,
    'hold', 'held', v_fee, v_expires
  )
  returning id into v_id;

  return jsonb_build_object(
    'booking_id', v_id,
    'hold_fee',   v_fee,
    'expires_at', v_expires
  );
end;
$$;

-- 1c. expire_holds / expire_stale_payment_pending: same logic as
--     production (kept in the repo now), search_path pinned.
create or replace function public.expire_holds()
returns void language sql security definer set search_path = '' as $$
  update public.booking_requests
     set status = 'expired', updated_at = now()
   where status = 'held'
     and hold_expires_at < now();
$$;

create or replace function public.expire_stale_payment_pending()
returns void language sql security definer set search_path = '' as $$
  update public.booking_requests
     set status = 'expired', updated_at = now()
   where status = 'payment_pending'
     and created_at < now() - interval '45 minutes';
$$;

-- 1d. handle_new_user: identical logic, search_path pinned.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, mobile, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'username',
             new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'mobile',
             new.raw_user_meta_data ->> 'phone', ''),
    case when lower(new.email) = 'thevenuesearch@gmail.com'
         then 'admin'::public.app_role
         else 'couple'::public.app_role end
  )
  on conflict (id) do update set
    email     = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    mobile    = coalesce(nullif(excluded.mobile, ''),    public.profiles.mobile);
  return new;
end;
$$;

-- 1e. EXECUTE privileges. Nothing here is meant to be callable from
--     the browser. pg_cron runs as postgres and the auth trigger
--     does not need EXECUTE at fire time, so both keep working.
revoke execute on function public.create_venue_hold(uuid, date, uuid, integer, text) from public, anon, authenticated;
revoke execute on function public.expire_holds()                from public, anon, authenticated;
revoke execute on function public.expire_stale_payment_pending() from public, anon, authenticated;
revoke execute on function public.handle_new_user()             from public, anon, authenticated;

grant execute on function public.create_venue_hold(uuid, date, uuid, integer, text) to service_role;
grant execute on function public.expire_holds()                 to service_role;
grant execute on function public.expire_stale_payment_pending() to service_role;

-- ------------------------------------------------------------
-- 2. TABLE PRIVILEGES: least privilege
--    RLS stays on everywhere. Grants are no longer the weak link.
-- ------------------------------------------------------------

-- 2a. Strip every privilege from the two API roles on every public table
--     (also covers _image_url_backup_wm and any table added outside
--     the migration files).
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke all on table public.%I from anon, authenticated', t.tablename);
  end loop;
end $$;

-- 2b. Re-grant only what the application actually uses.

-- Public catalogue data: read-only. Row visibility is enforced by
-- the existing "published only" policies.
grant select on table
  public.venues, public.venue_images, public.venue_spaces,
  public.venue_features, public.venue_rooms, public.venue_availability
to anon, authenticated;

-- Signed-in users: read their own rows (policies enforce "own").
grant select on table
  public.profiles, public.wishlists, public.weddings, public.booking_requests
to authenticated;

-- profiles: login upsert writes id, full_name, email, mobile ONLY.
-- `role` is deliberately not writable from the client.
grant insert (id, full_name, email, mobile) on table public.profiles to authenticated;
grant update (full_name, email, mobile)     on table public.profiles to authenticated;

-- wishlists: browser inserts and deletes own rows.
grant insert, delete on table public.wishlists to authenticated;

-- weddings: planner page inserts own rows.
grant insert on table public.weddings to authenticated;

-- audit_log, enquiries, _image_url_backup_wm: no client privileges.
-- booking_requests: no client INSERT/UPDATE/DELETE. All writes are
-- service-role (create-order, verify-payment, cancel-order, admin).

-- 2c. Future tables do not get automatic API exposure.
--     (Applies to objects created by the role running this migration.
--     supabase_admin has its own defaults: see manual steps.)
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- ------------------------------------------------------------
-- 3. RLS POLICIES
-- ------------------------------------------------------------

-- 3a. audit_log: RLS is already on in production but was never in a
--     migration. Re-assert it. No policies = no access for anon or
--     authenticated. Only service_role / postgres can touch it.
alter table public.audit_log enable row level security;

-- 3b. _image_url_backup_wm exists in production only. Keep RLS on
--     (guarded: absent on a fresh database).
do $$
begin
  if to_regclass('public._image_url_backup_wm') is not null then
    execute 'alter table public._image_url_backup_wm enable row level security';
  end if;
end $$;

-- 3c. booking_requests: users may only READ their own rows.
--     The INSERT policy let a signed-in user create rows with any
--     status, so it is removed (writes are service-role only).
drop policy if exists "create booking" on public.booking_requests;
drop policy if exists "own bookings"   on public.booking_requests;
create policy "own bookings" on public.booking_requests
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- 3d. enquiries: written only by the server route (service role).
drop policy if exists "own enquiries" on public.enquiries;

-- 3e. profiles: the live table had two identical SELECT policies.
--     Keep one, own-row only, and keep own-row insert/update. The
--     column grants above are what stop `role` being changed.
drop policy if exists "own profile"        on public.profiles;
drop policy if exists "own profile select" on public.profiles;
drop policy if exists "own profile insert" on public.profiles;
drop policy if exists "own profile update" on public.profiles;
create policy "own profile select" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "own profile insert" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "own profile update" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 3f. venue_availability: was USING (true), exposing availability of
--     draft/paused venues. Restrict to published venues.
drop policy if exists "availability readable" on public.venue_availability;
create policy "availability readable" on public.venue_availability
  for select to anon, authenticated
  using (exists (
    select 1 from public.venues v
     where v.id = venue_availability.venue_id
       and v.status = 'published'
  ));

commit;

-- ============================================================
-- ROLLBACK (only if something legitimate breaks; re-opens the holes)
-- ============================================================
-- begin;
--   grant all on all tables in schema public to anon, authenticated;
--   grant execute on function public.create_venue_hold(uuid,date,uuid,integer,text) to anon, authenticated;
--   grant execute on function public.expire_holds(), public.expire_stale_payment_pending(), public.handle_new_user() to anon, authenticated;
--   create policy "create booking" on public.booking_requests for insert to authenticated with check (auth.uid() = user_id);
--   create policy "own enquiries"  on public.enquiries for insert to authenticated with check (auth.uid() = user_id or user_id is null);
-- commit;
