-- ============================================================
-- 0001: Extensions, enums og hjælpefunktioner
-- ============================================================

create extension if not exists "pgcrypto";

-- Enums
create type public.app_role as enum ('superadmin', 'dealer_admin', 'editor', 'lead_agent');

create type public.vehicle_status as enum ('draft', 'scheduled', 'published', 'reserved', 'sold', 'archived');

create type public.fuel_type as enum ('benzin', 'diesel', 'el', 'hybrid', 'plugin_hybrid', 'andet');

create type public.transmission_type as enum ('manuel', 'automatisk');

create type public.lead_status as enum (
  'new', 'in_progress', 'contact_attempted', 'contacted', 'awaiting_info',
  'assessed', 'offer_sent', 'accepted', 'rejected', 'won', 'lost', 'archived'
);

create type public.inquiry_type as enum ('contact', 'test_drive', 'finance', 'trade_in');

create type public.consent_type as enum ('processing', 'marketing');

create type public.email_status as enum ('queued', 'sent', 'failed');

-- Automatisk updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
-- ============================================================
-- 0002: Organisationer, brands, profiler, medlemskaber, roller
-- ============================================================

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_organizations_updated before update on public.organizations
  for each row execute function public.set_updated_at();

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  brand_key text not null unique check (brand_key in ('autohuset-vest', 'autohuset-v')),
  name text not null,
  domain text,
  colors jsonb not null default '{}'::jsonb,
  logo_path text,
  legal_name text,
  cvr text,
  address text,
  phone text,
  email text,
  lead_email text,
  opening_hours jsonb not null default '[]'::jsonb,
  social jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  lead_reference_prefix text not null default 'LEAD',
  lead_response_time text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_brands_updated before update on public.brands
  for each row execute function public.set_updated_at();

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Opret automatisk profil ved ny auth-bruger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);
create index idx_org_members_profile on public.organization_members(profile_id);
create index idx_org_members_org on public.organization_members(organization_id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (organization_id, profile_id, role)
);
create index idx_user_roles_profile on public.user_roles(profile_id);

-- ============================================================
-- Security definer-funktioner til RLS (undgår rekursive politikker)
-- ============================================================

-- Organisationer den aktuelle bruger er medlem af
create or replace function public.user_org_ids()
returns setof uuid
language sql
stable
security definer set search_path = public
as $$
  select organization_id from public.organization_members where profile_id = auth.uid();
$$;

-- Har brugeren en given rolle i en organisation?
create or replace function public.has_role(org_id uuid, required_role public.app_role)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where profile_id = auth.uid()
      and organization_id = org_id
      and role = required_role
  );
$$;

-- Superadmin har adgang på tværs; øvrige roller er org-bundne
create or replace function public.is_org_admin(org_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.has_role(org_id, 'superadmin') or public.has_role(org_id, 'dealer_admin');
$$;

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where profile_id = auth.uid() and organization_id = org_id
  );
$$;
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
-- ============================================================
-- 0004: Leads (salgsvurdering) med kontakt, snapshot, tilstand,
--       billeder, noter, tildeling, historik, samtykke, attribution
-- ============================================================

-- Sekvens pr. år til menneskelæsbare referencer (AVEST-2026-0001)
create sequence public.lead_reference_seq;

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  reference text not null unique,
  status public.lead_status not null default 'new',
  lost_reason text,
  registration_number text not null,
  mileage_km int check (mileage_km >= 0),
  source text not null default 'website',
  assigned_to uuid references public.profiles(id),
  follow_up_at timestamptz,
  anonymized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger trg_leads_updated before update on public.leads
  for each row execute function public.set_updated_at();
create index idx_leads_org_status on public.leads(organization_id, status) where deleted_at is null;
create index idx_leads_org_created on public.leads(organization_id, created_at desc);

