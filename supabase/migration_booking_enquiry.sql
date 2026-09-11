-- Run this once on an existing Venue Search Supabase project.
alter table public.enquiries add column if not exists budget text;
