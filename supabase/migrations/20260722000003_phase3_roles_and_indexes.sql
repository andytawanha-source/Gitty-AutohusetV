-- ============================================================
-- Fase 3: udvidede roller (sælger/udlejningsmedarbejder) + indeks
-- til opfølgningspåmindelser på leads.
--
-- ALTER TYPE ... ADD VALUE kan ikke køres i samme transaktionsblok
-- som efterfølgende brug af værdien i nyere Postgres-versioner.
-- Denne fil indeholder DERFOR kun enum-udvidelsen og et separat,
-- ikke-afhængigt indeks – ingen brug af de nye rolleværdier her.
-- ============================================================

alter type public.app_role add value if not exists 'sales_agent';
alter type public.app_role add value if not exists 'rental_agent';

create index if not exists idx_leads_follow_up on public.leads(follow_up_at) where follow_up_at is not null;
