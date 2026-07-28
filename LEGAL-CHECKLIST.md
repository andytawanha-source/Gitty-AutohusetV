# Juridisk lanceringscheckliste

> Hjemmesiden må ikke markedsføres som "100 % GDPR-compliant". Denne checkliste angiver, hvad virksomheden skal levere eller godkende, før løsningen er compliant og klar til lancering. Alle juridiske tekster er i dag markeret **UDKAST**.

## Skal leveres af virksomheden (pr. brand)

| # | Punkt | Placeholder | Status |
|---|---|---|---|
| 1 | Juridisk navn | `[AUTOHUSET VEST JURIDISK NAVN]` / `[AUTOHUSET V JURIDISK NAVN]` | ☐ |
| 2 | CVR-nummer | `[… CVR]` | ☐ |
| 3 | Fysisk adresse | `[… ADRESSE]` | ☐ |
| 4 | Telefonnummer | `[… TELEFON]` | ☐ |
| 5 | Offentlig e-mail | `[… E-MAIL]` | ☐ |
| 6 | Lead-modtager-e-mail | `[… LEAD-E-MAIL]` | ☐ |
| 7 | Åbningstider | seed/`brands.opening_hours` | ☐ |
| 8 | Domæne + DNS-adgang | `[… DOMÆNE]` | ☐ |
| 9 | Logo (SVG/PNG) | typografisk logo bruges midlertidigt | ☐ |
| 10 | Sociale medier-links | `[… FACEBOOK/INSTAGRAM]` | ☐ |
| 11 | Om os-tekster | `[OM OS – AFSNIT 1-3]` | ☐ |
| 12 | Års erfaring / antal kunder (nøgletal) | `[ÅRS ERFARING]`, `[ANTAL KUNDER]` | ☐ |
| 13 | Rigtige kundeanmeldelser eller integrationsvalg | placeholder-citater fjernes | ☐ |
| 14 | Rigtige bilbilleder med brugsrettigheder | demobilleder udskiftes | ☐ |

## Skal besluttes / godkendes juridisk

| # | Punkt | Hvor | Status |
|---|---|---|---|
| 15 | Privatlivspolitik godkendes (dataansvarlig, formål, grundlag, modtagere, tredjelande, perioder) | `/privatlivspolitik` (UDKAST) | ☐ |
| 16 | Cookiepolitik + komplet cookieliste (efter tracking-ID'er er sat) | `/cookiepolitik` (UDKAST) | ☐ |
| 17 | Handelsbetingelser inkl. betalingsvilkår og garanti | `/handelsbetingelser` (UDKAST) | ☐ |
| 18 | Vilkår for bilvurdering | `/vilkaar-bilvurdering` (UDKAST) | ☐ |
| 19 | Finansieringsforbehold + lovpligtige kreditoplysninger fra finansieringspartner | `/finansieringsforbehold` (UDKAST) | ☐ |
| 20 | Klagevejledning (korrekt klageinstans) | `/klagevejledning` (UDKAST) | ☐ |
| 21 | Opbevaringsperioder (retention) pr. datatype godkendes og aktiveres | `retention_policies`-tabellen (`approved_by` skal udfyldes) | ☐ |
| 22 | Valg af nummerplade-dataleverandør + databehandleraftale + licens til datalagring | `docs/PLAN-06-EKSTERNE-KONTI.md` | ☐ |
| 23 | Valg af e-mailleverandør + databehandleraftale + SPF/DKIM | `.env.example` | ☐ |
| 24 | Databehandleraftaler: Supabase, hosting, e-mail, nummerplade-API | – | ☐ |
| 25 | Samtykketekster (behandling + markedsføring) godkendes og versioneres | `src/features/leads/schema.ts` (CONSENT_TEXT_VERSION) | ☐ |
| 26 | Tracking-ID'er (GTM/GA4/Ads/Meta) + annonceopsætning med Consent Mode | env-variabler | ☐ |
| 27 | CORS begrænses til brandets domæner i Edge Functions | `supabase/functions/_shared/cors.ts` | ☐ |

## Tekniske kontroller før lancering

- ☐ Selvregistrering er slået FRA i Supabase Auth (kun invitationer).
- ☐ RLS-politikker verificeret med `tests` og manuel kontrol (ingen adgang på tværs af organisationer).
- ☐ `lead-images`-bucket er privat, og signerede URL'er udløber.
- ☐ Ingen secrets i repository eller i `VITE_`-variabler.
- ☐ Cookiebanner blokerer al ikke-nødvendig tracking før samtykke (verificér i netværksfanen).
- ☐ Kontaktmulighederne telefon, e-mail og adresse er synlige (formular er ikke eneste mulighed).
- ☐ `robots.txt`/`sitemap.xml` peger på det rigtige domæne.
