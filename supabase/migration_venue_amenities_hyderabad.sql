-- Adds accurate amenity tags to 4 specific Hyderabad venues, researched
-- from official hotel sites and major booking platforms (Booking.com,
-- Expedia, Hotels.com, Hyatt.com, Marriott.com, Taj Hotels) on the date
-- this migration was written. Run this against the actual Supabase
-- project -- it was NOT run automatically as part of any deploy.
--
-- This does NOT hardcode anything into the app. It corrects the
-- underlying data so the app's existing dynamic amenity-matching
-- logic (lib/compareLogic.ts) picks these up correctly on its own --
-- on the comparison table AND the venue's own detail page, not just
-- one or the other.
--
-- Only 4 of the 5 curated amenities shown in the comparison table are
-- added here (Parking, Wi-Fi, Swimming Pool, Catering / Dining).
-- "Power Backup" is deliberately left out: no official or reliable
-- source found explicitly confirmed backup power/generators for any
-- of these 4 properties, so rather than assume it (safe as that
-- assumption might be for 5-star hotels), it's left for someone with
-- first-hand knowledge of the property to confirm and add separately.
--
-- Existing tags are preserved (deduplicated), not replaced.

-- Taj Krishna, Banjara Hills -- confirmed via Taj Hotels (official),
-- Hotels.com, Expedia, Kayak: free parking (+valet), free Wi-Fi,
-- outdoor swimming pool, 3 on-site restaurants.
update public.venues
set tags = (
  select array(
    select distinct unnest(
      coalesce(tags, array[]::text[]) || array['Parking', 'Wi-Fi', 'Swimming Pool', 'Catering / Dining']
    )
  )
)
where slug = 'hyderabad-8';

-- Park Hyatt Hyderabad, Banjara Hills -- confirmed via Hyatt.com
-- (official), Cvent, Trivago, HotelsCombined: complimentary/valet
-- parking, complimentary Wi-Fi, outdoor pool (2 pool areas), 3
-- on-site restaurants plus event catering.
update public.venues
set tags = (
  select array(
    select distinct unnest(
      coalesce(tags, array[]::text[]) || array['Parking', 'Wi-Fi', 'Swimming Pool', 'Catering / Dining']
    )
  )
)
where slug = 'hyderabad-10';

-- Hyderabad Marriott Hotel & Convention Centre, Tank Bund -- confirmed
-- via Booking.com, Expedia, Hotels.com, Kayak, Trivago: free parking,
-- free Wi-Fi, outdoor pool, 4 on-site restaurants.
update public.venues
set tags = (
  select array(
    select distinct unnest(
      coalesce(tags, array[]::text[]) || array['Parking', 'Wi-Fi', 'Swimming Pool', 'Catering / Dining']
    )
  )
)
where slug = 'hyderabad-9';

-- The Westin Hyderabad Mindspace, HITEC City -- confirmed via
-- Marriott.com (official, Westin is a Marriott brand), Expedia,
-- Travelocity, Planet of Hotels: complimentary self/valet parking,
-- complimentary Wi-Fi, outdoor pool(s), 3+ on-site restaurants.
update public.venues
set tags = (
  select array(
    select distinct unnest(
      coalesce(tags, array[]::text[]) || array['Parking', 'Wi-Fi', 'Swimming Pool', 'Catering / Dining']
    )
  )
)
where slug = 'hyderabad-7';
