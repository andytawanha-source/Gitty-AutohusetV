-- ============================================================
-- SEED-DATA – TESTDATA, tydeligt fiktivt. Må ikke bruges i produktion.
-- To demoorganisationer, 14 biler, 5 leads, FAQ, placeholder-anmeldelser.
-- Kør efter migrations: supabase db reset (kører migrations + seed)
-- ============================================================

-- Faste UUID'er så seed er idempotent og kan refereres i tests
-- Org Vest:  11111111-1111-1111-1111-111111111111
-- Org V:     22222222-2222-2222-2222-222222222222

insert into public.organizations (id, name, slug) values
  ('11111111-1111-1111-1111-111111111111', 'Autohuset Vest (TESTDATA)', 'autohuset-vest'),
  ('22222222-2222-2222-2222-222222222222', 'Autohuset V (TESTDATA)', 'autohuset-v');

insert into public.brands (organization_id, brand_key, name, legal_name, cvr, address, phone, email, lead_email, lead_reference_prefix, lead_response_time, colors, opening_hours, seo) values
  ('11111111-1111-1111-1111-111111111111', 'autohuset-vest', 'Autohuset Vest',
   '[AUTOHUSET VEST JURIDISK NAVN]', '[AUTOHUSET VEST CVR]', '[AUTOHUSET VEST ADRESSE]',
   '[AUTOHUSET VEST TELEFON]', 'info@autohusetvest.dk', 'info@autohusetvest.dk',
   'AVEST', 'inden for 24 timer på hverdage',
   '{"primary":"#0D3B45","secondary":"#164E63","accent":"#5BC0EB","surface":"#F5F2EA","surfaceWarm":"#E8D7B5","ink":"#102A33"}',
   '[{"label":"Mandag–fredag","hours":"09:00–17:30"},{"label":"Lørdag","hours":"Efter aftale"},{"label":"Søndag","hours":"Efter aftale"}]',
   '{"defaultTitle":"Autohuset Vest – Kvalitetsbiler og fair bilvurdering","titleTemplate":"%s | Autohuset Vest"}'),
  ('22222222-2222-2222-2222-222222222222', 'autohuset-v', 'Autohuset V',
   '[AUTOHUSET V JURIDISK NAVN]', '[AUTOHUSET V CVR]', '[AUTOHUSET V ADRESSE]',
   '[AUTOHUSET V TELEFON]', '[AUTOHUSET V E-MAIL]', '[AUTOHUSET V LEAD-E-MAIL]',
   'AV', 'inden for 24 timer på hverdage',
   '{"primary":"#0B1320","secondary":"#1C2938","accent":"#C9823B","surface":"#F6F3EE","ink":"#111827"}',
   '[{"label":"Mandag–fredag","hours":"10:00–17:30"},{"label":"Lørdag","hours":"10:00–14:00"},{"label":"Søndag","hours":"Lukket"}]',
   '{"defaultTitle":"Autohuset V – Udsøgte biler med garanti for kvalitet","titleTemplate":"%s | Autohuset V"}');

