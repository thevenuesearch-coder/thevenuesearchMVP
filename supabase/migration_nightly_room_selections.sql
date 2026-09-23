-- Run this once on an existing Venue Search Supabase project.
--
-- Supports per-night room quantities: a guest staying multiple
-- nights can now request a different number of rooms (and a
-- different split across room categories) for each night of the
-- stay, rather than one flat total for the whole booking.
--
-- room_selections (added in an earlier migration) is superseded by
-- this and no longer written to by the app -- left in place rather
-- than dropped so nothing breaks if older rows or code still
-- reference it.

alter table public.booking_requests
  -- One entry per night of the stay:
  -- [{ "date": "2026-09-23", "selections": [{ "roomId": "...", "roomName": "Deluxe Room", "quantity": 5 }, ...] }, ...]
  -- num_rooms continues to carry the peak (highest single-night)
  -- room count, for quick sorting/reporting in the admin dashboard.
  add column if not exists nightly_room_selections jsonb default '[]'::jsonb;
