-- Run this once on an existing Venue Search Supabase project.
--
-- Supports the redesigned room-booking flow: a guest can now pick
-- a quantity of rooms per room category (Deluxe, Premium, Suite,
-- ...) instead of a single room-type preference, and the "Number
-- of rooms" field now uses a fixed set of range labels instead of
-- a plain 1-6+ dropdown.
--
-- `if not exists` below is deliberate: some of these room columns
-- (checkin_date, checkout_date, num_rooms, room_type,
-- room_guest_count, guest_details) were added directly against
-- the live database in an earlier session and were never captured
-- in a migration file, so this statement is safe to run whether
-- or not they already exist.

alter table public.booking_requests
  add column if not exists checkin_date date,
  add column if not exists checkout_date date,
  add column if not exists num_rooms int,
  add column if not exists guest_details text,
  -- The raw label the guest picked for "Number of rooms" (e.g.
  -- "Less than 10", "15", "More than 20") -- num_rooms above still
  -- carries a best-effort numeric estimate for sorting/reporting.
  add column if not exists room_count_label text,
  -- One entry per selected room category:
  -- [{ "roomId": "...", "roomName": "Deluxe Room", "quantity": 2 }, ...]
  add column if not exists room_selections jsonb default '[]'::jsonb;

-- room_type and room_guest_count (single room-type preference and
-- a room-specific guest count) are superseded by room_selections
-- and the event-level guest_count respectively. Left in place
-- rather than dropped, so nothing breaks if older code/rows still
-- reference them -- the app itself no longer reads or writes them.
alter table public.booking_requests
  add column if not exists room_type text,
  add column if not exists room_guest_count int;