-- ---------- Biler: Autohuset Vest (9 stk.) ----------
insert into public.vehicles (id, organization_id, make, model, variant, model_year, first_registration, mileage_km, price_dkk, monthly_price_dkk, fuel_type, transmission, body_type, color, doors, seats, power_hp, engine, battery_kwh, range_km, consumption, description, equipment, badges, is_featured, slug, status) values
  ('aaaa0001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Volkswagen', 'ID.4', 'Pro Performance', 2022, '2022-05-10', 48000, 269900, 3495, 'el', 'automatisk', 'SUV', 'Grå', 5, 5, 204, 'Elmotor', 77.0, 480, '18,1 kWh/100 km',
   'TESTDATA: Velholdt elektrisk familie-SUV med ét ejerskab og fuld servicehistorik.',
   array['Adaptiv fartpilot','Varmepumpe','Bakkamera','Apple CarPlay','LED Matrix-lygter'],
   array['Elbil','Populær'], true, 'volkswagen-id4-pro-performance-2022', 'published'),
  ('aaaa0001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'Toyota', 'Yaris', '1.5 Hybrid H2', 2021, '2021-03-15', 62000, 154900, 1995, 'hybrid', 'automatisk', 'Hatchback', 'Rød', 5, 5, 116, '1.5 benzin/el',
   null, null, '25,6 km/l',
   'TESTDATA: Økonomisk hybrid i flot stand. Serviceret hos mærkeværksted.',
   array['Fartpilot','Bakkamera','Sædevarme','Android Auto'],
   array['Nyhed'], false, 'toyota-yaris-15-hybrid-h2-2021', 'published'),
  ('aaaa0001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   'Peugeot', '308', '1.5 BlueHDi Allure', 2020, '2020-09-01', 89000, 129900, 1695, 'diesel', 'manuel', 'Stationcar', 'Blå', 5, 5, 130, '1.5 diesel',
   null, null, '22,2 km/l',
   'TESTDATA: Rummelig dieselstationcar – perfekt pendlerbil med lavt forbrug.',
   array['Navigation','Parkeringssensorer','Fuldautomatisk klima'],
   array[]::text[], false, 'peugeot-308-15-bluehdi-allure-2020', 'published'),
  ('aaaa0001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111',
   'Tesla', 'Model 3', 'Long Range AWD', 2023, '2023-01-20', 31000, 319900, 4195, 'el', 'automatisk', 'Sedan', 'Hvid', 4, 5, 498, 'Dual motor', 75.0, 602, '14,7 kWh/100 km',
   'TESTDATA: Lang rækkevidde, autopilot og ét ejerskab fra ny.',
   array['Autopilot','Panoramatag','Sædevarme for/bag','Premium lyd'],
   array['Elbil','Populær'], true, 'tesla-model-3-long-range-awd-2023', 'published'),
  ('aaaa0001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111',
   'Ford', 'Kuga', '2.5 PHEV Titanium', 2022, '2022-08-05', 44000, 259900, 3295, 'plugin_hybrid', 'automatisk', 'SUV', 'Sort', 5, 5, 225, '2.5 benzin/el', 14.4, 56, '1,4 l/100 km (WLTP)',
   'TESTDATA: Plugin-hybrid SUV med lav beskatning og masser af udstyr.',
   array['Adaptiv fartpilot','El-bagklap','Trådløs opladning','B&O lydanlæg'],
   array['Nyhed'], false, 'ford-kuga-25-phev-titanium-2022', 'published'),
  ('aaaa0001-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111',
   'Skoda', 'Octavia', '1.0 TSI Style', 2019, '2019-06-12', 112000, 119900, 1595, 'benzin', 'manuel', 'Stationcar', 'Sølv', 5, 5, 115, '1.0 benzin',
   null, null, '18,9 km/l',
   'TESTDATA: Populær familiebil med stor bagagerum og god økonomi.',
   array['Fartpilot','Parkeringssensorer bag','DAB-radio'],
   array[]::text[], false, 'skoda-octavia-10-tsi-style-2019', 'published'),
  ('aaaa0001-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111',
   'Hyundai', 'Kona Electric', '64 kWh Ultimate', 2021, '2021-11-30', 55000, 189900, 2495, 'el', 'automatisk', 'SUV', 'Grøn', 5, 5, 204, 'Elmotor', 64.0, 484, '14,7 kWh/100 km',
   'TESTDATA: Elbil med lang rækkevidde og fabriksgaranti på batteriet.',
   array['Ventilerede sæder','Head-up display','Krell lydanlæg','Adaptiv fartpilot'],
   array['Elbil'], false, 'hyundai-kona-electric-64-kwh-ultimate-2021', 'reserved'),
  ('aaaa0001-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111',
   'BMW', '320d', 'Touring Sport Line', 2020, '2020-02-18', 98000, 289900, 3695, 'diesel', 'automatisk', 'Stationcar', 'Sort', 5, 5, 190, '2.0 diesel',
   null, null, '20,4 km/l',
   'TESTDATA: Velkørende premium-stationcar med fuld servicehistorik.',
   array['Læderindtræk','El-sæder m. memory','Adaptiv undervogn','LED-lygter'],
   array['Populær'], false, 'bmw-320d-touring-sport-line-2020', 'published'),
  ('aaaa0001-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111',
   'Citroën', 'C3', '1.2 PureTech Feel', 2018, '2018-04-25', 134000, 74900, 995, 'benzin', 'manuel', 'Hatchback', 'Hvid', 5, 5, 82, '1.2 benzin',
   null, null, '20,0 km/l',
   'TESTDATA: Prisvenlig bybil – solgt, vises som referencebil.',
   array['Touchskærm','Fartpilot','Bluetooth'],
   array['Solgt'], false, 'citroen-c3-12-puretech-feel-2018', 'sold');

