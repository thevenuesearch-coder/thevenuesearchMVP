-- ============================================================
-- The Venue Search: Rooms & Accommodation
--
-- Adds room categories per venue (Property -> Room Categories ->
-- Room Details -> Amenities). No pricing fields anywhere by
-- design -- this table is display-only, never used in the
-- booking/payment flow.
-- ============================================================

create table if not exists public.venue_rooms (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,

  slug text not null,
  name text not null,

  -- Card + detail hero image, plus an optional gallery for the
  -- detail modal. Populate with real, rights-cleared photography
  -- -- never a placeholder presented as authentic.
  image_url text,
  gallery_urls text[] default '{}',

  bed_type text,
  max_occupancy int,
  occupancy_note text,

  size_sqm numeric,
  size_sqft numeric,

  view_type text,

  description text,

  -- Shown as 2-4 chips on the card (component caps the count).
  features text[] default '{}',

  bathroom_details text,
  amenities text[] default '{}',
  technology text[] default '{}',
  dining_details text,
  services text[] default '{}',
  special_inclusions text[] default '{}',

  has_balcony boolean default false,
  floor_location text,

  -- Verification trail: where this room's information was
  -- sourced from, per the accuracy requirement that every
  -- property's rooms are checked against official sources.
  source_url text,
  source_note text,

  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order int default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists venue_rooms_venue_slug_unique
  on public.venue_rooms(venue_id, slug);

create index if not exists venue_rooms_venue_id_idx
  on public.venue_rooms(venue_id);

alter table public.venue_rooms enable row level security;

create policy "published rooms are public"
  on public.venue_rooms
  for select
  using (status = 'published');

-- No insert/update/delete policy for anon/authenticated --
-- writes go through the service role (Supabase Studio table
-- editor, or a future admin UI), matching how venues itself
-- is managed today.
