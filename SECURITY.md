# Sikkerhed

## Implementerede kontroller

**Adgang og isolation**
- Supabase Auth med invitationer (selvregistrering SKAL være slået fra — se DEPLOYMENT.md).
- Row Level Security på alle tabeller; tenant-isolation via `organization_id` og security definer-funktioner (`is_org_member`, `is_org_admin`, `has_role`). En bruger kan ikke få adgang til en anden forhandlers data ved at manipulere `organization_id` i browseren — RLS afgør adgangen server-side. Test: `supabase/tests/rls-isolation.sql`.
- Rollebaseret adgang (superadmin, dealer_admin, editor, lead_agent) håndhævet i databasen; UI-guards er kun kosmetiske.
- Kolonnebeskyttelse: `vin` og `internal_notes` kan ikke læses af anonyme (REVOKE/GRANT i migration 0006).

**Formularer og misbrug**
- Zod-validering både klient-side og server-side (Edge Functions).
- Honeypot-felter på alle offentlige formularer; udfyldt honeypot droppes stille.
- Rate limiting: nummerpladeopslag 5/min og 20/time pr. IP (server-side, hashet IP); klient-side cooldown på formularer. CAPTCHA kan tilføjes ved behov (fx Cloudflare Turnstile foran Edge Functions).
- Filtypekontrol + størrelsesgrænser (10 MB) på uploads, håndhævet både i klienten og af bucket-konfigurationen (`allowed_mime_types`, `file_size_limit`).

**Data og secrets**
- Leadbilleder i PRIVAT bucket; adgang kun via tidsbegrænsede signerede URL'er til organisationens egne medlemmer; upload via signerede upload-URL'er udstedt af `submit-lead`.
- Ingen secrets i klientkode: kun `VITE_`-prefiksede offentlige værdier eksponeres; service role- og API-nøgler findes udelukkende som Supabase function secrets. `.env` er gitignoret; `.env.example` indeholder tomme felter.
- API-nøgler logges aldrig; nummerplader og IP'er logges kun som SHA-256-hashes.
- Auditlog-tabel (`audit_log`) til administrative handlinger + automatisk statushistorik på biler og leads. GDPR-funktioner: `anonymize_lead()`, `export_lead_data()` (logges i `lead_events`).

**Web**
- XSS: React escaper al output; ingen `dangerouslySetInnerHTML`; brugerinput renderes som tekst.
- CSRF: ingen cookie-baserede sessioner på offentlige endpoints (Supabase bruger bearer tokens); Edge Functions er stateless POST-endpoints med CORS.
- IDOR: alle opslag går gennem RLS; signerede URL'er udløber efter 1 time.
- Fejlbeskeder til brugere er generiske; detaljer logges kun server-side.

## Kendte risici og manuelle kontroller (før produktion)

| # | Punkt | Handling |
|---|---|---|
| 1 | CORS er `*` i Edge Functions under udvikling | Begræns til brandets domæner i `_shared/cors.ts` |
| 2 | Selvregistrering i Supabase Auth | Skal slås fra manuelt i Dashboard (kan ikke sættes via migration) |
| 3 | `authenticated`-rollen betragtes som personale | Konsekvens af 2 — verificér før lancering |
| 4 | Rate limiting er IP-baseret | Bag CDN/proxy skal `x-forwarded-for` valideres; overvej Turnstile ved misbrug |
| 5 | CSV-import parser semikolonsepareret tekst | Kun tilgængelig for personale; importér kun betroede filer |
| 6 | Retention håndhæves ikke automatisk endnu | `retention_policies` skal godkendes (`approved_by`) og et cron-job (Supabase Scheduled Function) aktiveres |
| 7 | Demo-login (demo@demo.dk) findes KUN i demo-mode | Deaktiveres automatisk, når Supabase er konfigureret |

## Sikkerhedsreview før lancering

Kør: `npm run typecheck && npm run lint && npm test && npm run build`, RLS-testen i `supabase/tests/rls-isolation.sql`, verificér cookiebanneren blokerer tracking (netværksfanen), og gennemgå LEGAL-CHECKLIST.md.
