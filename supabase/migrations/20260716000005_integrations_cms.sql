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
