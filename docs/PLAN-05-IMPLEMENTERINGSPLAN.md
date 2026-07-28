# Implementeringsplan

Rækkefølgen følger spec pkt. 26. Autohuset Vest er default-brand under udviklingen; Autohuset V aktiveres via `VITE_BRAND_KEY` uden kodeændringer.

## Fase 1 — Fundament
Vite + React + TS + Tailwind + shadcn/ui-opsætning · React Router med route-skelet · brandkonfiguration (begge brands defineret, Vest som default) · designsystem med CSS-variabler og typografi · Supabase-klient · migrations (fuldt skema, enums, triggers, RLS, storage-politikker, rolle-funktioner) · seed.sql (2 organisationer, 12+ biler, 5+ leads, demoadmins — alt markeret TESTDATA) · .env.example.

## Fase 2 — Offentlig hjemmeside
Header/footer/mobilmenu/sticky CTA · forside med alle sektioner og hero-toggle · biloversigt med filtre, sortering, URL-synk, chips, grid, skeletons · bildetaljeside med galleri og CTA'er · kontakt- og forespørgselsformularer (via Edge Function) · solgte biler · responsivt + WOW-effekter (reveal, hover, counters, reduced-motion).

## Fase 3 — Salgslead
`VehicleLookupProvider`-interface + normaliseret model + mock-provider · `plate-lookup` Edge Function med rate limit og feature flag · 6-trins wizard med betingede spørgsmål, billedupload (komprimering, progress, privat bucket), samtykke og opsummering · `submit-lead` Edge Function · bekræftelsesside med leadreference · e-mails til forhandler + bruger (mock-adapter til udvikling) · manuel indtastning som fallback.

## Fase 4 — Adminpanel
Auth + RoleGuard + AdminLayout · dashboard-KPI'er · bil-CRUD med billedadministration, statusflow, forhåndsvisning, duplikér, planlagt publicering · lead-CRM med statushistorik, noter, tildeling, opfølgning, CSV-eksport · CSV-import af biler · indstillingssider · brugere/roller.

## Fase 5 — Marketing og compliance
Cookiebanner med fire kategorier og "Accepter/Afvis alle" uden dark patterns · Google Consent Mode v2-integration · trackingadapter + dataLayer + alle events fra spec pkt. 17 (GTM/GA4/Ads/Meta konfigurerbare, inaktive uden samtykke) · SEO: meta, canonical, OG, sitemap, robots, structured data (AutoDealer, Vehicle+Offer, FAQ, Breadcrumb), 404, redirects ved slugændring · juridiske sider som UDKAST · retention-konfiguration + anonymiser/eksportér-funktioner · LEGAL-CHECKLIST.md.

## Fase 6 — Kvalitet og overdragelse
Enhedstests (pladenormalisering, validering, formatering, slug, provider-normalisering, tenantfilter, tracking) · integrationstests · Playwright-E2E for de 7 flows i spec pkt. 21 · GitHub Actions (typecheck, lint, test, build) · README, ARCHITECTURE, DEPLOYMENT (Vercel + Netlify), ADMIN-GUIDE, API-INTEGRATION, TRACKING, LEGAL-CHECKLIST, SECURITY · lanceringscheckliste med alle placeholders · afsluttende verifikation: `tsc`, lint, tests, production build.

## Uden for min rækkevidde (kræver dig)
Oprettelse af GitHub-repo/push (jeg initialiserer git lokalt med meningsfulde commits), Supabase-/Vercel-/Netlify-konti, valg og kontrakt med nummerplade-leverandør og e-mailtjeneste, juridisk godkendelse. Alt er forberedt, så det kun kræver nøgler/godkendelser.
