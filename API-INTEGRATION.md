# Nummerplade-API-integration

## Arkitektur

Provider-uafhængig (spec pkt. 11). Klienten kender kun den normaliserede model — leverandøren kan skiftes uden ændringer i brugerfladen.

```
Klient (StepPlate) → Edge Function plate-lookup → provider (mock | kommerciel leverandør)
                                        │
                                        └── vehicle_lookup_logs (hashet plade + IP, status, svartid)
```

- **Interface:** `VehicleLookupProvider` og `NormalizedVehicleLookupResult` i `src/features/plate-lookup/types.ts` (klient) og tilsvarende i `supabase/functions/plate-lookup/index.ts` (server).
- **Mock-provider:** deterministisk, markeret `isMock: true`, vises som "DEMO-MODE" i UI. Plader der starter med `XX` simulerer "ikke fundet". Løsningen foregiver ALDRIG, at et rigtigt registeropslag er gennemført.
- **Sikkerhed:** API-nøglen findes kun som Supabase function secret. Rate limit: 5 opslag/minut og 20/time pr. IP (autoritativt server-side, baseret på hashede IP'er i loggen). Timeout 8 s, 1 retry. Feature flag: `VEHICLE_LOOKUP_ENABLED=false` slår opslag fra (UI falder tilbage til manuel indtastning).

## Sådan tilsluttes en rigtig leverandør

1. **Vælg leverandør** ud fra kriterierne i `docs/PLAN-06-EKSTERNE-KONTI.md` (datadækning, kommercielle brugsrettigheder, databehandleraftale, hvad der må lagres og hvor længe, om data må bruges til leadgenerering, pris, rate limits, testmiljø). Kandidattyper: MotorAPI, NummerpladeAPI, TjekBil API, Synsbasen API m.fl. **Vælg ikke alene ud fra pris.**
2. **Sæt secrets:**
   ```bash
   supabase secrets set VEHICLE_LOOKUP_PROVIDER=<navn> \
     VEHICLE_LOOKUP_API_URL=https://api.leverandor.dk/v1/vehicles \
     VEHICLE_LOOKUP_API_KEY=<nøgle>
   ```
3. **Tilpas feltmapningen** i `httpProviderLookup()` i `supabase/functions/plate-lookup/index.ts` til leverandørens svarformat (markeret med TODO). Autentificering (Bearer/header/query) tilpasses samme sted.
4. **Rå leverandørdata** (`rawProviderData`) gemmes kun i `lead_vehicle_snapshots`, hvis leverandørens licens tillader det — fjern feltet fra mapningen, hvis ikke.
5. **Genudrul:** `supabase functions deploy plate-lookup`.

Der hentes og vises aldrig private ejeroplysninger — kun tekniske køretøjsdata.

# Automatisk billager (Bilbasen + One2move)

To Edge Functions henter Autohuset Vests egne annoncer fra eksterne sider og synkroniserer dem ind i `vehicles`, så "Biler til salg" og "Biludlejning" ikke skal vedligeholdes to steder. Se kildekode og kommentarer i selve funktionerne for parsing-detaljer.

- **`supabase/functions/sync-bilbasen`** – henter Bilbasen-forhandlersiden (`BILBASEN_DEALER_URL`, default `.../bilforhandler-autohuset-v-aps-id22288`), parser annoncerne (titel, km, årgang, pris) og opretter/opdaterer dem som `listing_type = 'sale'`. Annoncer der forsvinder fra Bilbasen-siden markeres `status = 'sold'` i stedet for at blive slettet.
- **`supabase/functions/sync-one2move-rental`** – henter One2move-afdelingssiden (`ONE2MOVE_DEPARTMENT_URL`, default Rødovre N-afdelingen) og opretter/opdaterer lejebiler som `listing_type = 'rental'` + `rental_details.price_per_day_dkk`. Biltyper der forsvinder markeres `archived`/`maintenance`.

**Opsætning:**
1. Kør migrationen `20260728000001_external_sync.sql` (tilføjer `external_source`/`external_id`/`external_url`/`last_synced_at` på `vehicles`).
2. Sæt secrets: `supabase secrets set BILBASEN_ORGANIZATION_ID=<Autohuset Vests organization_id i vehicles-tabellen>`.
3. Udrul: `supabase functions deploy sync-bilbasen` og `supabase functions deploy sync-one2move-rental`.
4. **Planlæg periodisk kørsel** (funktionerne kører kun, når de kaldes) – nemmeste løsning er Supabase Dashboard → Edge Functions → *Schedule* (cron-udtryk, fx `0 */6 * * *` for hver 6. time), alternativt `pg_cron` + `pg_net` med et scheduled `net.http_post` mod funktions-URL'en og en `Authorization: Bearer <service-role-key>`-header.
5. **Vigtigt før produktion:** Begge sider parses med regex over den offentlige HTML, da hverken Bilbasen eller One2move stiller et officielt API til rådighed for denne brug. Det er skrøbeligt over for layoutændringer (justér mønstrene i funktionerne, hvis en synkronisering pludselig finder 0 biler) og bør afklares juridisk med begge parter (Bilbasens og One2moves brugsvilkår) inden det køres i stor skala. Overvej desuden ikke at kalde funktionerne oftere end nødvendigt for at være en god "nabo" for kildernes servere.

# E-mailintegration

Adapter i `supabase/functions/_shared/email.ts`: `mock` (logger til konsol), `resend`, `postmark`. Vælges med `EMAIL_PROVIDER` + `EMAIL_API_KEY` + `EMAIL_FROM_ADDRESS` (verificér afsenderdomæne med SPF/DKIM hos leverandøren). Alle afsendelser logges i `email_logs` med status, provider-ID, fejl og forsøg. Leadmodtager pr. brand: `brands.lead_email` (fallback: `ADMIN_LEAD_EMAIL`-secret). Store billeder vedhæftes aldrig — forhandleren ser dem via signerede links i adminpanelet.

## MotorAPI (valgt leverandør – klar til aktivering)

MotorAPI (motorapi.dk, Lasando ApS, CVR 45081516) er integreret med dedikeret feltmapning. **100 gratis opslag pr. dag** (~3.000/md.), derefter 0,02–0,15 kr. pr. opslag ekskl. moms, faktureret månedligt.

**Aktivering:**
1. Bestil en API-nøgle på motorapi.dk (kun e-mail påkrævet — nøglen kommer i velkomstmailen).
2. Sæt secrets:
   ```bash
   supabase secrets set VEHICLE_LOOKUP_PROVIDER=motorapi VEHICLE_LOOKUP_API_KEY=<nøgle>
   supabase functions deploy plate-lookup
   ```
3. Verificér i velkomstmailen, at auth-headeren hedder `X-AUTH-TOKEN`, og at endpointet er `https://v1.motorapi.dk/vehicles/{plade}` — ellers justeres `VEHICLE_LOOKUP_API_URL`-secret og headeren i `motorApiLookup()`.

**Feltmapning (fra MotorAPI's dokumenterede svar):** make/model/variant/model_year → direkte; `status` → registreringsstatus; `chassis_type` → karrosseri; `engine_power` er i **kW** og omregnes til hk (×1,359); `engine_volume` er i ccm og omregnes til liter; `own_weight`/`total_weight` → egen-/totalvægt. Gearkasse og synsdata leveres ikke som selvstændige felter. `vin` gemmes kun i rå-data og vises aldrig offentligt.

**Compliance (LEGAL-CHECKLIST pkt. 22):** Afklar med MotorAPI før lancering: databehandleraftale, om data må gemmes i leads (`rawProviderData`), og om data må bruges til leadgenerering. De interne rate limits (5/min, 20/time pr. IP) beskytter samtidig den gratis dagskvote mod misbrug.