create table public.lead_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  lead_id uuid not null unique references public.leads(id) on delete cascade,
  name text not null,
  phone text not null,
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  postal_code text,
  city text,
  preferred_channel text check (preferred_channel in ('phone', 'email', 'sms')),
  best_contact_time text,
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_lead_contacts_updated before update on public.lead_contacts
  for each row execute function public.set_updated_at();

create table public.lead_vehicle_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  lead_id uuid not null unique references public.leads(id) on delete cascade,
  provider text not null, -- 'mock' | 'motorapi' | ... | 'manual'
  is_mock boolean not null default false,
  registration_number text not null,
  make text,
  model text,
  variant text,
  model_year int,
  first_registration_date date,
  fuel_type text,
  transmission text,
  body_type text,
  color text,
  engine_size numeric(4,1),
  power_hp int,
  power_kw int,
  battery_capacity_kwh numeric(6,1),
  electric_range_km int,
  curb_weight_kg int,
  total_weight_kg int,
  registration_status text,
  inspection_date date,
  next_inspection_date date,
  equipment text[] not null default '{}',
  raw_provider_data jsonb, -- kun hvis leverandørens licens tillader lagring
  looked_up_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.lead_condition_answers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  lead_id uuid not null unique references public.leads(id) on delete cascade,
  is_drivable boolean,
  has_service_book boolean,
  last_service text,
  key_count int check (key_count between 0 and 10),
  known_damages text,
  scratches_dents text,
  warning_lights text,
  mechanical_issues text,
  tire_condition text,
  interior_condition text,
  smoke_free boolean,
  previous_damages text,
  is_imported boolean,
  has_outstanding_finance boolean,
  finance_details text,
  leasing_status text,
  sale_timeline text,
  comment text,
  created_at timestamptz not null default now()
);

