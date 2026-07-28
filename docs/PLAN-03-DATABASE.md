# Databaseoversigt

Alle tabeller: UUID-PK (`gen_random_uuid()`), `organization_id`, `created_at`, `updated_at` (trigger), soft-delete (`deleted_at`) hvor angivet. RLS aktiveret på alt; offentlig læsning kun hvor eksplicit nævnt.

## Organisation og brugere

- `organizations` — id, name, slug. To rækker: Autohuset Vest, Autohuset V.
- `brands` — 1:1 med organization: brand_key, farver, logo-URL, kontaktdata, CVR, åbningstider (jsonb), SoMe, domæne. Offentlig læsning.
- `profiles` — spejler auth.users (id FK), navn, telefon.
- `organization_members` — profile ↔ organization, unik pr. par.
- `user_roles` — member ↔ rolle-enum (`superadmin`, `dealer_admin`, `editor`, `lead_agent`). Håndhæves i RLS via `security definer`-funktioner (`has_role()`, `user_org_ids()`).

## Biler

- `vehicles` — make, model, variant, year, first_registration, mileage_km, price_dkk, monthly_price_dkk, fuel_type (enum), transmission (enum), body_type, color, doors, seats, power_hp, engine, battery_kwh, range_km, consumption, tax_period_dkk, registration_number, vin (privat, kun admin-RLS), description, internal_notes (privat), badges (text[]), is_featured, seo_title, seo_description, slug (unik pr. org), status-enum (`draft`,`published`,`scheduled`,`reserved`,`sold`,`archived`), publish_at, soft-delete. Offentlig læsning KUN `status in (published,reserved,sold)` og `deleted_at is null`.
- `vehicle_images` — vehicle FK, storage_path, alt_text, sort_order, is_primary. Offentlig læsning følger bilens synlighed.
- `vehicle_features` — vehicle FK, feature-tekst, kategori.
- `vehicle_status_history` — vehicle FK, from/to-status, changed_by, tidspunkt.
- `vehicle_views` — anonym visningstælling (vehicle FK, dato, count) til dashboard.
- `vehicle_inquiries` — forespørgsler fra bildetaljesiden: vehicle FK, type (`contact`,`test_drive`,`finance`,`trade_in`), navn, telefon, e-mail, besked, samtykke, attribution.
- `favorites` — session-/brugerbaserede favoritter (lokalt + valgfrit synk).

## Leads (salgsvurdering)

- `leads` — reference (menneskelæsbar, fx AV-2026-0001), status-enum (`new`,`in_progress`,`contact_attempted`,`contacted`,`awaiting_info`,`assessed`,`offer_sent`,`accepted`,`rejected`,`won`,`lost`,`archived`), lost_reason, registration_number, mileage_km, source, assigned_to, follow_up_at, anonymized_at.
- `lead_contacts` — navn, telefon, e-mail, postnr/by, foretrukken kanal, bedste tidspunkt, besked.
- `lead_vehicle_snapshots` — normaliseret opslagsresultat (kolonner) + `raw_provider_data` jsonb, provider, opslagstidspunkt.
- `lead_condition_answers` — struktureret tilstandsdata (kørende, servicebog, nøgler, skader, lamper, dæk, kabine, røgfri, import, restgæld, leasing, tidshorisont, fritekst).
- `lead_images` — storage_path (privat bucket), kategori (forfra/bagfra/…), sort_order.
- `lead_notes` — interne noter, author.
- `lead_assignments` — historik over tildelinger.
- `lead_status_history` — from/to, changed_by, tidspunkt, kommentar.
- `lead_consents` — type (`processing`,`marketing`), givet ja/nej, tekstversion, privatlivspolitik-version, kanaler, tidspunkt, kilde.
- `lead_attribution` — landing_page, referrer, utm_source/medium/campaign/content/term, gclid, fbclid, device_type, campaign_code.
- `lead_events` — hændelseslog (oprettet, e-mail sendt, status ændret …).

## Integrationer

- `vehicle_lookup_logs` — plade (hashet), provider, status, svartid, fejlkode. Ingen API-nøgler logges.
- `integration_settings` — pr. org: provider-valg, feature flags (fx `plate_lookup_enabled`), offentlige tracking-ID'er. Hemmelige nøgler ligger IKKE her.
- `email_logs` — lead/inquiry FK, retning, skabelon, status, provider_message_id, fejl, forsøg.
- `webhook_logs` — fremtidige integrationer.

## CMS og konfiguration

- `site_settings` — nøgle/værdi (typed jsonb) pr. org: heroindhold, forsidetekster, SEO-standarder, responstid m.m. Offentlig læsning.
- `navigation_items`, `content_sections`, `legal_documents` (med version + status `draft`/`approved`), `faq_items`, `testimonials` (kun manuelt indtastede, markeret kilde), `opening_hours`.

## Retention

- `retention_policies` — pr. org og datatype: antal dage, handling (`delete`/`anonymize`), godkendt af (skal udfyldes af virksomheden — ingen default håndhæves før godkendelse).
- Databasefunktioner: `anonymize_lead(lead_id)`, `export_lead_data(lead_id)` (registreres i `lead_events`).

## Constraints og øvrigt

Indekser på alle FK'er, `vehicles(organization_id,status)`, `vehicles(slug)`, `leads(organization_id,status)`. Check-constraints på priser/km ≥ 0, årsinterval, e-mailformat. Unique på slug pr. org og lead-reference. Cascade: billeder/noter/historik følger parent; organizations kan ikke cascade-slettes. Storage-politikker: `vehicle-images` public-read/admin-write; `lead-images` privat, kun signerede URL'er via admin-RLS.
