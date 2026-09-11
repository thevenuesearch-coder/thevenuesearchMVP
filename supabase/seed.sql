-- Optional additional seed data for a local/demo environment.
-- Run after schema.sql if you want extra availability rows.
insert into public.venue_availability(venue_id,event_date,status)
select id, d::date, 'available' from public.venues cross join generate_series(current_date,current_date+interval '180 days',interval '1 day') d
on conflict do nothing;
