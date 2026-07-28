# Tracking og marketing

## Principper

- **Intet ikke-nødvendigt tracking før samtykke.** Google Consent Mode v2 sættes til denied som default ved app-start (`src/features/tracking/init.ts`); scripts (GTM/GA4/Meta) indlæses først, når brugeren har accepteret den relevante kategori.
- **Provider-uafhængig adapter.** Alle events pushes til en ensartet `dataLayer` via `track()` i `src/features/tracking/track.ts`. Platforme tilsluttes via env-ID'er uden kodeændringer.
- **Ingen persondata i events.** Kun ID'er, kategorier og tællere.

## Konfiguration (pr. brand-deployment)

```
VITE_GTM_ID=GTM-XXXXXXX        # anbefalet: GTM styrer alle tags med Consent Mode
VITE_GA4_ID=G-XXXXXXXXXX       # bruges kun direkte hvis GTM ikke er sat
VITE_GOOGLE_ADS_ID=AW-XXXXXXX  # konverteringer opsættes i GTM
VITE_META_PIXEL_ID=XXXXXXXX
```

Microsoft Ads, TikTok Pixel, LinkedIn Insight m.fl. tilføjes i GTM som tags, der affyres på dataLayer-events med consent-betingelser — ingen kodeændringer nødvendige.

## Events

| Event | Affyres | Parametre |
|---|---|---|
| `page_view` | hver rutenavigation | `path` |
| `view_vehicle` | bildetaljeside | `vehicle_id`, `make`, `model` |
| `search_inventory` | hero-søgning | `match_count` |
| `apply_vehicle_filter` | filterændring | `active_filters` |
| `favorite_vehicle` | favoritmarkering | `vehicle_id` |
| `click_phone` / `click_email` | klik på telefon/e-mail | evt. `vehicle_id` |
| `start_vehicle_inquiry` / `submit_vehicle_inquiry` | bilforespørgsel | `vehicle_id`, `inquiry_type` |
| `book_test_drive` / `finance_inquiry` | specifikke forespørgselstyper | `vehicle_id` |
| `start_sell_car` | salgsflow åbnet | `source` (hero/sell_car_page) |
| `plate_lookup_started` / `plate_lookup_success` / `plate_lookup_failed` | nummerpladeopslag | `provider` / `reason` |
| `sell_car_step_completed` | hvert gennemført trin | `step` (1-6) |
| `submit_sell_car_lead` | lead indsendt | `reference`, `is_demo` |
| `lead_confirmed` | bekræftelsesside vist | `reference` |

## Attribution

First-touch UTM-parametre, `gclid`/`fbclid`, referrer, landingsside og enhedstype gemmes i sessionStorage (`src/lib/attribution.ts`) og vedhæftes leads (`lead_attribution`) og forespørgsler. Klik-ID'er gemmes kun sammen med leadet, hvor det er lovligt og relevant for konverteringsmåling.

## Enhanced/server-side conversions (valgfrit, ikke aktiveret)

Meta Conversions API eller Google enhanced conversions kan tilføjes som en Edge Function, der affyres efter `submit-lead`. Krav før aktivering: dokumenteret samtykke (marketing), SHA-256-hashing af persondata jf. platformens krav, og kun nødvendige felter. Se spec pkt. 17 — skal godkendes af virksomheden.
