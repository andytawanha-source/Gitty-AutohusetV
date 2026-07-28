# Sideoversigt

## Offentlige sider

| Route | Side | Vigtigste indhold |
|---|---|---|
| `/` | Forside | Hero med Køb/Sælg-toggle, søgning i lager, nummerplade+km-startfelt, nyeste/fremhævede biler, procestrin, fordele, anmeldelser (placeholder), finansiering, om os, FAQ, lokation/åbningstider, kontakt-CTA |
| `/biler` | Biloversigt | Filtre (sidebar/drawer), sortering, filterchips, URL-synk af filtre, grid/liste, dynamisk resultattal, skeleton loaders |
| `/biler/:slug` | Bildetalje | Galleri (swipe, lightbox, thumbnails), nøgletal, udstyr, beskrivelse, finansieringseksempel m. forbehold, CTA'er (kontakt, ring, prøvetur, finansiering, byt), relaterede biler, favorit |
| `/solgte-biler` | Solgte biler | Arkiv over solgte biler (tydeligt markeret) |
| `/saelg-din-bil` | Salgsvurdering | 6-trins leadflow: nummerplade+km → bekræft bil → tilstand → billeder → kontakt → samtykke+opsummering |
| `/saelg-din-bil/tak/:ref` | Bekræftelse | Leadreference, forventet responstid, kontaktinfo, succes-animation |
| `/finansiering` | Finansiering | Info + forespørgselsformular, forbehold |
| `/om-os` | Om os | Historie, team-placeholder, lokation |
| `/kontakt` | Kontakt | Formular, telefon, e-mail, adresse, åbningstider, kort (efter samtykke) |
| `/favoritter` | Favoritter | Lokalt gemte favoritbiler |

## Juridiske sider (alle markeret UDKAST)

`/privatlivspolitik` · `/cookiepolitik` · `/cookieindstillinger` · `/handelsbetingelser` · `/vilkaar-bilvurdering` · `/juridiske-forbehold` · `/finansieringsforbehold` · `/klagevejledning`

## System

`/404` · sitemap.xml · robots.txt (admin + kladder ekskluderet)

## Admin (`/admin`, kræver login)

| Route | Side |
|---|---|
| `/admin/login` | Login (Supabase Auth) |
| `/admin` | Dashboard: KPI'er, leads pr. status/kilde, seneste aktivitet, mest viste biler |
| `/admin/biler` | Billiste: søg/filtrér, bulk-status, CSV-import/-eksport |
| `/admin/biler/ny` + `/admin/biler/:id` | Bilformular: alle felter, billedhåndtering, SEO, status/planlagt publicering, forhåndsvisning, duplikér |
| `/admin/leads` | Leadoversigt: søg, filtrér, sortér, CSV-eksport |
| `/admin/leads/:id` | Leaddetalje: fuld profil, billeder (signerede URL'er), noter, tildeling, status m. historik, opfølgningsdato |
| `/admin/indstillinger` | Virksomhedsinfo, åbningstider, hero/forsidetekster, SEO-standarder, farver/logo, juridiske tekster, e-mail-/tracking-/cookie-/leverandørindstillinger, leadmodtagere |
| `/admin/brugere` | Brugere og roller (superadmin/forhandleradmin) |
