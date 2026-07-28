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