create table public.lead_images (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  lead_id uuid not null references public.leads(id) on delete cascade,
  storage_path text not null, -- privat bucket 'lead-images'
  category text check (category in ('front','back','driver_side','passenger_side','interior','dashboard','damage','extra')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index idx_lead_images_lead on public.lead_images(lead_id, sort_order);

create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  lead_id uuid not null references public.leads(id) on delete cascade,
  author_id uuid references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);
create index idx_lead_notes_lead on public.lead_notes(lead_id, created_at desc);

create table public.lead_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  lead_id uuid not null references public.leads(id) on delete cascade,
  assigned_to uuid references public.profiles(id),
  assigned_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.lead_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  lead_id uuid not null references public.leads(id) on delete cascade,
  from_status public.lead_status,
  to_status public.lead_status not null,
  comment text,
  changed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index idx_lead_status_history_lead on public.lead_status_history(lead_id);

create or replace function public.log_lead_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.lead_status_history (organization_id, lead_id, from_status, to_status, changed_by)
    values (new.organization_id, new.id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.lead_status_history (organization_id, lead_id, from_status, to_status, changed_by)
    values (new.organization_id, new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;
create trigger trg_leads_status_log_ins after insert on public.leads
  for each row execute function public.log_lead_status_change();
create trigger trg_leads_status_log_upd after update on public.leads
  for each row execute function public.log_lead_status_change();

create table public.lead_consents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  lead_id uuid not null references public.leads(id) on delete cascade,
  consent_type public.consent_type not null,
  granted boolean not null,
  consent_text_version text not null,
  privacy_policy_version text not null,
  channels text[] not null default '{}', -- fx {email,sms} for marketing
  source text not null default 'sell_car_form',
  created_at timestamptz not null default now()
);
create index idx_lead_consents_lead on public.lead_consents(lead_id);

create table public.lead_attribution (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  lead_id uuid not null unique references public.leads(id) on delete cascade,
  landing_page text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  gclid text,
  fbclid text,
  device_type text,
  campaign_code text,
  created_at timestamptz not null default now()
);

create table public.lead_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  lead_id uuid not null references public.leads(id) on delete cascade,
  event_type text not null, -- created | email_sent | status_changed | anonymized | exported | ...
  payload jsonb not null default '{}'::jsonb,
  actor_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index idx_lead_events_lead on public.lead_events(lead_id, created_at desc);

-- ============================================================
-- GDPR-funktioner
-- ============================================================

-- Anonymiserer et lead (beholder statistik, fjerner persondata)
create or replace function public.anonymize_lead(p_lead_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org from public.leads where id = p_lead_id;
  if v_org is null or not public.is_org_admin(v_org) then
    raise exception 'Ingen adgang';
  end if;

  update public.lead_contacts set
    name = 'Anonymiseret', phone = '', email = 'anonymiseret@example.invalid',
    postal_code = null, city = null, message = null, best_contact_time = null
  where lead_id = p_lead_id;

  update public.leads set
    registration_number = 'ANONYM', anonymized_at = now()
  where id = p_lead_id;

  update public.lead_vehicle_snapshots set
    registration_number = 'ANONYM', raw_provider_data = null
  where lead_id = p_lead_id;

  delete from public.lead_images where lead_id = p_lead_id;

  insert into public.lead_events (organization_id, lead_id, event_type, actor_id)
  values (v_org, p_lead_id, 'anonymized', auth.uid());
end;
$$;

-- Samlet eksport af en persons oplysninger for et lead (til indsigtsbegæringer)
create or replace function public.export_lead_data(p_lead_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_org uuid;
  v_result jsonb;
begin
  select organization_id into v_org from public.leads where id = p_lead_id;
  if v_org is null or not public.is_org_admin(v_org) then
    raise exception 'Ingen adgang';
  end if;

  select jsonb_build_object(
    'lead', to_jsonb(l),
    'contact', to_jsonb(c),
    'vehicle_snapshot', to_jsonb(s),
    'condition', to_jsonb(ca),
    'consents', coalesce((select jsonb_agg(to_jsonb(x)) from public.lead_consents x where x.lead_id = p_lead_id), '[]'::jsonb),
    'attribution', to_jsonb(a)
  ) into v_result
  from public.leads l
  left join public.lead_contacts c on c.lead_id = l.id
  left join public.lead_vehicle_snapshots s on s.lead_id = l.id
  left join public.lead_condition_answers ca on ca.lead_id = l.id
  left join public.lead_attribution a on a.lead_id = l.id
  where l.id = p_lead_id;

  insert into public.lead_events (organization_id, lead_id, event_type, actor_id)
  values (v_org, p_lead_id, 'exported', auth.uid());

  return v_result;
end;
$$;

-- Konfigurerbare retentionregler (håndhæves først når virksomheden har godkendt perioderne)
create table public.retention_policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  data_type text not null, -- fx 'leads_lost', 'leads_won', 'inquiries', 'lookup_logs'
  retention_days int check (retention_days > 0),
  action text not null default 'anonymize' check (action in ('anonymize', 'delete')),
  approved_by text, -- navn på godkender – reglen er inaktiv indtil udfyldt
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, data_type)
);
create trigger trg_retention_policies_updated before update on public.retention_policies
  for each row execute function public.set_updated_at();
-- ============================================================
-- 0005: Integrationer, logs, CMS og konfiguration
-- ============================================================

create table public.vehicle_lookup_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  plate_hash text not null, -- sha256 af normaliseret plade; rå plade logges ikke
  provider text not null,
  status text not null check (status in ('success','not_found','error','rate_limited','disabled')),
  duration_ms int,
  error_code text,
  ip_hash text, -- hashet IP til rate limiting/misbrugsanalyse
  created_at timestamptz not null default now()
);
create index idx_lookup_logs_created on public.vehicle_lookup_logs(created_at desc);
create index idx_lookup_logs_ip on public.vehicle_lookup_logs(ip_hash, created_at desc);

create table public.integration_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  key text not null, -- fx 'vehicle_lookup_provider', 'plate_lookup_enabled', 'gtm_id'
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, key)
);
create trigger trg_integration_settings_updated before update on public.integration_settings
  for each row execute function public.set_updated_at();
