# Adminpanel – vurdering, mangler, arkitektur og implementeringsplan

Dato: 2026-07-22. Dette dokument er leverancen krævet i opgavens punkt 14, før kodeændringer påbegyndes.

## 1. Vurdering af den nuværende løsning

Fundamentet er bedre end det ser ud til ved første øjekast. `vehicles`-skemaet er solidt normaliseret med rigtig status-historik (auto-trigger), rigtige billed-uploads til Supabase Storage, og RLS er korrekt sat op på 35 tabeller med organisations-isolation. Sælg-din-bil-flowet (`src/components/sell/`) er et gennemført eksempel på præcis den wizard-UX, vi skal genbruge til admin: eget state-objekt, ét skridt-komponent pr. trin, fremdriftsbjælke, fokusstyring.

Men adminpanelet selv er tydeligt det først byggede, mindst polerede lag ovenpå denne fundering:

- **Bilformularen er én lang side med rå `useState`** – ikke React Hook Form/Zod som resten af kodebasen. Ingen valideringsfeedback undervejs, kun et enkelt `if`-tjek ved gem.
- **Lejebiler er 100% statisk demo-data** (`src/features/rentals/rentalData.ts`) – ingen databasetabel, ingen admin-styring, ingen leadopsamling specifikt til udlejning. Alt det, opgaven beder om for lejebiler, skal bygges fra bunden.
- **Nummerpladeopslag er mock-only** i denne kodebase. Der er en veldefineret grænseflade (`NormalizedVehicleLookupResult`), men den rigtige udbyder (motorapi el.lign.) er ikke implementeret noget sted i `src/` – det skal ske i en Supabase Edge Function, som ikke findes i repoet endnu.
- **Leadindbakken er reelt to adskilte, ikke-forbundne systemer.** Sælg-din-bil-leads har et rigt, gennemført skema og en god detaljeside. Men almindelige kontakt-, finansierings- og prøvekørselshenvendelser (`vehicle_inquiries`-tabellen) har **ingen adminside overhovedet** – de forsvinder ned i databasen uden at nogen ser dem i panelet i dag. Dette er den mest kritiske funktionelle mangel i forhold til opgavens krav om "samlet leadindbakke".
- **Brugerstyring findes ikke som UI.** Adminsiden til brugere er read-only og instruerer eksplicit admin i at køre SQL manuelt for at oprette/ændre brugere. Det er ikke brugbart for en ikke-teknisk medarbejder.
- **Indstillinger er stort set kun redigerbare direkte i databasen** – siden dækker kun kontaktoplysninger på `brands`-tabellen; alt andet (åbningstider, hero-tekster, SEO-standarder osv.) kræver direkte SQL.
- **Der findes intet genbrugeligt UI-kit** – ingen DataTable, Modal, Toast eller Dropzone-komponent. Hver adminside håndruller sin egen tabel og formular. Det bør bygges først, ellers gentager vi den samme tekniske gæld i hver ny side.
- **Aktivitetslog-tabellen (`audit_log`) findes i databasen, men bruges aldrig fra appen.** Nem gevinst at koble til.

Konklusion: vi skal ikke rive noget ned. Vi skal bygge et lille fælles UI-kit, udvide datamodellen på tre punkter (lejebiler, samlet leads, brugerinvitationer), og genopbygge bil-oprettelsen som en rigtig wizard i samme stil som sælg-din-bil-flowet.

## 2. De vigtigste mangler (prioriteret efter opgavens krav)

1. Lejebiler har ingen datamodel, ingen admin-CRUD, ingen dedikeret leadtype.
2. Kontakt/finansiering/prøvekørsel-henvendelser er usynlige i adminpanelet.
3. Bilformularen mangler wizard-flow, nummerpladeopslag-integration i UI'et, drag-drop billeder, ekstraudstyr-taksonomi og AI-tekstforslag.
4. Ingen bruger-invitation/rolletildeling i UI.
5. Intet dashboard med klikbare handlingsforslag ("5 nye leads mangler kontakt →").
6. Ingen påmindelser/SLA-advarsel for ukontaktede leads.
7. Ingen duplikat-kontrol på nummerplade/stelnummer.
8. Ingen annoncekvalitets-indikator.
9. `audit_log` er ubrugt; ingen adminside til at se den.
10. Intet fælles UI-kit (DataTable/Modal/Toast/Dropzone) – teknisk forudsætning for alt det øvrige.
11. Rigtig nummerpladeopslags-udbyder er ikke koblet på (kun mock).

