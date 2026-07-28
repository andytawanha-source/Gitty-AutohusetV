# Autohuset Platform

Multi-brand hjemmesideplatform for danske bilforhandlere. Én kodebase, to brands: **Autohuset Vest** og **Autohuset V** — online bilkatalog, leadgenerator med nummerpladeopslag, lead-CRM og annonceklar trackingarkitektur.

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · React Router · TanStack Query · React Hook Form + Zod · Supabase (PostgreSQL, Auth, Storage, Edge Functions) · Vitest · Playwright.

## Kom i gang (5 minutter, uden Supabase)

```bash
npm install
npm run dev
```

Appen kører i **demo-mode** med tydeligt markerede mockdata: fuldt bilkatalog, salgsvurdering med mock-nummerpladeopslag (prøv `AB 12 345`; plader med `XX` simulerer "ikke fundet") og adminpanel på `/admin` (login: `demo@demo.dk` / `demo1234`).

## Fuldt setup med Supabase

1. Opret et Supabase-projekt og kør migrations + seed:
   ```bash
   supabase link --project-ref <ref>
   supabase db push          # supabase/migrations/
   # valgfrit (TESTDATA): kør supabase/seed.sql i SQL-editoren
   ```
2. **Slå selvregistrering fra** (Authentication → Providers → Email): kun inviterede brugere.
3. Opret første administrator: invitér brugeren i Dashboard og kør:
   ```sql
   select public.grant_admin('din@email.dk', 'autohuset-vest', 'dealer_admin');
   ```
4. Deploy Edge Functions og sæt secrets:
   ```bash
   supabase functions deploy plate-lookup submit-lead
   supabase secrets set VEHICLE_LOOKUP_PROVIDER=mock EMAIL_PROVIDER=mock \
     EMAIL_FROM_ADDRESS=noreply@dit-domæne.dk ADMIN_LEAD_EMAIL=leads@dit-domæne.dk
   ```
5. Kopiér `.env.example` til `.env` og udfyld `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` og `VITE_BRAND_KEY`.

Alle environmentvariabler er dokumenteret i `.env.example`. Ingen secrets må committes eller sættes som `VITE_`-variabler.

## Brandvalg og nyt brand

Deploymentet bestemmer brandet: `VITE_BRAND_KEY=autohuset-vest` eller `autohuset-v`. Begge brands deployes som separate sites fra samme repo (se DEPLOYMENT.md). Nyt brand: se "Sådan tilføjes et nyt brand" i ARCHITECTURE.md.

## Scripts

| Kommando | Formål |
|---|---|
| `npm run dev` | Udviklingsserver |
| `npm run build` | Typecheck + production build |
| `npm run typecheck` | TypeScript-kontrol |
| `npm run lint` | ESLint |
| `npm test` | Enhedstests (Vitest) |
| `npm run test:e2e` | E2E-tests (Playwright; kør først `npx playwright install chromium`) |
| `npm run generate:sitemap` | Genererer public/sitemap.xml (kræver `SITE_URL`) |

## Integrationer

- **Nummerplade-API:** provider-uafhængigt; mock-provider følger med. Rigtig leverandør tilsluttes via secrets + feltmapping — se API-INTEGRATION.md. Leverandørvalg kræver forretningsbeslutning (docs/PLAN-06-EKSTERNE-KONTI.md).
- **E-mail:** mock/Resend/Postmark-adapter med logning i `email_logs` — se API-INTEGRATION.md.
- **Tracking:** Consent Mode v2, dataLayer-events og GTM/GA4/Meta via env-ID'er — se TRACKING.md.

## Dokumentation

| Fil | Indhold |
|---|---|
| ARCHITECTURE.md | Implementeret arkitektur, dataflow, nyt brand |
| DEPLOYMENT.md | Supabase + Vercel (primær) + Netlify (alternativ) |
| ADMIN-GUIDE.md | Forhandlerens daglige brug af adminpanelet |
| API-INTEGRATION.md | Nummerplade- og e-mailintegration |
| TRACKING.md | Events, consent og annonceplatforme |
| SECURITY.md | Sikkerhedskontroller, kendte risici, review-tjekliste |
| LEGAL-CHECKLIST.md | Alt virksomheden skal levere/godkende før lancering |
| docs/PLAN-*.md | Oprindelige plandokumenter (spec pkt. 27) |

## Tests

- **Enhedstests** (`tests/unit/`): pladenormalisering, validering, formatering, slugs, filtrering/sortering/URL-synk, tenantfiltrering i demodata + render-smoketests af forside, salgsflow, admin og cookiebanner.
- **E2E** (`tests/e2e/`): de kritiske flows fra spec pkt. 21 i demo-mode.
- **RLS-isolation** (`supabase/tests/rls-isolation.sql`): køres mod et rigtigt Supabase-projekt og verificerer, at en Autohuset V-admin ikke kan se Autohuset Vests data (og omvendt), samt at anonyme hverken ser kladder eller beskyttede kolonner.
- **CI:** `.github/workflows/ci.yml` kører typecheck, lint, tests, build og E2E på hver push/PR.

## Overdragelse

1. Push repoet til GitHub (`git remote add origin … && git push -u origin main`) — historikken med meningsfulde commits følger med.
2. Gennemgå LEGAL-CHECKLIST.md med virksomheden (placeholders, juridiske godkendelser, leverandørvalg).
3. Følg DEPLOYMENT.md for Supabase + to Vercel/Netlify-deployments.
4. Ny udvikler starter med ARCHITECTURE.md og denne README.

> **Bemærk:** Alt demoindhold er tydeligt markeret TESTDATA og må ikke gå i produktion. Løsningen markedsføres ikke som "100 % GDPR-compliant" — compliance afhænger af virksomhedens godkendelser i LEGAL-CHECKLIST.md.
