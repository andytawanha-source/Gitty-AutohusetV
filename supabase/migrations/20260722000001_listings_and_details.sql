-- ============================================================
-- 0009: Salgsbiler vs. lejebiler + type-specifikke detaljer
--
-- Genbruger den eksisterende vehicles-tabel til begge annoncetyper
-- (langt de fleste felter er identiske), og tilføjer to 1:1-sidetabeller
-- med de felter, der kun giver mening for hhv. salg og udlejning.
-- ============================================================

alter table public.vehicles
  add column if not exists listing_type text not null default 'sale'
    check (listing_type in ('sale', 'rental'));

create index if not exists vehicles_listing_type_idx on public.vehicles (organization_id, listing_type);

-- ---------- Salgsspecifikke detaljer ----------
create table if not exists public.sale_details (
  vehicle_id uuid primary key references public.vehicles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  down_payment_dkk numeric check (down_payment_dkk >= 0),
  delivery_cost_dkk numeric check (delivery_cost_dkk >= 0),
  warranty_text text,
  service_history_text text,
  last_service_date date,
  owner_count integer check (owner_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sale_details enable row level security;

create policy sale_details_member_select on public.sale_details for select
  using (public.is_org_member(organization_id));
create policy sale_details_write on public.sale_details for all
  using (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'))
  with check (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'));

-- ---------- Udlejningsspecifikke detaljer ----------
create table if not exists public.rental_details (
  vehicle_id uuid primary key references public.vehicles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  price_per_day_dkk numeric check (price_per_day_dkk >= 0),
  price_per_week_dkk numeric check (price_per_week_dkk >= 0),
  price_per_month_dkk numeric check (price_per_month_dkk >= 0),
  deposit_dkk numeric check (deposit_dkk >= 0),
  included_km_per_day integer check (included_km_per_day >= 0),
  extra_km_price_dkk numeric check (extra_km_price_dkk >= 0),
  min_age integer check (min_age >= 0),
  license_requirement text,
  availability_status text not null default 'available'
    check (availability_status in ('available', 'booked', 'maintenance')),
  pickup_location text,
  insurance_info text,
  extra_fees_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rental_details enable row level security;

create policy rental_details_member_select on public.rental_details for select
  using (public.is_org_member(organization_id));
create policy rental_details_write on public.rental_details for all
  using (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'))
  with check (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'));

-- updated_at-triggere (samme mønster som resten af skemaet)
create trigger sale_details_set_updated_at
  before update on public.sale_details
  for each row execute function public.set_updated_at();

create trigger rental_details_set_updated_at
  before update on public.rental_details
  for each row execute function public.set_updated_at();
