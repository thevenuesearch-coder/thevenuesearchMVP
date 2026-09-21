-- ============================================================
-- The Venue Search: venue data sync + automated hold expiry
-- Run this once in the Supabase SQL Editor on top of schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. VENUE RICHNESS COLUMNS
--
-- The frontend previously read venues from a hardcoded file
-- (lib/data.ts) that carried fields the original schema didn't
-- have (hero image, rating, verified badge, marketing tags,
-- destination). This adds them so the site can read venues
-- straight from the database.
-- ------------------------------------------------------------

alter table public.venues add column if not exists destination text;
alter table public.venues add column if not exists country text default 'India';
alter table public.venues add column if not exists rating numeric;
alter table public.venues add column if not exists verified boolean default true;
alter table public.venues add column if not exists hero_image text;
alter table public.venues add column if not exists tags text[] default '{}';

-- Backfill destination from city where it hasn't been set yet,
-- so existing rows (e.g. the demo Udaipur seed) don't end up
-- with a blank destination filter.
update public.venues set destination = city where destination is null;

-- ------------------------------------------------------------
-- 2. VENUE SPACE RICHNESS COLUMNS
--
-- Each venue space (Main Lawns, Ballroom, etc.) needs its own
-- image/description/tags to match the existing venue detail
-- page, plus a human-readable slug so booking/enquiry links
-- that reference a specific space keep working.
-- ------------------------------------------------------------

alter table public.venue_spaces add column if not exists slug text;
alter table public.venue_spaces add column if not exists image_url text;
alter table public.venue_spaces add column if not exists description text;
alter table public.venue_spaces add column if not exists tags text[] default '{}';

create unique index if not exists venue_spaces_slug_unique
  on public.venue_spaces(slug)
  where slug is not null;

-- ------------------------------------------------------------
-- 3. AUTOMATED HOLD EXPIRY (pg_cron)
--
-- expire_holds() already existed in schema.sql but nothing
-- ever called it, so 72-hour holds never actually released
-- the venue date. This schedules it to run every 30 minutes.
--
-- IMPORTANT: pg_cron must be enabled first.
-- Supabase dashboard -> Database -> Extensions -> search
-- "pg_cron" -> Enable. Then run this file.
-- If you run this before enabling the extension, the
-- `create extension` line below will do it for you (it has
-- the same effect as the toggle), but the toggle is the
-- documented Supabase path and safer for verifying the
-- extension is actually available on your project's plan.
-- ------------------------------------------------------------

create extension if not exists pg_cron;

-- Remove any previous schedule with the same name before
-- re-creating it, so this file is safe to re-run.
select cron.unschedule('expire-venue-holds')
where exists (
  select 1 from cron.job where jobname = 'expire-venue-holds'
);

select cron.schedule(
  'expire-venue-holds',
  '*/30 * * * *', -- every 30 minutes
  $$ select public.expire_holds(); $$
);

-- ------------------------------------------------------------
-- 4. ENQUIRY DUPLICATE-CHECK INDEX
--
-- Supports the app-level duplicate check (same email + venue +
-- event date within 24h) added in /app/api/enquiry/route.ts.
-- ------------------------------------------------------------

create index if not exists enquiries_dedupe_lookup
  on public.enquiries(email, venue_id, event_date, created_at desc);