-- BEMÆRK: hemmelige API-nøgler gemmes ALDRIG her – kun i Supabase function secrets.

create table public.email_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  inquiry_id uuid references public.vehicle_inquiries(id) on delete set null,
  direction text not null default 'outbound',
  template text not null, -- 'lead_notification' | 'lead_confirmation' | ...
  to_address text not null,
  status public.email_status not null default 'queued',
  provider text,
  provider_message_id text,
  error text,
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_email_logs_updated before update on public.email_logs
  for each row execute function public.set_updated_at();
create index idx_email_logs_lead on public.email_logs(lead_id);

create table public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  target text not null,
  event_type text not null,
  payload jsonb,
  status text not null,
  response_code int,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  actor_id uuid references public.profiles(id),
  action text not null, -- fx 'vehicle.delete', 'settings.update', 'lead.anonymize'
  entity_type text,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_log_org on public.audit_log(organization_id, created_at desc);

-- ============================================================
-- CMS og konfiguration
-- ============================================================

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  key text not null, -- fx 'hero', 'homepage_texts', 'seo_defaults', 'usp_items'
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, key)
);
create trigger trg_site_settings_updated before update on public.site_settings
  for each row execute function public.set_updated_at();

create table public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location text not null default 'header' check (location in ('header','footer')),
  label text not null,
  path text not null,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_navigation_items_updated before update on public.navigation_items
  for each row execute function public.set_updated_at();

create table public.content_sections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  page text not null, -- 'home' | 'about' | 'financing' | ...
  section_key text not null,
  content jsonb not null,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, page, section_key)
);
create trigger trg_content_sections_updated before update on public.content_sections
  for each row execute function public.set_updated_at();

create table public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  slug text not null, -- 'privatlivspolitik' | 'cookiepolitik' | ...
  title text not null,
  body_markdown text not null,
  version text not null default '0.1',
  status text not null default 'draft' check (status in ('draft','approved')),
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug, version)
);
create trigger trg_legal_documents_updated before update on public.legal_documents
  for each row execute function public.set_updated_at();

create table public.faq_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  question text not null,
  answer text not null,
  category text not null default 'general', -- 'general' | 'sell' | 'finance'
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_faq_items_updated before update on public.faq_items
  for each row execute function public.set_updated_at();

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  author_name text not null,
  body text not null,
  rating int check (rating between 1 and 5),
  source text not null default 'placeholder', -- 'placeholder' | 'manual' | 'trustpilot' | 'google'
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_testimonials_updated before update on public.testimonials
  for each row execute function public.set_updated_at();

create table public.opening_hours (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  label text not null,
  hours text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_opening_hours_updated before update on public.opening_hours
  for each row execute function public.set_updated_at();
-- ============================================================
-- 0006: Row Level Security – tenant-isolation og rollebaseret adgang
--
-- Principper:
--  * anon        = offentlige besøgende (ingen login). Kan kun læse offentligt indhold
--                  og oprette bilforespørgsler. Leads oprettes KUN via Edge Function (service role).
--  * authenticated = personale. Selvregistrering skal være slået FRA i Supabase Auth
--                  (kun invitationer) – dokumenteret i README.
--  * Al adgang er bundet til organization_id via security definer-funktionerne
--    user_org_ids(), is_org_member(), is_org_admin(), has_role().
-- ============================================================

-- ---------- Organisationer og brugere ----------
alter table public.organizations enable row level security;
create policy org_select on public.organizations for select
  using (public.is_org_member(id));

alter table public.brands enable row level security;
create policy brands_public_select on public.brands for select using (true);
create policy brands_admin_update on public.brands for update
  using (public.is_org_admin(organization_id));

alter table public.profiles enable row level security;
create policy profiles_select on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from public.organization_members m1
      join public.organization_members m2 on m1.organization_id = m2.organization_id
      where m1.profile_id = auth.uid() and m2.profile_id = profiles.id
    )
  );
