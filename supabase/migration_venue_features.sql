-- ============================================================
-- The Venue Search: verified venue amenities & services
--
-- One row = ONE verified fact about ONE venue ("Taj Falaknuma
-- Palace has a swimming pool"), with where it was verified.
--
-- Design rules (these are enforced by the schema, not just by
-- convention):
--   * A feature that is not verified simply has NO row. There is
--     no "false"/"no"/"n/a" state, so a blank cell in the
--     comparison table can never be turned into a negative claim.
--   * Every row must carry a source_url, source_type and
--     verified_at, so any comparison cell can be audited.
--   * Rows are per property. Nothing is shared between venues or
--     between properties of the same hotel brand.
--   * feature_key values are defined in lib/compare/features.ts;
--     unknown keys are ignored by the app.
--
-- Mirrors venue_rooms: display-only, public read of published
-- rows, writes through the service role only.
-- ============================================================

create table if not exists public.venue_features (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,

  feature_key text not null
    check (feature_key ~ '^[a-z][a-z0-9_]*$'),

  -- Optional short factual qualifier taken from the source,
  -- e.g. 'Up to 350 cars'. Never used to express "not available".
  detail text,

  -- Verification trail.
  source_url text not null check (source_url ~* '^https?://'),
  source_type text not null
    check (source_type in ('official', 'google', 'authoritative')),
  verified_at date not null,
  -- Short note of what the source says (audit aid).
  source_note text,

  status text not null default 'published'
    check (status in ('draft', 'published')),

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists venue_features_venue_feature_unique
  on public.venue_features(venue_id, feature_key);

create index if not exists venue_features_venue_id_idx
  on public.venue_features(venue_id);

alter table public.venue_features enable row level security;

drop policy if exists "published venue features are public"
  on public.venue_features;

create policy "published venue features are public"
  on public.venue_features
  for select
  using (status = 'published');

-- No insert/update/delete policy for anon/authenticated:
-- writes go through the service role (scripts/seed-venue-features.mjs
-- or the Supabase Studio table editor).

-- ------------------------------------------------------------
-- Audit helper: every published fact with its source, by venue.
--   select v.name, f.feature_key, f.source_type, f.verified_at, f.source_url
--   from public.venue_features f join public.venues v on v.id = f.venue_id
--   where f.status = 'published'
--   order by v.name, f.feature_key;
-- ------------------------------------------------------------
