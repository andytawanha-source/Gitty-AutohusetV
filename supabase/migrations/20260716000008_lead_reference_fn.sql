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
