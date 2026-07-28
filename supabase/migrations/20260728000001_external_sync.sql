-- ============================================================
-- 0010: Automatisk synkronisering af biler fra eksterne kilder
--
-- Autohuset Vest ønsker at "Biler til salg" automatisk hentes fra deres
-- Bilbasen-forhandlerside, og at "Biludlejning" automatisk hentes fra deres
-- One2move-afdelingsside. Denne migration tilføjer de felter, der skal til for
-- idempotent synkronisering (samme annonce må opdateres, ikke duplikeres) og
-- for at kunne vise, at en bil stammer fra en ekstern kilde i adminpanelet.
-- ============================================================

alter table public.vehicles
  add column if not exists external_source text
    check (external_source in ('bilbasen', 'one2move')),
  add column if not exists external_id text,
  add column if not exists external_url text,
  add column if not exists last_synced_at timestamptz;

-- Én bestemt annonce fra én bestemt kilde må kun findes én gang pr. organisation.
create unique index if not exists vehicles_external_source_id_idx
  on public.vehicles (organization_id, external_source, external_id)
  where external_source is not null;

comment on column public.vehicles.external_source is
  'Sæt når bilen er hentet automatisk (fx "bilbasen" eller "one2move") – NULL for biler oprettet manuelt i adminpanelet.';
comment on column public.vehicles.external_id is
  'Kildens eget annonce-ID (fx Bilbasen-annoncenummeret), bruges til at genkende samme annonce ved næste synkronisering.';
comment on column public.vehicles.external_url is
  'Link til den oprindelige annonce hos kilden – vises i adminpanelet som reference.';
comment on column public.vehicles.last_synced_at is
  'Tidspunkt for seneste vellykkede synkronisering. Bruges til at rydde op i annoncer, der ikke længere findes hos kilden.';