create policy profiles_update_own on public.profiles for update
  using (id = auth.uid());

alter table public.organization_members enable row level security;
create policy org_members_select on public.organization_members for select
  using (public.is_org_member(organization_id));
create policy org_members_admin_write on public.organization_members for all
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

alter table public.user_roles enable row level security;
create policy user_roles_select on public.user_roles for select
  using (public.is_org_member(organization_id));
create policy user_roles_admin_write on public.user_roles for all
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

-- ---------- Biler ----------
alter table public.vehicles enable row level security;

-- Offentligt: kun publicerede/reserverede/solgte biler, aldrig kladder eller slettede
create policy vehicles_public_select on public.vehicles for select
  using (status in ('published', 'reserved', 'sold') and deleted_at is null);

-- Personale: alle egne organisationers biler
create policy vehicles_member_select on public.vehicles for select
  using (public.is_org_member(organization_id));

create policy vehicles_editor_insert on public.vehicles for insert
  with check (
    public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor')
  );
create policy vehicles_editor_update on public.vehicles for update
  using (
    public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor')
  );
create policy vehicles_admin_delete on public.vehicles for delete
  using (public.is_org_admin(organization_id));

-- Kolonnebeskyttelse: anonyme besøgende kan ALDRIG læse vin/internal_notes.
revoke select on public.vehicles from anon;
grant select (
  id, organization_id, make, model, variant, model_year, first_registration,
  mileage_km, price_dkk, monthly_price_dkk, fuel_type, transmission, body_type,
  color, doors, seats, power_hp, engine, battery_kwh, range_km, consumption,
  tax_period_dkk, registration_number, show_registration_number, description,
  equipment, badges, is_featured, seo_title, seo_description, slug, status,
  publish_at, sold_at, created_at, updated_at, deleted_at
) on public.vehicles to anon;

alter table public.vehicle_images enable row level security;
create policy vehicle_images_public_select on public.vehicle_images for select
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id
        and v.status in ('published', 'reserved', 'sold')
        and v.deleted_at is null
    )
    or public.is_org_member(organization_id)
  );
