-- Fase 2: samlet leadindbakke på tværs af leads (sælg-din-bil/byttebil) og
-- vehicle_inquiries (kontakt/prøvetur/finansiering/leje). Vi slår IKKE de to
-- tabeller sammen (leads har GDPR-anonymisering/eksport bygget specifikt til
-- sit skema) – i stedet får vehicle_inquiries den samme statustaksonomi samt
-- noter/historik/opfølgning, så adminpanelet kan vise og behandle dem ensartet.

-- 1) Samme statustaksonomi som "leads", så filtre/badges kan genbruges 1:1.
-- Policyen herunder refererer til status-kolonnen og skal droppes/genskabes
-- omkring typeskiftet, ellers afviser Postgres ALTER COLUMN TYPE.
drop policy if exists vehicle_inquiries_public_insert on public.vehicle_inquiries;

alter table public.vehicle_inquiries alter column status drop default;
alter table public.vehicle_inquiries
  alter column status type public.lead_status using (
    case when status in (
      'new','in_progress','contact_attempted','contacted','awaiting_info',
      'assessed','offer_sent','accepted','rejected','won','lost','archived'
    ) then status::public.lead_status else 'new'::public.lead_status end
  );
alter table public.vehicle_inquiries alter column status set default 'new';

create policy vehicle_inquiries_public_insert on public.vehicle_inquiries for insert
  with check (status = 'new' and handled_by is null);

-- 2) Tildeling og opfølgning, ligesom leads.
alter table public.vehicle_inquiries add column if not exists assigned_to uuid references public.profiles(id);
alter table public.vehicle_inquiries add column if not exists follow_up_at timestamptz;
create index if not exists idx_vehicle_inquiries_assigned on public.vehicle_inquiries(assigned_to);
create index if not exists idx_vehicle_inquiries_follow_up on public.vehicle_inquiries(follow_up_at) where follow_up_at is not null;

-- 3) Ny henvendelsestype til lejebilsforespørgsler (rental-siden har hidtil
-- ingen leadopsamling haft, kun udgående link til One2Move).
alter type public.inquiry_type add value if not exists 'rental';

-- 4) Interne noter på henvendelser (mirror af lead_notes).
create table public.vehicle_inquiry_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  inquiry_id uuid not null references public.vehicle_inquiries(id) on delete cascade,
  author_id uuid references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);
create index idx_vehicle_inquiry_notes_inquiry on public.vehicle_inquiry_notes(inquiry_id, created_at desc);

alter table public.vehicle_inquiry_notes enable row level security;
create policy vehicle_inquiry_notes_member_select on public.vehicle_inquiry_notes for select
  using (public.is_org_member(organization_id));
create policy vehicle_inquiry_notes_member_insert on public.vehicle_inquiry_notes for insert
  with check (public.is_org_member(organization_id) and author_id = auth.uid());

-- 5) Statushistorik på henvendelser (mirror af lead_status_history).
create table public.vehicle_inquiry_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  inquiry_id uuid not null references public.vehicle_inquiries(id) on delete cascade,
  from_status public.lead_status,
  to_status public.lead_status not null,
  changed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index idx_vehicle_inquiry_status_history_inquiry on public.vehicle_inquiry_status_history(inquiry_id);

alter table public.vehicle_inquiry_status_history enable row level security;
create policy vehicle_inquiry_status_history_member_select on public.vehicle_inquiry_status_history for select
  using (public.is_org_member(organization_id));

create or replace function public.log_vehicle_inquiry_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.vehicle_inquiry_status_history (organization_id, inquiry_id, from_status, to_status, changed_by)
    values (new.organization_id, new.id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.vehicle_inquiry_status_history (organization_id, inquiry_id, from_status, to_status, changed_by)
    values (new.organization_id, new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;
create trigger trg_vehicle_inquiries_status_log_ins after insert on public.vehicle_inquiries
  for each row execute function public.log_vehicle_inquiry_status_change();
create trigger trg_vehicle_inquiries_status_log_upd after update on public.vehicle_inquiries
  for each row execute function public.log_vehicle_inquiry_status_change();
