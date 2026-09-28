-- Zoho Invoice integration metadata for confirmed bookings.
alter table public.booking_requests
  add column if not exists zoho_contact_id text,
  add column if not exists zoho_invoice_id text,
  add column if not exists zoho_invoice_number text,
  add column if not exists zoho_payment_id text,
  add column if not exists zoho_sync_status text;

create index if not exists booking_requests_zoho_invoice_id_idx
  on public.booking_requests(zoho_invoice_id);
