# Adminguide

Guide til forhandlerens daglige brug af adminpanelet på `/admin`.

## Log ind

Gå til `https://<dit-domæne>/admin`. Log ind med den e-mail og adgangskode, du er inviteret med. Har du glemt adgangskoden, kan en administrator sende en ny invitation fra Supabase Dashboard.

**Roller:** Forhandleradmin (alt), Redaktør (biler og indhold), Leadmedarbejder (leads), Superadmin (på tværs af brands). Rettighederne håndhæves i databasen.

## Dashboard

Overblik over aktive biler, kladder, reserverede, solgte, nye/åbne leads, leads pr. status og kilde samt de seneste leads.

## Biler

- **Opret bil:** Biler → "Opret bil". Kun mærke og model er obligatoriske; udfyld så meget som muligt. SEO-titel, -beskrivelse og URL-slug genereres automatisk, hvis felterne står tomme.
- **Billeder:** Gem bilen først, upload derefter billeder (første billede bliver primært). Giv billederne beskrivende alt-tekster.
- **Status:** Kladde (vises ALDRIG offentligt) → Publiceret → Reserveret → Solgt → Arkiveret. "Planlagt publicering" udgiver tidligst på det valgte tidspunkt. Solgte biler vises som solgt eller under "Solgte biler".
- **Bulk:** Markér flere biler i listen og skift status samlet. CSV-eksport/-import via knapperne øverst (semikolonsepareret; importerede biler lander som udgangspunkt som kladder).
- **Privat data:** Stelnummer og interne noter vises aldrig offentligt. Registreringsnummer vises kun, hvis du aktivt slår det til på bilen.
- **Slet:** Kræver bekræftelse og er en "blød" sletning (kan gendannes af en udvikler).

## Leads

- **Oversigt:** Søg (reference, navn, plade), filtrér på status, sortér, eksportér CSV.
- **Leaddetalje:** Alt om henvendelsen — bilens data fra nummerpladeopslaget, ejerens beskrivelse af standen, billeder (via sikre, tidsbegrænsede links), kontaktoplysninger, samtykker og kampagnekilde.
- **Behandling:** Tildel leadet til dig selv, skift status (Ny → Under behandling → Kontaktet → Tilbud sendt → Vundet/Tabt …), angiv årsag ved tab, og sæt opfølgningsdato. Alle statusskift gemmes i historikken.
- **Noter:** Interne noter ses kun af personalet.
- **GDPR:** Anonymisering/eksport af en persons oplysninger udføres med databasefunktionerne `anonymize_lead(id)` / `export_lead_data(id)` (kontakt udvikler, indtil der er byg-get knapper til det). Slet aldrig leads manuelt uden at følge virksomhedens datapolitik.

## Indstillinger (kun forhandleradmin)

Virksomhedsoplysninger, lead-modtager-e-mail og forventet responstid. Øvrige indstillinger (åbningstider, forsidetekster, juridiske tekster, tracking) ligger i databasen — se ARCHITECTURE.md.

## Brugere (kun forhandleradmin)

Oversigt over brugere og roller + opskrift på at invitere nye brugere via Supabase Dashboard.

## Vigtige regler

1. En bil i "Kladde" er aldrig synlig offentligt.
2. Leads forsvinder ikke, selv hvis en e-mail fejler — tjek altid leadlisten.
3. Opfind aldrig kundeanmeldelser, ratings eller certificeringer på siden.
4. Juridiske tekster er UDKAST, indtil de er godkendt — se LEGAL-CHECKLIST.md.