## 3. Forslag til informationsarkitektur

```
/admin
├── / (Dashboard – handlingsorienteret: nye leads, kladder, biler uden billeder …)
├── /biler                     Oversigt: biler til salg
│   ├── /biler/ny              Wizard: opret bil til salg
│   └── /biler/:id             Wizard/redigering (samme komponent, forudfyldt)
├── /lejebiler                 Oversigt: lejebiler
│   ├── /lejebiler/ny          Wizard: opret lejebil (samme wizard, listing_type=rental)
│   └── /lejebiler/:id
├── /leads                     Samlet indbakke (alle leadtyper)
│   └── /leads/:id             Detaljeside (rendering tilpasses leadtype)
├── /brugere                   Liste + invitér/rediger/fjern (dealer_admin+)
├── /indstillinger             Udvidet: kontakt, åbningstider, SEO, integrationer
├── /aktivitetslog             Ny: browse audit_log (superadmin/dealer_admin)
└── /login
```

Naviger til `/biler/ny` og `/lejebiler/ny` er de to primære call-to-actions på dashboardet, som opgaven beder om. Begge bruger samme wizard-komponent med et `listingType`-prop, der styrer hvilke pris/praktisk-felter der vises i trin 3 – det er den "ensartede oprettelse, adskilte oversigter"-model, opgaven efterspørger.

## 4. Forslag til datamodeller (migrationer)

**A. Lejebiler – udvid `vehicles` frem for at duplikere den**
Langt de fleste felter (mærke, model, år, brændstof, billeder, status, beskrivelse …) er identiske for salg og udlejning. Derfor:

- Ny kolonne `vehicles.listing_type text not null default 'sale' check (listing_type in ('sale','rental'))`.
- Ny 1:1-tabel `rental_details` (vehicle_id pk/fk, price_per_day_dkk, price_per_week_dkk, price_per_month_dkk, deposit_dkk, included_km_per_day, extra_km_price_dkk, min_age, license_requirement text, pickup_location, insurance_info, extra_fees jsonb, availability_status text check (in 'available','booked','maintenance')).
- Findes kun for `listing_type='rental'`-rækker. Salgsspecifikke felter (financing_price, delivery_cost, warranty_text, service_history, owner_count) samles tilsvarende i en `sale_details`-tabel, så `vehicles` ikke vokser med felter, der kun giver mening for den ene type.

**B. Ekstraudstyr som taksonomi, ikke fritekst**
- `equipment_catalog` (id, category text, label text, is_common boolean) – seedet med typiske kategorier (Komfort, Sikkerhed, Infotainment, Assistance, Eksteriør, Interiør, Anhænger og transport, Elektrisk udstyr) og typiske punkter.
- `vehicle_equipment` (vehicle_id, equipment_catalog_id nullable, custom_label text nullable) – tillader både valg fra katalog og fritekst, uden at admin skal skrive samme formulering igen og igen.

**C. Samlet leads – udvid frem for at bygge parallelt**
- Tilføj `leads.lead_type text not null default 'trade_in' check (in 'trade_in','contact','test_drive','finance','rental_inquiry')`.
- Gør trade-in-specifikke børnetabeller (`lead_vehicle_snapshots`, `lead_condition_answers`) valgfrie (de er allerede nullable-venlige via separate tabeller).
- Ret `submitVehicleInquiry()`/`submitContactMessage()` til at skrive ind i `leads` (samme rige infrastruktur: tildeling, noter, statushistorik, samtykker) i stedet for den isolerede `vehicle_inquiries`-tabel. `vehicle_inquiries` udfases eller bevares som ren arkiv/logning.
- Ny `lead_type = 'rental_inquiry'` kobles til `rental_details.vehicle_id`.

