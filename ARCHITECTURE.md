# Arkitektur

Se også `docs/PLAN-01-ARKITEKTUR.md` (plandokument) — dette dokument beskriver den implementerede løsning.

## Overblik

Én kodebase, to brands (Autohuset Vest og Autohuset V). Brandet vælges pr. deployment via `VITE_BRAND_KEY` med fallback til domænematch (`src/config/brands/index.ts`). Al branding (farver, typografi, kontakt, SEO) kommer fra brandkonfigurationen og sættes som CSS-variabler af `BrandProvider`, så alle komponenter er brand-agnostiske.

```
React SPA (Vite)  ──anon key──▶  Supabase
  ├─ Offentlige sider                ├─ PostgreSQL (alle tabeller har organization_id + RLS)
  ├─ Salgsvurdering (6 trin)         ├─ Auth (kun inviterede adminbrugere)
  └─ Adminpanel (/admin)             ├─ Storage: vehicle-images (public) · lead-images (PRIVAT)
                                     └─ Edge Functions: plate-lookup · submit-lead
                                          (alle hemmelige nøgler ligger KUN her)
```

## Nøglebeslutninger

1. **SPA + klient-side filtrering.** Hele det offentlige lager (< ~500 biler) hentes én gang og caches med TanStack Query; filtrering/sortering sker klient-side og spejles i URL-parametre. Trade-off: enklere kode og lynhurtige filtre; ved meget store lagre flyttes filtreringen til Supabase-queries (samme `VehicleFilters`-model kan oversættes).
2. **Tenant-isolation i databasen.** RLS-politikker på alle tabeller binder adgang til `organization_id` via security definer-funktionerne `is_org_member()`, `is_org_admin()` og `has_role()`. Kolonnebeskyttelse (REVOKE/GRANT) skjuler `vin` og `internal_notes` for anonyme. Test: `supabase/tests/rls-isolation.sql`.
3. **Demo-mode.** Uden `VITE_SUPABASE_URL` kører hele appen med tydeligt markerede mockdata (offentligt lager, nummerpladeopslag, adminpanel med demo-login). Det gør løsningen kørbar fra første `npm run dev` og bruges af E2E-testene.
4. **Provider-uafhængige adaptere.** Nummerpladeopslag (`VehicleLookupProvider` + normaliseret model), e-mail (mock/Resend/Postmark) og tracking (dataLayer + Consent Mode) kan alle skifte leverandør via env-variabler uden ændringer i brugerfladen.
5. **Leads må aldrig gå tabt.** `submit-lead` gemmer leadet først; e-mails sendes bagefter og logges i `email_logs` — fejl dér påvirker aldrig leadet. Billeder uploades til den private bucket via signerede upload-URL'er.

## Mappestruktur

```
src/
├── app/            App-shell, router, BrandProvider
├── config/brands/  Brandkonfigurationer (autohuset-vest, autohuset-v)
├── lib/            supabase-klient, format, plade, slug, attribution, utils
├── features/       vehicles · leads · plate-lookup · inquiries · favorites · consent · tracking
├── components/     layout · vehicles · sell · home · seo · shared
├── pages/          public/ · legal/ · NotFoundPage
└── admin/          auth, api (Supabase + demo), types, components/, pages/
supabase/
├── migrations/     8 migrations: skema, RLS, storage, funktioner
├── functions/      plate-lookup · submit-lead · _shared (cors, email)
├── seed.sql        TESTDATA: 2 organisationer, 15 biler, 5 leads
└── tests/          rls-isolation.sql
```

## Dataflow: salgslead

1. Klienten validerer trin-for-trin med Zod (`src/features/leads/schema.ts`).
2. `plate-lookup` slår nummerpladen op server-side (rate limit pr. IP, hashet logging, feature flag `VEHICLE_LOOKUP_ENABLED`).
3. `submit-lead` validerer payload (Zod), finder organisationen via `brandKey`, opretter lead + kontakt + snapshot + tilstand + samtykker + attribution, genererer leadreference (`AVEST-2026-0001`) og signerede upload-URL'er.
4. Klienten uploader komprimerede billeder direkte til den private bucket.
5. E-mails (forhandler + bruger) sendes og logges; brugeren ser bekræftelsessiden med reference.

## Sådan tilføjes et nyt brand

1. Ny brandkonfiguration i `src/config/brands/` + registrering i `index.ts` (og `BrandKey`-typen).
2. Ny række i `organizations` + `brands` (SQL eller adminpanel/seed).
3. Nyt deployment med `VITE_BRAND_KEY=<nyt-brand>`.
Ingen komponentændringer er nødvendige.
