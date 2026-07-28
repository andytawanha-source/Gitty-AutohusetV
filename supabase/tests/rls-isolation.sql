-- ============================================================
-- RLS-isolationstest (Flow 7 i spec pkt. 21)
-- Kør i Supabase SQL-editor (eller psql) EFTER migrations + seed.
-- Forudsætning: To auth-brugere er oprettet og tildelt roller:
--   select public.grant_admin('admin-vest@example.invalid', 'autohuset-vest', 'dealer_admin');
--   select public.grant_admin('admin-v@example.invalid', 'autohuset-v', 'dealer_admin');
-- ============================================================

-- 1) Simulér Autohuset V-admin
do $$
declare
  v_user uuid;
  vest_org uuid := '11111111-1111-1111-1111-111111111111';
  visible_vest_leads int;
  visible_vest_drafts int;
begin
  select id into v_user from auth.users where email = 'admin-v@example.invalid';
  if v_user is null then
    raise exception 'Opret testbrugeren admin-v@example.invalid først';
  end if;

  -- Simulér JWT for brugeren
  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  -- En Autohuset V-admin må IKKE kunne se Autohuset Vests leads
  select count(*) into visible_vest_leads from public.leads where organization_id = vest_org;
  if visible_vest_leads > 0 then
    raise exception 'FEJL: Autohuset V-admin kan se % leads fra Autohuset Vest!', visible_vest_leads;
  end if;

  -- ...og heller ikke Vests kladder
  select count(*) into visible_vest_drafts from public.vehicles
    where organization_id = vest_org and status = 'draft';
  if visible_vest_drafts > 0 then
    raise exception 'FEJL: Autohuset V-admin kan se % kladder fra Autohuset Vest!', visible_vest_drafts;
  end if;

  raise notice 'OK: Tenant-isolation bekræftet for Autohuset V-admin';
end $$;

-- 2) Anonym besøgende må aldrig se kladder eller følsomme kolonner
do $$
declare
  visible_drafts int;
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);

  select count(*) into visible_drafts from public.vehicles where status = 'draft';
  if visible_drafts > 0 then
    raise exception 'FEJL: Anonyme kan se % kladder!', visible_drafts;
  end if;
  raise notice 'OK: Anonyme kan ikke se kladder';

  -- Kolonnebeskyttelse: dette SKAL fejle med permission denied
  begin
    perform vin from public.vehicles limit 1;
    raise exception 'FEJL: Anonyme kan læse vin-kolonnen!';
  exception
    when insufficient_privilege then
      raise notice 'OK: vin-kolonnen er beskyttet mod anonyme';
  end;
end $$;
