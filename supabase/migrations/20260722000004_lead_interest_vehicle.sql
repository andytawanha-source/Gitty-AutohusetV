-- ============================================================
-- "Byt din bil"-kontekst på leads: hvilken bil på lageret vurderingen
-- udspringer fra (interesse-bilen), og det automatisk beregnede skøn,
-- der blev vist for kunden.
--
-- Baggrund: klienten har hele tiden SENDT disse felter til submit-lead
-- (features/leads/api.ts), men Edge Function'ens zod-skema kendte dem
-- ikke og strippede dem derfor stille – de blev aldrig gemt. Det gjorde
-- det umuligt at se i adminpanelet at et lead var en konkret byttebil-
-- forespørgsel (fx "ønsker at bytte til Skoda Kamiq") frem for en almindelig
-- "sælg din bil"-henvendelse uden bytteinteresse.
-- ============================================================

-- Bevidst UDEN foreign key til vehicles(id): leadet må aldrig fejle at blive oprettet
-- fordi interesse-bilen i mellemtiden er slettet/arkiveret. id'et er kun til visning/link.
alter table public.leads add column if not exists interest_vehicle_id uuid;
alter table public.leads add column if not exists interest_vehicle_label text;
alter table public.leads add column if not exists interest_vehicle_slug text;
alter table public.leads add column if not exists interest_vehicle_price_dkk integer;

alter table public.leads add column if not exists estimate_low_dkk integer;
alter table public.leads add column if not exists estimate_mid_dkk integer;
alter table public.leads add column if not exists estimate_high_dkk integer;
alter table public.leads add column if not exists estimate_sample_size integer;
