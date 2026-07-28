-- ============================================================
-- 0003: Biler, billeder, udstyr, historik, visninger, forespørgsler, favoritter
-- ============================================================

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  make text not null,
  model text not null,
  variant text,
  model_year int check (model_year between 1900 and 2100),
  first_registration date,
  mileage_km int check (mileage_km >= 0),
  price_dkk int check (price_dkk >= 0),
  monthly_price_dkk int check (monthly_price_dkk >= 0),
  fuel_type public.fuel_type,
  transmission public.transmission_type,
  body_type text,
  color text,
  doors int check (doors between 2 and 6),
  seats int check (seats between 1 and 9),
  power_hp int check (power_hp >= 0),
  engine text,
  battery_kwh numeric(6,1),
  range_km int,
  consumption text,
  tax_period_dkk int,
  registration_number text,
  show_registration_number boolean not null default false,
  vin text, -- privat adminfelt, eksponeres aldrig offentligt (se RLS + view)
  description text,
  internal_notes text, -- privat adminfelt
  equipment text[] not null default '{}',
  badges text[] not null default '{}',
  is_featured boolean not null default false,
  seo_title text,
  seo_description text,
  slug text not null,
  status public.vehicle_status not null default 'draft',
  publish_at timestamptz,
  sold_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, slug)
);
create trigger trg_vehicles_updated before update on public.vehicles
  for each row execute function public.set_updated_at();
create index idx_vehicles_org_status on public.vehicles(organization_id, status) where deleted_at is null;
create index idx_vehicles_slug on public.vehicles(organization_id, slug);
create index idx_vehicles_make_model on public.vehicles(organization_id, make, model);
create index idx_vehicles_price on public.vehicles(organization_id, price_dkk);

create table public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_vehicle_images_updated before update on public.vehicle_images
  for each row execute function public.set_updated_at();
create index idx_vehicle_images_vehicle on public.vehicle_images(vehicle_id, sort_order);

create table public.vehicle_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  from_status public.vehicle_status,
  to_status public.vehicle_status not null,
  changed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index idx_vehicle_status_history_vehicle on public.vehicle_status_history(vehicle_id);

-- Statusskift logges automatisk
create or replace function public.log_vehicle_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.vehicle_status_history (organization_id, vehicle_id, from_status, to_status, changed_by)
    values (new.organization_id, new.id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.vehicle_status_history (organization_id, vehicle_id, from_status, to_status, changed_by)
    values (new.organization_id, new.id, old.status, new.status, auth.uid());
    if new.status = 'sold' and new.sold_at is null then
      new.sold_at = now();
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_vehicles_status_log_ins after insert on public.vehicles
  for each row execute function public.log_vehicle_status_change();
create trigger trg_vehicles_status_log_upd before update on public.vehicles
  for each row execute function public.log_vehicle_status_change();

-- Aggregeret, anonym visningstælling (én række pr. bil pr. dag)
create table public.vehicle_views (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  view_date date not null default current_date,
  view_count int not null default 0,
  unique (vehicle_id, view_date)
);

create or replace function public.increment_vehicle_view(p_vehicle_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org from public.vehicles
    where id = p_vehicle_id and status in ('published','reserved') and deleted_at is null;
  if v_org is null then return; end if;
  insert into public.vehicle_views (organization_id, vehicle_id, view_date, view_count)
  values (v_org, p_vehicle_id, current_date, 1)
  on conflict (vehicle_id, view_date) do update set view_count = public.vehicle_views.view_count + 1;
end;
$$;

create table public.vehicle_inquiries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  inquiry_type public.inquiry_type not null default 'contact',
  name text not null,
  phone text,
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  message text,
  vehicle_snapshot jsonb, -- mærke/model/pris på henvendelsestidspunktet
  consent_processing boolean not null default false,
  consent_text_version text,
  attribution jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  handled_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_vehicle_inquiries_updated before update on public.vehicle_inquiries
  for each row execute function public.set_updated_at();
create index idx_vehicle_inquiries_org on public.vehicle_inquiries(organization_id, created_at desc);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  session_key text, -- anonyme favoritter uden login
  created_at timestamptz not null default now(),
  check (profile_id is not null or session_key is not null),
  unique (vehicle_id, profile_id),
  unique (vehicle_id, session_key)
);
