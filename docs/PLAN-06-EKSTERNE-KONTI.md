# Nødvendige eksterne konti og API-nøgler

| # | Tjeneste | Formål | Skal leveres | Krævet før |
|---|---|---|---|---|
| 1 | GitHub | Repository, CI, overdragelse | Repo-URL / adgang til push | Overdragelse |
| 2 | Supabase (ét projekt) | Database, Auth, Storage, Edge Functions | `SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY` | Første rigtige deployment |
| 3 | Vercel (primær hosting) | Frontend-hosting, to deployments (ét pr. brand) | Konto + domænetilslutning | Lancering |
| 4 | Netlify (alternativ) | Dokumenteret alternativ hosting | Kun hvis valgt | — |
| 5 | Nummerplade-API | Køretøjsopslag i leadflow | Leverandørvalg + `VEHICLE_LOOKUP_API_URL/KEY` + databehandleraftale | Rigtige opslag (mock virker uden) |
| 6 | Transaktionel e-mail (Resend anbefales; Postmark/SMTP alternativ) | Leadnotifikationer + brugerbekræftelser | `EMAIL_API_KEY`, verificeret afsenderdomæne (SPF/DKIM) | Rigtige e-mails (mock virker uden) |
| 7 | Google Tag Manager / GA4 / Google Ads | Tracking og konverteringer | `GTM_ID`, `GA4_ID`, `GOOGLE_ADS_ID` | Kampagnestart |
| 8 | Meta Business | Pixel + evt. Conversions API | `META_PIXEL_ID` (+ CAPI-token, valgfrit) | Kampagnestart |
| 9 | Domæner | Ét pr. brand | DNS-adgang | Lancering |
| 10 | Evt. anmeldelsesplatform (Trustpilot/Google) | Rigtige anmeldelser i stedet for placeholders | Integrationsvalg | Valgfrit |

## Vurderingskriterier for nummerplade-leverandør (spec pkt. 11)

Kandidattyper: MotorAPI, NummerpladeAPI, TjekBil API, Synsbasen API eller anden kommerciel leverandør. Beslutningen kræver vurdering af: datadækning, kommercielle brugsrettigheder, oppetid, pris pr. opslag, rate limits, dokumentation, databehandleraftale, hvilke data der må lagres og hvor længe, om data må bruges til leadgenerering, support og testmiljø. **Dette er en forretnings-/juridisk beslutning — koden er provider-uafhængig og klar til alle.**

Ingen af nøglerne ovenfor må committes; alle indgår i `.env.example` som tomme felter, og hemmelige nøgler sættes kun som Supabase-function-secrets eller Vercel/Netlify server-env.