-- Kladde – må ALDRIG vises offentligt (bruges i tests af RLS)
insert into public.vehicles (id, organization_id, make, model, variant, model_year, mileage_km, price_dkk, fuel_type, transmission, slug, status, internal_notes) values
  ('aaaa0001-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111',
   'Audi', 'A4', 'Avant 40 TFSI', 2021, 67000, 274900, 'benzin', 'automatisk',
   'audi-a4-avant-40-tfsi-2021', 'draft', 'TESTDATA: Kladde – afventer billeder.');

-- ---------- Biler: Autohuset V (5 stk.) ----------
insert into public.vehicles (id, organization_id, make, model, variant, model_year, first_registration, mileage_km, price_dkk, monthly_price_dkk, fuel_type, transmission, body_type, color, doors, seats, power_hp, engine, battery_kwh, range_km, consumption, description, equipment, badges, is_featured, slug, status) values
  ('bbbb0002-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'Mercedes-Benz', 'E300de', 'AMG Line', 2021, '2021-07-08', 72000, 429900, 5495, 'plugin_hybrid', 'automatisk', 'Sedan', 'Sort', 4, 5, 306, '2.0 diesel/el', 13.5, 54, '1,6 l/100 km (WLTP)',
   'TESTDATA: Eksklusiv plugin-hybrid sedan med AMG-udstyr.',
   array['AMG Line','Burmester lyd','360-kamera','Multibeam LED'],
   array['Populær'], true, 'mercedes-benz-e300de-amg-line-2021', 'published'),
  ('bbbb0002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222',
   'Porsche', 'Taycan', '4S', 2022, '2022-03-14', 29000, 899900, 10995, 'el', 'automatisk', 'Sedan', 'Grå', 4, 4, 530, 'Dual motor', 93.4, 464, '20,4 kWh/100 km',
   'TESTDATA: Elektrisk sportssedan i exceptionel stand.',
   array['Sport Chrono','Luftundervogn','Panoramatag','BOSE lyd'],
   array['Elbil'], true, 'porsche-taycan-4s-2022', 'published'),
  ('bbbb0002-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222',
   'Audi', 'Q5', '55 TFSI e quattro S line', 2021, '2021-10-01', 58000, 449900, 5795, 'plugin_hybrid', 'automatisk', 'SUV', 'Blå', 5, 5, 367, '2.0 benzin/el', 17.9, 62, '1,9 l/100 km (WLTP)',
   'TESTDATA: Kraftfuld plugin-hybrid SUV med S line-pakke.',
   array['S line','Matrix LED','Virtual cockpit','El-bagklap'],
   array['Nyhed'], false, 'audi-q5-55-tfsi-e-quattro-s-line-2021', 'published'),
  ('bbbb0002-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222',
   'BMW', 'iX3', 'Charged Plus', 2022, '2022-06-20', 41000, 419900, 5395, 'el', 'automatisk', 'SUV', 'Hvid', 5, 5, 286, 'Elmotor', 80.0, 460, '18,9 kWh/100 km',
   'TESTDATA: Elektrisk SUV med lang rækkevidde og premium-komfort.',
   array['Panoramatag','Harman Kardon','Adaptiv fartpilot','360-kamera'],
   array['Elbil'], false, 'bmw-ix3-charged-plus-2022', 'published'),
  ('bbbb0002-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222',
   'Volvo', 'XC60', 'B4 Mild-Hybrid Plus Dark', 2023, '2023-02-11', 24000, 519900, 6695, 'hybrid', 'automatisk', 'SUV', 'Sort', 5, 5, 197, '2.0 benzin mild-hybrid',
   null, null, '15,4 km/l',
   'TESTDATA: Næsten ny svensk premium-SUV med fabriksgaranti.',
   array['Pilot Assist','Panoramatag','Sædevarme hele vejen rundt','El-bagklap'],
   array['Nyhed','Populær'], false, 'volvo-xc60-b4-mild-hybrid-plus-dark-2023', 'published');

