-- The Venue Search: Supabase production foundation
create extension if not exists pgcrypto;
create type public.app_role as enum ('couple','planner','venue_owner','admin');
create type public.venue_status as enum ('draft','published','paused');
create type public.booking_mode as enum ('enquiry','hold','instant_book');
create type public.booking_status as enum ('requested','held','payment_pending','confirmed','cancelled','expired');
create table public.profiles(id uuid primary key references auth.users(id) on delete cascade,full_name text,email text unique,mobile text,role public.app_role default 'couple',created_at timestamptz default now());
create table public.venues(id uuid primary key default gen_random_uuid(),name text not null,slug text unique not null,city text not null default 'Udaipur',type text,description text,capacity_min int,capacity_max int not null,indicative_price numeric not null,hold_fee numeric,latitude numeric,longitude numeric,address text,status public.venue_status default 'draft',featured boolean default false,created_at timestamptz default now(),updated_at timestamptz default now());
create table public.venue_images(id uuid primary key default gen_random_uuid(),venue_id uuid references public.venues(id) on delete cascade,image_url text not null,alt_text text,sort_order int default 0);
create table public.venue_spaces(id uuid primary key default gen_random_uuid(),venue_id uuid references public.venues(id) on delete cascade,name text not null,capacity int,space_type text);
create table public.venue_availability(id uuid primary key default gen_random_uuid(),venue_id uuid references public.venues(id) on delete cascade,event_date date not null,status text not null default 'available',unique(venue_id,event_date));
create table public.weddings(id uuid primary key default gen_random_uuid(),owner_id uuid references public.profiles(id),title text not null,city text default 'Udaipur',created_at timestamptz default now());
create table public.booking_requests(id uuid primary key default gen_random_uuid(),wedding_id uuid references public.weddings(id) on delete set null,venue_id uuid references public.venues(id),user_id uuid references public.profiles(id),event_date date not null,guest_count int,event_type text,mode public.booking_mode not null,notes text,status public.booking_status default 'requested',hold_fee numeric,hold_expires_at timestamptz,payment_order_id text,payment_id text,created_at timestamptz default now(),updated_at timestamptz default now());
create unique index confirmed_venue_date_unique on public.booking_requests(venue_id,event_date) where status in ('held','payment_pending','confirmed');
create table public.wishlist(id uuid primary key default gen_random_uuid(),user_id uuid references public.profiles(id) on delete cascade,venue_id uuid references public.venues(id) on delete cascade,created_at timestamptz default now(),unique(user_id,venue_id));
create table public.enquiries(id uuid primary key default gen_random_uuid(),user_id uuid references public.profiles(id),venue_id uuid references public.venues(id),full_name text,email text,mobile text,event_date date,guest_count int,event_type text,budget text,message text,status text default 'new',created_at timestamptz default now());
create table public.audit_log(id uuid primary key default gen_random_uuid(),actor_id uuid references public.profiles(id),action text not null,entity_type text,entity_id uuid,metadata jsonb,created_at timestamptz default now());

alter table public.profiles enable row level security; alter table public.venues enable row level security; alter table public.venue_images enable row level security; alter table public.venue_spaces enable row level security; alter table public.venue_availability enable row level security; alter table public.weddings enable row level security; alter table public.booking_requests enable row level security; alter table public.wishlist enable row level security; alter table public.enquiries enable row level security;
create policy "published venues readable" on public.venues for select using(status='published');
create policy "venue images readable" on public.venue_images for select using(exists(select 1 from public.venues v where v.id=venue_id and v.status='published'));
create policy "spaces readable" on public.venue_spaces for select using(exists(select 1 from public.venues v where v.id=venue_id and v.status='published'));
create policy "availability readable" on public.venue_availability for select using(true);
create policy "own profile" on public.profiles for select using(auth.uid()=id); create policy "own profile update" on public.profiles for update using(auth.uid()=id);
create policy "own wishlist" on public.wishlist for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "own weddings" on public.weddings for all using(auth.uid()=owner_id) with check(auth.uid()=owner_id);
create policy "own bookings" on public.booking_requests for select using(auth.uid()=user_id);
create policy "create booking" on public.booking_requests for insert with check(auth.uid()=user_id);
create policy "own enquiries" on public.enquiries for insert with check(auth.uid()=user_id or user_id is null);

create or replace function public.set_hold_fee(p_price numeric) returns numeric language sql immutable as $$ select least(75000,greatest(15000,round(p_price*0.10))) $$;
create or replace function public.create_venue_hold(p_venue_id uuid,p_event_date date,p_user_id uuid,p_guest_count int,p_event_type text) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_price numeric; v_fee numeric;
begin
 select indicative_price into v_price from venues where id=p_venue_id and status='published' for update;
 if v_price is null then raise exception 'Venue not available'; end if;
 if exists(select 1 from booking_requests where venue_id=p_venue_id and event_date=p_event_date and status in ('held','payment_pending','confirmed')) then raise exception 'This venue date is no longer available'; end if;
 v_fee:=set_hold_fee(v_price);
 insert into booking_requests(venue_id,user_id,event_date,guest_count,event_type,mode,status,hold_fee,hold_expires_at) values(p_venue_id,p_user_id,p_event_date,p_guest_count,p_event_type,'hold','held',v_fee,now()+interval '72 hours') returning id into v_id;
 return jsonb_build_object('booking_id',v_id,'hold_fee',v_fee,'expires_at',now()+interval '72 hours');
end $$;

create or replace function public.expire_holds() returns void language sql security definer as $$ update public.booking_requests set status='expired',updated_at=now() where status='held' and hold_expires_at<now(); $$;

insert into public.venues(name,slug,city,type,description,capacity_min,capacity_max,indicative_price,hold_fee,status,featured) values
('The Leela Palace Udaipur','the-leela-palace-udaipur','Udaipur','Luxury Palace','A lakefront palace experience with grand lawns, intimate courtyards and cinematic views of Lake Pichola.',100,500,1250000,75000,'published',true),
('Raffles Udaipur','raffles-udaipur','Udaipur','Island Resort','An immersive island resort designed for multi-day celebrations and intimate destination weddings.',80,300,1100000,75000,'published',true),
('Taj Lake Palace','taj-lake-palace','Udaipur','Heritage Palace','A timeless lake palace setting for elegant celebrations, ceremonies and private events.',60,250,950000,75000,'published',true),
('The Oberoi Udaivilas','the-oberoi-udaivilas','Udaipur','Luxury Resort','Palatial architecture, manicured gardens and exceptional hospitality for high-touch celebrations.',100,450,1350000,75000,'published',true),
('Aurika Udaipur','aurika-udaipur','Udaipur','Hilltop Resort','A contemporary destination wedding canvas with expansive views and flexible event spaces.',80,350,700000,70000,'published',false),
('Ananta Udaipur','ananta-udaipur','Udaipur','Resort','A large-format resort suited to energetic celebrations, guest stays and multi-event wedding weekends.',100,600,650000,65000,'published',false)
 on conflict (slug) do nothing;

-- Auth profile trigger
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,email,full_name,mobile,role) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'username',new.raw_user_meta_data->>'full_name',''),coalesce(new.raw_user_meta_data->>'mobile',new.raw_user_meta_data->>'phone',''),case when lower(new.email)='thevenuesearch@gmail.com' then 'admin'::app_role else 'couple'::app_role end) on conflict(id) do update set email=excluded.email,full_name=coalesce(nullif(excluded.full_name,''),public.profiles.full_name),mobile=coalesce(nullif(excluded.mobile,''),public.profiles.mobile); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users; create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
