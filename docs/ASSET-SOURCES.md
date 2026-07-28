# Billedkilder (Artlist)

Dette dokument beskriver de billeder, der er udvalgt til Autohuset Vests billedsæt, jf.
`src/config/brandMedia.ts`. Alle billeder er AI-genereret via Artlists AI Image-værktøj
(Seedream 5.0 Pro, 2K), da eksisterende stockmateriale i Artlists bibliotek ikke kunne
tilgås fra denne session (se "Status" nederst). Alle prompts er skrevet til at undgå
læsbare logoer/skilte, læsbare nummerplader, amerikansk vejmiljø og superbiler, jf.
kvalitetskravene i opgaven.

## 1. Forsidehero

- **Lokalt filnavn:** `home-hero-desktop.webp` / `home-hero-mobile.webp`
- **Placering:** `src/components/home/HeroSection.tsx` (forsidens hero, via `brandMedia.heroDesktop` / `heroMobile`)
- **Artlist generation-ID:** `019f866d-91ef-7a09-90a7-be62ae22464f`
- **Model:** Seedream 5.0 Pro (modelId 2615), 16:9, 2K
- **Type:** AI-genereret
- **Genereringsdato:** 2026-07-21
- **Beskrivelse:** Moderne skandinavisk bilforhandlerplads i naturligt dagslys med fire
  forskellige ordinære kvalitetsbiler (stationcar, sedan, to SUV'er/crossovere) parkeret
  foran en lav, moderne glasbygning. Ingen læsbare logoer, skilte eller nummerplader.
- **Crop-/redigeringsnoter:** Desktop-cropet bruger hele 16:9-motivet (2400×1350).
  Mobil-cropet (1200×1600, 3:4) er beskåret fra højre ~75 % af motivet, så bilerne
  forbliver synlige i et lodret format uden at konkurrere med formularen. Begge
  eksporteret som WebP.
- **Status:** Se afsnittet "Status – midlertidige placeholders" nederst.

## 2. Bilvurdering (sælg-flow)

- **Lokalt filnavn:** `sell-car-inspection.webp`
- **Placering:** Forsidens sektion "Sådan sælger du din bil" (`src/pages/public/HomePage.tsx`)
  og `src/pages/public/SellCarPage.tsx` (diskret introduktionsbillede)
- **Artlist generation-ID:** `019f866d-b9c3-7aa0-9e29-1085f6ed8e18`
  (én tidligere generation, `019f8669-eb11-720a-9fa8-f7a0724ee148`, blev **afvist**:
  motivet lignede en amerikansk "USED CARS"-bilplads med læsbart skilt – i strid med
  kravene om ingen læsbar tekst og europæisk miljø.)
- **Model:** Seedream 5.0 Pro (modelId 2615), 4:3, 2K
- **Type:** AI-genereret
- **Genereringsdato:** 2026-07-21
- **Beskrivelse:** En person i neutralt tøj (ingen uniform/logo) undersøger et hjuls
  dækmønster på en almindelig, grå hatchback, mens bilens ejer ser på uden at kigge
  direkte i kameraet. Europæisk bilplads i baggrunden, ingen læsbare skilte, ingen
  håndtryk eller penge.
- **Crop-/redigeringsnoter:** Beskåret til 1600×1200 (4:3), eksporteret som WebP.

## 3. Finansieringsrådgivning

- **Lokalt filnavn:** `finance-consultation.webp`
- **Placering:** Forsidens sektion "Finansiering, der passer til dig" og øverst på
  `src/pages/public/FinancingPage.tsx`
- **Artlist generation-ID:** `019f8669-f7e2-7c37-9a45-2d3d7dd54eca`
- **Model:** Seedream 5.0 Pro (modelId 2615), 4:3, 2K
- **Type:** AI-genereret
- **Genereringsdato:** 2026-07-21
- **Beskrivelse:** Kunde og rådgiver sidder roligt ved et bord i et lyst, moderne
  showroom og gennemgår papirer sammen; en bil anes sløret i baggrunden. Ingen kigger
  direkte i kameraet, ingen kontanter, ingen læsbar tekst på papirerne, ingen logoer.
- **Crop-/redigeringsnoter:** Beskåret til 1600×1200 (4:3), eksporteret som WebP.

## 4. Showroom / lokal identitet

- **Lokalt filnavn:** `showroom.webp`
- **Placering:** Forsidens "Om {brand}"-sektion og `src/pages/public/AboutPage.tsx`
  (begge steder med billedtekst "Illustrativt foto")
- **Artlist generation-ID:** `019f866a-0611-7b7d-ad61-3dde3ad23d98`
- **Model:** Seedream 5.0 Pro (modelId 2615), 3:2, 2K
- **Type:** AI-genereret
- **Genereringsdato:** 2026-07-21
- **Beskrivelse:** Rent, moderne skandinavisk bilhus i dagslys med træ-/betonfacade,
  få ordinære biler parkeret foran, ingen mennesker, ingen læsbare skilte eller
  bilmærkelogoer. Modest skala – ligner en troværdig dansk mellemstor forhandler.
- **Crop-/redigeringsnoter:** 1800×1200 (3:2), eksporteret som WebP. Billedet er bevidst
  IKKE koblet til tekst, der hævder det viser Autohusets faktiske adresse/bygning –
  begge steder er billedteksten "Illustrativt foto".

## 5. Klargøring / værksted

- **Lokalt filnavn:** `workshop.webp`
- **Placering:** `src/pages/public/AboutPage.tsx`, efter teksten om værdier/klargøring
- **Artlist generation-ID:** `019f866a-11cf-7699-a0bb-bad48eb381fb`
- **Model:** Seedream 5.0 Pro (modelId 2615), 1:1, 2K
- **Type:** AI-genereret
- **Genereringsdato:** 2026-07-21
- **Beskrivelse:** Nærbillede af en hånd i handske, der polerer/aftørrer et bilkarosseri
  med en mikrofiberklud i et lyst, rent værkstedsmiljø. Ingen synligt ansigt, ingen
  firmalogoer, ingen motorolie eller gnister.
- **Crop-/redigeringsnoter:** 1400×1400 (1:1), eksporteret som WebP.

---

## Status – midlertidige placeholders

Denne Cowork-sessions sandkasse har et strengt netværks-allowlist, som blokerer
udgående kald til Artlists CDN-domæner (`cms-toolkit-artifacts.artlist.io`,
`mcp.artlist.io`, `imgix.net`) – både via shell og via web-fetch-værktøjet (URL'erne er
desuden for lange til web-fetch's grænse). De 5 billeder ovenfor er genereret,
visuelt godkendt og dokumenteret her, men kunne **ikke hentes ned som filer** i denne
session.

De faktiske filer i `public/media/autohuset-vest/*.webp` er derfor lige nu **neutrale,
lokalt genererede placeholder-gradienter** i de korrekte mål og filnavne (så layout,
`<picture>`-art-direction, `width`/`height`, lazy-loading og performance-budgetter er
100 % på plads og testet). De skal erstattes 1:1 med de rigtige Artlist-billeder,
identificeret ved generation-ID'erne ovenfor, før lancering.

**Sådan skiftes de ud:** Hent hver generation via Artlist (fx gennem
`get_generation_status` med det pågældende generation-ID, eller via Artlist-kontoens
egen historik), og overskriv den tilsvarende fil i `public/media/autohuset-vest/`
med samme filnavn og samme mål (se tabellen ovenfor). Kør derefter
`npm run build` for at bekræfte, at filstørrelserne stadig holder sig inden for
performance-budgettet (se README/PR-beskrivelse for budgetterne).

## Autohuset V

`src/config/brandMedia.ts` har en selvstændig konfiguration for `autohuset-v`, som
indtil videre peger på de samme (midlertidige) filer som Autohuset Vest. Når
Autohuset V får sit eget billedsæt, lægges filerne i `public/media/autohuset-v/`, og
kun `autohusetVMedia`-objektet i `brandMedia.ts` skal opdateres – ingen andre
kodeændringer er nødvendige.