-- ---------- Leads (5 stk., fordelt på begge brands) ----------
insert into public.leads (id, organization_id, reference, status, registration_number, mileage_km, source) values
  ('cccc0001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'AVEST-2026-0001', 'new', 'AB12345', 87000, 'website'),
  ('cccc0001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'AVEST-2026-0002', 'contacted', 'CD67890', 145000, 'website'),
  ('cccc0001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'AVEST-2026-0003', 'offer_sent', 'EF11223', 62000, 'website'),
  ('cccc0002-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'AV-2026-0001', 'new', 'GH44556', 38000, 'website'),
  ('cccc0002-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'AV-2026-0002', 'won', 'IJ77889', 95000, 'website');

insert into public.lead_contacts (organization_id, lead_id, name, phone, email, postal_code, city, preferred_channel, best_contact_time, message) values
  ('11111111-1111-1111-1111-111111111111', 'cccc0001-0000-0000-0000-000000000001', 'Test Testesen (TESTDATA)', '+45 00 00 00 01', 'test1@example.invalid', '6700', 'Esbjerg', 'phone', 'Eftermiddag', 'Vil gerne sælge hurtigt.'),
  ('11111111-1111-1111-1111-111111111111', 'cccc0001-0000-0000-0000-000000000002', 'Demo Demosen (TESTDATA)', '+45 00 00 00 02', 'test2@example.invalid', '7100', 'Vejle', 'email', 'Formiddag', null),
  ('11111111-1111-1111-1111-111111111111', 'cccc0001-0000-0000-0000-000000000003', 'Fiktiv Person (TESTDATA)', '+45 00 00 00 03', 'test3@example.invalid', '6000', 'Kolding', 'sms', null, 'Bilen står i carport.'),
  ('22222222-2222-2222-2222-222222222222', 'cccc0002-0000-0000-0000-000000000004', 'Eksempel Eksempelsen (TESTDATA)', '+45 00 00 00 04', 'test4@example.invalid', '8000', 'Aarhus', 'phone', 'Aften', null),
  ('22222222-2222-2222-2222-222222222222', 'cccc0002-0000-0000-0000-000000000005', 'Prøve Prøvesen (TESTDATA)', '+45 00 00 00 05', 'test5@example.invalid', '2100', 'København Ø', 'email', null, 'Solgt – demo af vundet lead.');

insert into public.lead_vehicle_snapshots (organization_id, lead_id, provider, is_mock, registration_number, make, model, variant, model_year, first_registration_date, fuel_type, transmission, color) values
  ('11111111-1111-1111-1111-111111111111', 'cccc0001-0000-0000-0000-000000000001', 'mock', true, 'AB12345', 'Volkswagen', 'Golf', '1.4 TSI', 2017, '2017-05-01', 'benzin', 'manuel', 'Grå'),
  ('11111111-1111-1111-1111-111111111111', 'cccc0001-0000-0000-0000-000000000002', 'mock', true, 'CD67890', 'Ford', 'Focus', '1.0 EcoBoost', 2015, '2015-08-15', 'benzin', 'manuel', 'Blå'),
  ('11111111-1111-1111-1111-111111111111', 'cccc0001-0000-0000-0000-000000000003', 'mock', true, 'EF11223', 'Toyota', 'C-HR', '1.8 Hybrid', 2019, '2019-03-20', 'hybrid', 'automatisk', 'Sort'),
  ('22222222-2222-2222-2222-222222222222', 'cccc0002-0000-0000-0000-000000000004', 'mock', true, 'GH44556', 'Tesla', 'Model Y', 'Long Range', 2022, '2022-09-10', 'el', 'automatisk', 'Hvid'),
  ('22222222-2222-2222-2222-222222222222', 'cccc0002-0000-0000-0000-000000000005', 'mock', true, 'IJ77889', 'Audi', 'A6', '45 TDI', 2019, '2019-01-25', 'diesel', 'automatisk', 'Sort');

insert into public.lead_condition_answers (organization_id, lead_id, is_drivable, has_service_book, key_count, known_damages, smoke_free, has_outstanding_finance, sale_timeline) values
  ('11111111-1111-1111-1111-111111111111', 'cccc0001-0000-0000-0000-000000000001', true, true, 2, 'Lille ridse på bagkofanger', true, false, 'Hurtigst muligt'),
  ('11111111-1111-1111-1111-111111111111', 'cccc0001-0000-0000-0000-000000000002', true, false, 1, null, true, true, 'Inden for en måned'),
  ('11111111-1111-1111-1111-111111111111', 'cccc0001-0000-0000-0000-000000000003', true, true, 2, null, true, false, 'Bare nysgerrig på prisen'),
  ('22222222-2222-2222-2222-222222222222', 'cccc0002-0000-0000-0000-000000000004', true, true, 2, null, true, false, 'Hurtigst muligt'),
  ('22222222-2222-2222-2222-222222222222', 'cccc0002-0000-0000-0000-000000000005', true, true, 2, 'Stenslag i forrude', false, false, 'Solgt');

insert into public.lead_consents (organization_id, lead_id, consent_type, granted, consent_text_version, privacy_policy_version, channels, source) values
  ('11111111-1111-1111-1111-111111111111', 'cccc0001-0000-0000-0000-000000000001', 'processing', true, 'v0.1', 'v0.1', '{}', 'sell_car_form'),
  ('11111111-1111-1111-1111-111111111111', 'cccc0001-0000-0000-0000-000000000002', 'processing', true, 'v0.1', 'v0.1', '{}', 'sell_car_form'),
  ('11111111-1111-1111-1111-111111111111', 'cccc0001-0000-0000-0000-000000000002', 'marketing', true, 'v0.1', 'v0.1', '{email}', 'sell_car_form'),
  ('11111111-1111-1111-1111-111111111111', 'cccc0001-0000-0000-0000-000000000003', 'processing', true, 'v0.1', 'v0.1', '{}', 'sell_car_form'),
  ('22222222-2222-2222-2222-222222222222', 'cccc0002-0000-0000-0000-000000000004', 'processing', true, 'v0.1', 'v0.1', '{}', 'sell_car_form'),
  ('22222222-2222-2222-2222-222222222222', 'cccc0002-0000-0000-0000-000000000005', 'processing', true, 'v0.1', 'v0.1', '{}', 'sell_car_form');

insert into public.lead_attribution (organization_id, lead_id, landing_page, referrer, utm_source, utm_medium, utm_campaign, device_type) values
  ('11111111-1111-1111-1111-111111111111', 'cccc0001-0000-0000-0000-000000000001', '/saelg-din-bil', null, null, null, null, 'mobile'),
  ('11111111-1111-1111-1111-111111111111', 'cccc0001-0000-0000-0000-000000000002', '/', 'https://www.google.com/', 'google', 'cpc', 'saelg-din-bil-demo', 'desktop'),
  ('11111111-1111-1111-1111-111111111111', 'cccc0001-0000-0000-0000-000000000003', '/saelg-din-bil', 'https://www.facebook.com/', 'facebook', 'paid_social', 'brand-demo', 'mobile'),
  ('22222222-2222-2222-2222-222222222222', 'cccc0002-0000-0000-0000-000000000004', '/saelg-din-bil', null, null, null, null, 'desktop'),
  ('22222222-2222-2222-2222-222222222222', 'cccc0002-0000-0000-0000-000000000005', '/', null, 'newsletter', 'email', 'demo', 'mobile');

-- ---------- FAQ ----------
insert into public.faq_items (organization_id, question, answer, category, sort_order) values
  ('11111111-1111-1111-1111-111111111111', 'Hvordan foregår en bilvurdering?', 'Du indtaster din nummerplade og kilometerstand, bekræfter bilens oplysninger og fortæller os om dens stand. Herefter kontakter vi dig med et uforpligtende tilbud.', 'sell', 1),
  ('11111111-1111-1111-1111-111111111111', 'Er tilbuddet bindende?', 'Nej, vores tilbud er helt uforpligtende. Du bestemmer selv, om du vil acceptere.', 'sell', 2),
  ('11111111-1111-1111-1111-111111111111', 'Kan I hjælpe med finansiering?', 'Ja, vi samarbejder med finansieringspartnere og finder en løsning, der passer til dig. Se vores finansieringsside for mere.', 'finance', 3),
  ('11111111-1111-1111-1111-111111111111', 'Kan jeg bytte min nuværende bil?', 'Ja, vi tager gerne din nuværende bil i bytte. Nævn det blot i din henvendelse.', 'general', 4),
  ('22222222-2222-2222-2222-222222222222', 'Hvordan foregår en bilvurdering?', 'Indtast nummerplade og kilometerstand, bekræft oplysningerne, og modtag et uforpligtende tilbud fra os.', 'sell', 1),
  ('22222222-2222-2222-2222-222222222222', 'Leverer I bilen?', 'Kontakt os for at høre om mulighederne for levering.', 'general', 2);

-- ---------- Anmeldelser: TYDELIGE PLACEHOLDERS (må ikke fremstå som rigtige) ----------
insert into public.testimonials (organization_id, author_name, body, rating, source, is_visible, sort_order) values
  ('11111111-1111-1111-1111-111111111111', '[PLACEHOLDER – kundenavn]', '[PLACEHOLDER – rigtig kundeanmeldelse indsættes efter godkendelse. Denne tekst er ikke en rigtig anmeldelse.]', null, 'placeholder', true, 1),
  ('11111111-1111-1111-1111-111111111111', '[PLACEHOLDER – kundenavn]', '[PLACEHOLDER – rigtig kundeanmeldelse indsættes efter godkendelse.]', null, 'placeholder', true, 2),
  ('22222222-2222-2222-2222-222222222222', '[PLACEHOLDER – kundenavn]', '[PLACEHOLDER – rigtig kundeanmeldelse indsættes efter godkendelse.]', null, 'placeholder', true, 1);

-- ---------- Site settings ----------
insert into public.site_settings (organization_id, key, value) values
  ('11111111-1111-1111-1111-111111111111', 'hero', '{"headline":"Din næste bil venter i vest","subline":"Kvalitetsbiler til fair priser – og et uforpligtende tilbud på din nuværende bil på under 2 minutter.","stats":{"cars":"14","years":"[ÅRS ERFARING]","customers":"[ANTAL KUNDER]"}}'),
  ('22222222-2222-2222-2222-222222222222', 'hero', '{"headline":"Udsøgte biler. Kompromisløs kvalitet.","subline":"Håndplukkede biler og en tryg, professionel bilhandel fra start til slut.","stats":{"cars":"5","years":"[ÅRS ERFARING]","customers":"[ANTAL KUNDER]"}}');

-- ---------- Juridiske dokumenter (UDKAST) ----------
insert into public.legal_documents (organization_id, slug, title, body_markdown, version, status) values
  ('11111111-1111-1111-1111-111111111111', 'privatlivspolitik', 'Privatlivspolitik', '# Privatlivspolitik\n\n> **UDKAST – skal gennemgås og godkendes juridisk før lancering.**\n\nFuldt udkast leveres i Fase 5.', 'v0.1', 'draft'),
  ('22222222-2222-2222-2222-222222222222', 'privatlivspolitik', 'Privatlivspolitik', '# Privatlivspolitik\n\n> **UDKAST – skal gennemgås og godkendes juridisk før lancering.**\n\nFuldt udkast leveres i Fase 5.', 'v0.1', 'draft');

-- ============================================================
-- DEMOADMINS: Auth-brugere kan ikke seedes sikkert via SQL.
-- Opret brugere i Supabase Dashboard (eller via scripts/create-admin.mjs)
-- og kør derefter fx:
--   select public.grant_admin('admin-vest@example.invalid', 'autohuset-vest', 'dealer_admin');
-- ============================================================
create or replace function public.grant_admin(p_email text, p_org_slug text, p_role public.app_role)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid;
  v_org uuid;
begin
  select id into v_user from auth.users where email = p_email;
  if v_user is null then raise exception 'Bruger % findes ikke i auth.users', p_email; end if;
  select id into v_org from public.organizations where slug = p_org_slug;
  if v_org is null then raise exception 'Organisation % findes ikke', p_org_slug; end if;

  insert into public.organization_members (organization_id, profile_id)
  values (v_org, v_user) on conflict do nothing;
  insert into public.user_roles (organization_id, profile_id, role)
  values (v_org, v_user, p_role) on conflict do nothing;
end;
$$;
