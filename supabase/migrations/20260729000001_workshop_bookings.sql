-- ============================================================
-- 0009: Værksted og Service – booking af tider (service, dækskift,
--       bremser, klargøring til syn, reparation m.m.)
-- ============================================================

create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');

-- Sekvens til menneskelæsbare referencer (VAERK-2026-0001)
create sequence public.booking_reference_seq;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  -- Værkstedet er PR. BRAND (flere brands kan dele organisation/lager, men har
  -- hver deres værkstedskalender og egne bookinger).
  brand_key text not null,
  reference text not null unique,
  registration_number text not null,
  vehicle_make text,
  vehicle_model text,
  service_type text not null,
  service_note text,
  appointment_date date not null,
  appointment_time time not null,
  contact_name text not null,
  contact_email text not null check (contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  contact_phone text not null,
  status public.booking_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_bookings_updated before update on public.bookings
  for each row execute function public.set_updated_at();

-- Forhindrer dobbeltbooking: to (ikke-annullerede) bookinger kan ikke dele
-- samme BRAND, dato og tidsrum (værkstedet er pr. brand, ikke pr. organisation).
-- Annullerede bookinger frigiver tiden.
create unique index uidx_bookings_brand_date_time_active
  on public.bookings (brand_key, appointment_date, appointment_time)
  where (status <> 'cancelled');

create index idx_bookings_brand_date on public.bookings(brand_key, appointment_date);
create index idx_bookings_org_date on public.bookings(organization_id, appointment_date);
create index idx_bookings_org_status on public.bookings(organization_id, status);

-- ============================================================
-- Reference-sekvens (kaldes af submit-booking Edge Function via service role)
-- ============================================================
create or replace function public.nextval_booking_reference()
returns bigint
language sql
security definer set search_path = public
as $$
  select nextval('public.booking_reference_seq');
$$;

-- Kun service role må kalde funktionen (Edge Functions)
revoke all on function public.nextval_booking_reference() from public, anon, authenticated;

-- ============================================================
-- Offentlig, PII-fri opslagsfunktion: bruges af frontend til at gråtone
-- allerede bookede tidsrum. Returnerer KUN dato+tid, aldrig kontaktoplysninger.
-- ============================================================
drop function if exists public.get_booked_slots(uuid, date, date);

create or replace function public.get_booked_slots(p_brand_key text, p_from_date date, p_to_date date)
returns table (appointment_date date, appointment_time time)
language sql
stable
security definer set search_path = public
as $$
  select b.appointment_date, b.appointment_time
  from public.bookings b
  where b.brand_key = p_brand_key
    and b.status <> 'cancelled'
    and b.appointment_date between p_from_date and p_to_date;
$$;

-- ============================================================
-- RLS
--  * Bookinger oprettes UDELUKKENDE via Edge Functionen submit-booking
--    (service role), ligesom leads – ingen direkte anon insert.
--  * Offentlig tilgængelighedstjek sker via get_booked_slots() (PII-fri).
--  * Personale (dealer_admin/lead_agent) kan læse og opdatere egen organisations
--    bookinger.
-- ============================================================
alter table public.bookings enable row level security;

create policy bookings_member_select on public.bookings for select
  using (public.is_org_member(organization_id));

create policy bookings_agent_update on public.bookings for update
  using (
    public.is_org_admin(organization_id) or public.has_role(organization_id, 'lead_agent')
  );

create policy bookings_admin_delete on public.bookings for delete
  using (public.is_org_admin(organization_id));