create policy vehicle_images_editor_write on public.vehicle_images for all
  using (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'))
  with check (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'));

alter table public.vehicle_status_history enable row level security;
create policy vehicle_status_history_select on public.vehicle_status_history for select
  using (public.is_org_member(organization_id));

alter table public.vehicle_views enable row level security;
create policy vehicle_views_select on public.vehicle_views for select
  using (public.is_org_member(organization_id));
-- Skrivning sker udelukkende via increment_vehicle_view() (security definer)

alter table public.vehicle_inquiries enable row level security;
-- Offentlig formular må oprette forespørgsler (rate limiting + honeypot håndhæves i Edge Function/klient)
create policy vehicle_inquiries_public_insert on public.vehicle_inquiries for insert
  with check (status = 'new' and handled_by is null);
create policy vehicle_inquiries_member_select on public.vehicle_inquiries for select
  using (public.is_org_member(organization_id));
create policy vehicle_inquiries_member_update on public.vehicle_inquiries for update
  using (
    public.is_org_admin(organization_id) or public.has_role(organization_id, 'lead_agent')
  );

alter table public.favorites enable row level security;
-- Anonyme favoritter håndteres klient-side; tabellen er kun for indloggede
create policy favorites_own on public.favorites for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ---------- Leads: KUN personale. Oprettelse sker via Edge Function (service role). ----------
alter table public.leads enable row level security;
create policy leads_member_select on public.leads for select
  using (public.is_org_member(organization_id));
create policy leads_agent_update on public.leads for update
  using (
    public.is_org_admin(organization_id) or public.has_role(organization_id, 'lead_agent')
  );
create policy leads_admin_delete on public.leads for delete
  using (public.is_org_admin(organization_id));

alter table public.lead_contacts enable row level security;
create policy lead_contacts_member_select on public.lead_contacts for select
  using (public.is_org_member(organization_id));

alter table public.lead_vehicle_snapshots enable row level security;
create policy lead_snapshots_member_select on public.lead_vehicle_snapshots for select
  using (public.is_org_member(organization_id));

alter table public.lead_condition_answers enable row level security;
create policy lead_condition_member_select on public.lead_condition_answers for select
  using (public.is_org_member(organization_id));

alter table public.lead_images enable row level security;
create policy lead_images_member_select on public.lead_images for select
  using (public.is_org_member(organization_id));

alter table public.lead_notes enable row level security;
create policy lead_notes_member_select on public.lead_notes for select
  using (public.is_org_member(organization_id));
create policy lead_notes_member_insert on public.lead_notes for insert
  with check (public.is_org_member(organization_id) and author_id = auth.uid());

alter table public.lead_assignments enable row level security;
create policy lead_assignments_member_select on public.lead_assignments for select
  using (public.is_org_member(organization_id));
create policy lead_assignments_agent_insert on public.lead_assignments for insert
  with check (
    public.is_org_admin(organization_id) or public.has_role(organization_id, 'lead_agent')
  );

alter table public.lead_status_history enable row level security;
create policy lead_status_history_member_select on public.lead_status_history for select
  using (public.is_org_member(organization_id));

alter table public.lead_consents enable row level security;
create policy lead_consents_member_select on public.lead_consents for select
  using (public.is_org_member(organization_id));

alter table public.lead_attribution enable row level security;
create policy lead_attribution_member_select on public.lead_attribution for select
  using (public.is_org_member(organization_id));

alter table public.lead_events enable row level security;
create policy lead_events_member_select on public.lead_events for select
  using (public.is_org_member(organization_id));

alter table public.retention_policies enable row level security;
create policy retention_admin_all on public.retention_policies for all
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

-- ---------- Integrationer og logs ----------
alter table public.vehicle_lookup_logs enable row level security;
create policy lookup_logs_admin_select on public.vehicle_lookup_logs for select
  using (organization_id is not null and public.is_org_admin(organization_id));

alter table public.integration_settings enable row level security;
create policy integration_settings_member_select on public.integration_settings for select
  using (public.is_org_member(organization_id));
create policy integration_settings_admin_write on public.integration_settings for all
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

alter table public.email_logs enable row level security;
create policy email_logs_admin_select on public.email_logs for select
  using (organization_id is not null and public.is_org_admin(organization_id));

alter table public.webhook_logs enable row level security;
create policy webhook_logs_admin_select on public.webhook_logs for select
  using (organization_id is not null and public.is_org_admin(organization_id));

alter table public.audit_log enable row level security;
create policy audit_log_admin_select on public.audit_log for select
  using (organization_id is not null and public.is_org_admin(organization_id));
create policy audit_log_member_insert on public.audit_log for insert
  with check (public.is_org_member(organization_id) and actor_id = auth.uid());

-- ---------- CMS og konfiguration ----------
alter table public.site_settings enable row level security;
create policy site_settings_public_select on public.site_settings for select using (true);
create policy site_settings_admin_write on public.site_settings for all
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

alter table public.navigation_items enable row level security;
create policy navigation_public_select on public.navigation_items for select
  using (is_visible or public.is_org_member(organization_id));
create policy navigation_editor_write on public.navigation_items for all
  using (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'))
  with check (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'));

alter table public.content_sections enable row level security;
create policy content_public_select on public.content_sections for select
  using (is_visible or public.is_org_member(organization_id));
create policy content_editor_write on public.content_sections for all
  using (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'))
  with check (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'));

alter table public.legal_documents enable row level security;
create policy legal_public_select on public.legal_documents for select using (true);
create policy legal_admin_write on public.legal_documents for all
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

alter table public.faq_items enable row level security;
create policy faq_public_select on public.faq_items for select
  using (is_visible or public.is_org_member(organization_id));
create policy faq_editor_write on public.faq_items for all
  using (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'))
  with check (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'));

alter table public.testimonials enable row level security;
create policy testimonials_public_select on public.testimonials for select
  using (is_visible or public.is_org_member(organization_id));
create policy testimonials_editor_write on public.testimonials for all
  using (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'))
  with check (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'));

alter table public.opening_hours enable row level security;
create policy opening_hours_public_select on public.opening_hours for select using (true);
create policy opening_hours_admin_write on public.opening_hours for all
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));
-- ============================================================
-- 0007: Storage-buckets og -politikker
--  * vehicle-images: offentlig læsning, kun personale skriver
--  * brand-assets:   offentlig læsning (logoer), kun admin skriver
--  * lead-images:    PRIVAT – kun personale læser (via signerede URL'er),
--                    upload sker via Edge Function (service role)
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('vehicle-images', 'vehicle-images', true, 10485760, array['image/jpeg','image/png','image/webp','image/avif']),
  ('brand-assets', 'brand-assets', true, 5242880, array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('lead-images', 'lead-images', false, 10485760, array['image/jpeg','image/png','image/webp','image/avif','image/heic'])
on conflict (id) do nothing;

-- Objektstien SKAL starte med organization_id: "<org_id>/<...>/fil.jpg"
-- så politikkerne kan håndhæve tenant-isolation på filniveau.

create policy "vehicle images public read" on storage.objects for select
  using (bucket_id = 'vehicle-images');

create policy "vehicle images staff write" on storage.objects for insert
  with check (
    bucket_id = 'vehicle-images'
    and (
      public.is_org_admin(((storage.foldername(name))[1])::uuid)
      or public.has_role(((storage.foldername(name))[1])::uuid, 'editor')
    )
  );

create policy "vehicle images staff update" on storage.objects for update
  using (
    bucket_id = 'vehicle-images'
    and (
      public.is_org_admin(((storage.foldername(name))[1])::uuid)
      or public.has_role(((storage.foldername(name))[1])::uuid, 'editor')
    )
  );

create policy "vehicle images staff delete" on storage.objects for delete
  using (
    bucket_id = 'vehicle-images'
    and (
      public.is_org_admin(((storage.foldername(name))[1])::uuid)
      or public.has_role(((storage.foldername(name))[1])::uuid, 'editor')
    )
  );

create policy "brand assets public read" on storage.objects for select
  using (bucket_id = 'brand-assets');

create policy "brand assets admin write" on storage.objects for all
  using (
    bucket_id = 'brand-assets'
    and public.is_org_admin(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'brand-assets'
    and public.is_org_admin(((storage.foldername(name))[1])::uuid)
  );

-- Leadbilleder: INGEN offentlig adgang. Kun medlemmer af den ejende organisation
-- kan læse (adminpanelet genererer signerede URL'er). Upload sker via Edge Function.
create policy "lead images staff read" on storage.objects for select
  using (
    bucket_id = 'lead-images'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

create policy "lead images staff delete" on storage.objects for delete
  using (
    bucket_id = 'lead-images'
    and public.is_org_admin(((storage.foldername(name))[1])::uuid)
  );
-- ============================================================
-- 0008: Hjælpefunktion til leadreferencer (kaldes af submit-lead
--       Edge Function via service role)
-- ============================================================

create or replace function public.nextval_lead_reference()
returns bigint
language sql
security definer set search_path = public
as $$
  select nextval('public.lead_reference_seq');
$$;

-- Kun service role må kalde funktionen (Edge Functions)
revoke all on function public.nextval_lead_reference() from public, anon, authenticated;
