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