**D. Brugerinvitation**
- Ny Supabase Edge Function `admin-invite-user` (service role) der kalder `auth.admin.inviteUserByEmail`, opretter `organization_members`-række og evt. `user_roles`-rækker. Ingen skemaændring nødvendig – kun manglende UI + funktion.

**E. Aktivitetslog**
- Ingen skemaændring – `audit_log` findes allerede. Tilføj et lille `logAudit(action, entityType, entityId, details)`-hjælpekald fra de vigtigste mutationer (bil publiceret/slettet, lead-status ændret, bruger inviteret, indstillinger ændret).

**F. Roller**
Opgaven nævner 6 rolletyper (superadmin, administrator, sælger, udlejningsmedarbejder, marketing, begrænset bruger) mod nuværende 4 (`superadmin, dealer_admin, editor, lead_agent`). Anbefaling: udvid `app_role`-enum med `sales_agent` og `rental_agent` frem for at opfinde et helt nyt rettighedssystem – de fire eksisterende roller plus disse to dækker behovet, og RLS-mønstret genbruges uændret.

## 5. Prioriteret implementeringsplan

**Fase 1 – Oprettelse/redigering af biler (fundamentet)**
1. Fælles UI-kit: DataTable, Modal, Toast/gem-status-indikator, Dropzone (drag-drop, flere filer, komprimering, genrækkefølge, slet, vælg forside), TagInput/Combobox (til ekstraudstyr).
2. Migrationer: `listing_type`, `rental_details`, `sale_details`, `equipment_catalog`, `vehicle_equipment`.
3. Genopbyg bilformularen som wizard (nummerplade → billeder → pris/praktisk [grenet på listing_type] → ekstraudstyr → beskrivelse [+AI-forslag, aldrig auto-publiceret] → forhåndsvisning/publicering), RHF+Zod, autosave af kladde tidligt i flowet.
4. Split oversigter: `/admin/biler` og `/admin/lejebiler`, med thumbnail, kvalitetsindikator, duplikér-handling, dubletkontrol på reg.nr./stelnummer.
5. Behold nummerpladeopslaget som mock indtil en rigtig udbyder er valgt – UI'et bygges til at pege på hvilken som helst provider bag `lookupPlate()`.

**Fase 2 – Samlet leadindbakke**
1. `lead_type`-migration + omlægning af `submitVehicleInquiry`/`submitContactMessage` til `leads`-tabellen.
2. Én `AdminLeadsPage` med filtre (nye/ikke kontaktet/mine/type/bil/ansvarlig/dato/status/vundet/tabt), hurtighandlinger (markér kontaktet/ringet/mail/sms, opret opfølgning), tildeling til enhver kollega (ikke kun sig selv).
3. Handlingsorienteret dashboard med klikbare kort + tæller-badge i sidemenuen for nye/ukontaktede leads.
4. SLA-advarsel for leads, der ikke er kontaktet inden for X timer.

**Fase 3 – Påmindelser, statistik, roller, historik, import/eksport**
1. Opfølgnings-påmindelser (dato + notifikation).
2. Simpel statistikside (leads pr. bil, konvertering, svartid, mest viste, leadkilder, solgte, liggetid) – beregnet client-side af eksisterende data, ingen ny infrastruktur.
3. Rigtig brugerstyring (invitér/rediger/fjern) via ny Edge Function + `sales_agent`/`rental_agent`-roller.
4. Aktivitetslog-side der viser `audit_log`, med `logAudit()`-kald tilføjet de vigtigste steder.
5. CSV-forbedringer / portal-integration – kun hvis der er konkret behov, når vi når dertil.

Efter hver fase: kør typecheck/build/tests, verificér at eksisterende offentlige sider og eksisterende adminfunktioner stadig virker, og beskriv ændrede filer + databaseændringer + kendte begrænsninger, som opgaven beder om.
