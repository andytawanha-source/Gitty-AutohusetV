// Edge Function: submit-lead
// Opretter et komplet salgslead (lead + kontakt + snapshot + tilstand + samtykker
// + attribution), genererer signerede upload-URL'er til den PRIVATE lead-images
// bucket og sender notifikations-/bekræftelsesmails.
// Produktregel (spec pkt. 25): Leadet må ALDRIG gå tabt pga. e-mailfejl.
// deno-lint-ignore-file no-explicit-any

import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { logEmail, sendEmail } from "../_shared/email.ts";

const payloadSchema = z.object({
  brandKey: z.enum(["autohuset-vest", "autohuset-v"]),
  registrationNumber: z.string().regex(/^[A-ZÆØÅ0-9]{2,7}$/),
  mileageKm: z.number().int().min(0).max(2_000_000),
  lookup: z.record(z.unknown()).nullable(),
  manualVehicle: z.record(z.unknown()).nullable(),
  condition: z.record(z.unknown()),
  contact: z.object({
    name: z.string().min(2).max(120),
    phone: z.string().min(6).max(20),
    email: z.string().email(),
    postalCode: z.string().regex(/^\d{4}$/),
    preferredChannel: z.enum(["phone", "email", "sms"]),
    bestContactTime: z.string().max(100).nullable(),
    message: z.string().max(2000).nullable(),
  }),
  consents: z.object({
    processing: z.literal(true),
    marketing: z.boolean(),
    marketingChannels: z.array(z.enum(["email", "sms"])),
    consentTextVersion: z.string(),
    privacyPolicyVersion: z.string(),
  }),
  attribution: z.record(z.unknown()),
  photos: z.array(z.object({
    category: z.enum(["front", "back", "driver_side", "passenger_side", "interior", "dashboard", "damage", "extra"]),
    fileName: z.string().max(255),
    contentType: z.string().max(100),
  })).max(12),
  // "Byt din bil"-kontekst: udfyldt når vurderingen startes fra en konkret bils
  // detaljeside (TradeInModal), tomt for den almindelige "Sælg din bil"-side.
  interestVehicle: z
    .object({
      id: z.string(),
      label: z.string().max(200),
      priceDkk: z.number().nullable(),
      slug: z.string().max(200),
    })
    .nullable()
    .optional(),
  // Det automatisk beregnede skøn kunden fik vist – IKKE et bindende tilbud, kun til
  // reference for sælgeren, så de kan se hvad kunden allerede har set.
  estimate: z
    .object({
      lowDkk: z.number(),
      midDkk: z.number(),
      highDkk: z.number(),
      sampleSize: z.number(),
      basis: z.string(),
    })
    .nullable()
    .optional(),
});

/** Forkaster åbenlyst forkerte årgange (fx 0) i stedet for at gemme et misvisende tal. */
function sanitizeModelYear(year: unknown): number | null {
  const n = Number(year);
  if (!Number.isFinite(n)) return null;
  const currentYear = new Date().getFullYear();
  if (n < 1950 || n > currentYear + 1) return null;
  return n;
}

function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );
}

const CONDITION_MAP: Record<string, string> = {
  ja: "ja", nej: "nej", delvist: "delvist", ved_ikke: "ved ikke",
};

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const supabase = adminClient();

  let payload: z.infer<typeof payloadSchema>;
  try {
    payload = payloadSchema.parse(await req.json());
  } catch {
    return jsonResponse({ error: "Ugyldige data" }, 400);
  }

  // Find organisation ud fra brandKey (tenant-isolation)
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("organization_id, name, lead_email, lead_reference_prefix, lead_response_time, phone, email")
    .eq("brand_key", payload.brandKey)
    .single();
  if (brandError || !brand) return jsonResponse({ error: "Ukendt brand" }, 400);

  const orgId = brand.organization_id;

  // Menneskelæsbar reference: PREFIX-ÅR-LØBENR
  const year = new Date().getFullYear();
  const { data: seqData, error: seqError } = await supabase.rpc("nextval_lead_reference");
  let sequence: number;
  if (seqError || seqData === null) {
    sequence = Math.floor(Math.random() * 900000) + 100000; // fallback, stadig unik nok
  } else {
    sequence = Number(seqData);
  }
  const reference = `${brand.lead_reference_prefix}-${year}-${String(sequence).padStart(4, "0")}`;

  // 1) Opret lead
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      organization_id: orgId,
      reference,
      status: "new",
      registration_number: payload.registrationNumber,
      mileage_km: payload.mileageKm,
      source: "website",
      interest_vehicle_id: payload.interestVehicle?.id ?? null,
      interest_vehicle_label: payload.interestVehicle?.label ?? null,
      interest_vehicle_slug: payload.interestVehicle?.slug ?? null,
      interest_vehicle_price_dkk: payload.interestVehicle?.priceDkk ?? null,
      estimate_low_dkk: payload.estimate?.lowDkk ?? null,
      estimate_mid_dkk: payload.estimate?.midDkk ?? null,
      estimate_high_dkk: payload.estimate?.highDkk ?? null,
      estimate_sample_size: payload.estimate?.sampleSize ?? null,
    })
    .select("id")
    .single();
  if (leadError || !lead) {
    console.error("Lead-oprettelse fejlede:", leadError);
    return jsonResponse({ error: "Leadet kunne ikke oprettes" }, 500);
  }
  const leadId = lead.id;

  // 2) Tilknyttede data – fejl logges men leadet består
  const c = payload.condition as Record<string, any>;
  const results = await Promise.allSettled([
    supabase.from("lead_contacts").insert({
      organization_id: orgId,
      lead_id: leadId,
      name: payload.contact.name,
      phone: payload.contact.phone,
      email: payload.contact.email,
      postal_code: payload.contact.postalCode,
      preferred_channel: payload.contact.preferredChannel,
      best_contact_time: payload.contact.bestContactTime,
      message: payload.contact.message,
    }),
    supabase.from("lead_vehicle_snapshots").insert({
      organization_id: orgId,
      lead_id: leadId,
      provider: payload.lookup ? String((payload.lookup as any).provider ?? "unknown") : "manual",
      is_mock: payload.lookup ? Boolean((payload.lookup as any).isMock) : false,
      registration_number: payload.registrationNumber,
      make: (payload.lookup as any)?.make ?? (payload.manualVehicle as any)?.make ?? null,
      model: (payload.lookup as any)?.model ?? (payload.manualVehicle as any)?.model ?? null,
      variant: (payload.lookup as any)?.variant ?? (payload.manualVehicle as any)?.variant ?? null,
      model_year: sanitizeModelYear((payload.lookup as any)?.modelYear ?? (payload.manualVehicle as any)?.modelYear),
      first_registration_date: (payload.lookup as any)?.firstRegistrationDate ?? null,
      fuel_type: (payload.lookup as any)?.fuelType ?? (payload.manualVehicle as any)?.fuelType ?? null,
      transmission: (payload.lookup as any)?.transmission ?? (payload.manualVehicle as any)?.transmission ?? null,
      body_type: (payload.lookup as any)?.bodyType ?? null,
      color: (payload.lookup as any)?.color ?? (payload.manualVehicle as any)?.color ?? null,
      engine_size: (payload.lookup as any)?.engineSize ?? null,
      power_hp: (payload.lookup as any)?.powerHp ?? null,
      power_kw: (payload.lookup as any)?.powerKw ?? null,
      battery_capacity_kwh: (payload.lookup as any)?.batteryCapacityKwh ?? null,
      electric_range_km: (payload.lookup as any)?.electricRangeKm ?? null,
      curb_weight_kg: (payload.lookup as any)?.curbWeightKg ?? null,
      total_weight_kg: (payload.lookup as any)?.totalWeightKg ?? null,
      registration_status: (payload.lookup as any)?.registrationStatus ?? null,
      inspection_date: (payload.lookup as any)?.inspectionDate ?? null,
      next_inspection_date: (payload.lookup as any)?.nextInspectionDate ?? null,
      equipment: (payload.lookup as any)?.equipment ?? [],
      raw_provider_data: (payload.lookup as any)?.rawProviderData ?? null,
    }),
    supabase.from("lead_condition_answers").insert({
      organization_id: orgId,
      lead_id: leadId,
      is_drivable: c.isDrivable === "ja",
      has_service_book: c.hasServiceBook === "ja",
      last_service: c.lastService || null,
      key_count: c.keyCount === "3+" ? 3 : Number(c.keyCount) || null,
      known_damages: c.hasDamages === "ja" ? (c.knownDamages || "Ja, ikke beskrevet") : null,
      warning_lights: c.hasWarningLights === "ja" ? (c.warningLights || "Ja, ikke specificeret") : null,
      mechanical_issues: c.mechanicalIssues || null,
      tire_condition: c.tireCondition ? CONDITION_MAP[c.tireCondition] ?? c.tireCondition : null,
      interior_condition: c.interiorCondition ?? null,
      smoke_free: c.smokeFree === "ja",
      is_imported: c.isImported === "ja" ? true : c.isImported === "nej" ? false : null,
      has_outstanding_finance: c.hasFinance === "ja",
      finance_details: c.financeDetails || null,
      sale_timeline: c.saleTimeline ?? null,
      comment: c.comment || null,
    }),
    supabase.from("lead_consents").insert([
      {
        organization_id: orgId,
        lead_id: leadId,
        consent_type: "processing",
        granted: true,
        consent_text_version: payload.consents.consentTextVersion,
        privacy_policy_version: payload.consents.privacyPolicyVersion,
        channels: [],
        source: "sell_car_form",
      },
      {
        organization_id: orgId,
        lead_id: leadId,
        consent_type: "marketing",
        granted: payload.consents.marketing,
        consent_text_version: payload.consents.consentTextVersion,
        privacy_policy_version: payload.consents.privacyPolicyVersion,
        channels: payload.consents.marketingChannels,
        source: "sell_car_form",
      },
    ]),
    supabase.from("lead_attribution").insert({
      organization_id: orgId,
      lead_id: leadId,
      landing_page: (payload.attribution as any)?.landing_page ?? null,
      referrer: (payload.attribution as any)?.referrer ?? null,
      utm_source: (payload.attribution as any)?.utm_source ?? null,
      utm_medium: (payload.attribution as any)?.utm_medium ?? null,
      utm_campaign: (payload.attribution as any)?.utm_campaign ?? null,
      utm_content: (payload.attribution as any)?.utm_content ?? null,
      utm_term: (payload.attribution as any)?.utm_term ?? null,
      gclid: (payload.attribution as any)?.gclid ?? null,
      fbclid: (payload.attribution as any)?.fbclid ?? null,
      device_type: (payload.attribution as any)?.device_type ?? null,
      campaign_code: (payload.attribution as any)?.campaign_code ?? null,
    }),
    supabase.from("lead_events").insert({
      organization_id: orgId,
      lead_id: leadId,
      event_type: "created",
      payload: { source: "sell_car_form" },
    }),
  ]);
  for (const r of results) {
    if (r.status === "rejected") console.error("Lead-delindsættelse fejlede:", r.reason);
    else if ((r.value as any)?.error) console.error("Lead-delindsættelse fejlede:", (r.value as any).error);
  }

  // 3) Signerede upload-URL'er til privat bucket + registrering i lead_images
  const uploads: Array<{ path: string; token: string }> = [];
  for (let i = 0; i < payload.photos.length; i++) {
    const photo = payload.photos[i];
    const ext = photo.fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${orgId}/${leadId}/${i + 1}-${photo.category}.${ext}`;
    const { data: signed, error: signError } = await supabase.storage
      .from("lead-images")
      .createSignedUploadUrl(path);
    if (signError || !signed) {
      console.error("Signeret upload-URL fejlede:", signError);
      continue;
    }
    uploads.push({ path, token: signed.token });
    await supabase.from("lead_images").insert({
      organization_id: orgId,
      lead_id: leadId,
      storage_path: path,
      category: photo.category,
      sort_order: i,
    });
  }

  // 4) E-mails – fejl må ikke påvirke svaret
  const vehicleName = [
    (payload.lookup as any)?.make ?? (payload.manualVehicle as any)?.make,
    (payload.lookup as any)?.model ?? (payload.manualVehicle as any)?.model,
  ].filter(Boolean).join(" ") || "Ukendt bil";

  const adminUrl = Deno.env.get("ADMIN_URL") ?? "";
  const dealerTo = brand.lead_email && !brand.lead_email.startsWith("[")
    ? brand.lead_email
    : Deno.env.get("ADMIN_LEAD_EMAIL") ?? "";

  if (dealerTo) {
    const dealerResult = await sendEmail({
      to: dealerTo,
      subject: `Nyt salgslead: ${vehicleName} (${payload.registrationNumber}) – ${reference}`,
      html: `
        <h2>Nyt salgslead – ${reference}</h2>
        <p><strong>Bil:</strong> ${vehicleName}<br>
        <strong>Nummerplade:</strong> ${payload.registrationNumber}<br>
        <strong>Kilometerstand:</strong> ${payload.mileageKm.toLocaleString("da-DK")} km</p>
        <p><strong>Kontakt:</strong> ${payload.contact.name}<br>
        Telefon: ${payload.contact.phone}<br>
        E-mail: ${payload.contact.email}<br>
        Postnr.: ${payload.contact.postalCode}<br>
        Foretrukken kanal: ${payload.contact.preferredChannel}</p>
        <p><strong>Billeder:</strong> ${payload.photos.length} stk. (se dem sikkert i adminpanelet)</p>
        <p><strong>Kampagne:</strong> ${(payload.attribution as any)?.utm_campaign ?? "–"} /
        ${(payload.attribution as any)?.utm_source ?? "direkte"}</p>
        <p><strong>Markedsføringssamtykke:</strong> ${payload.consents.marketing ? "Ja" : "Nej"}</p>
        ${adminUrl ? `<p><a href="${adminUrl}/admin/leads">Åbn leadet i adminpanelet</a></p>` : ""}
      `,
    });
    await logEmail(supabase, { organizationId: orgId, leadId, template: "lead_notification", to: dealerTo, result: dealerResult });
  }

  const userResult = await sendEmail({
    to: payload.contact.email,
    subject: `Vi har modtaget din henvendelse – ${reference}`,
    html: `
      <h2>Tak for din henvendelse, ${payload.contact.name}!</h2>
      <p>Vi har modtaget oplysningerne om din <strong>${vehicleName}</strong> (${payload.registrationNumber})
      og vender tilbage ${brand.lead_response_time ?? "hurtigst muligt"}.</p>
      <p><strong>Din reference:</strong> ${reference}</p>
      <p>Har du spørgsmål, kan du kontakte os:<br>
      ${brand.name}<br>Telefon: ${brand.phone ?? ""}<br>E-mail: ${brand.email ?? ""}</p>
      <p style="color:#666;font-size:12px">Læs om vores behandling af personoplysninger i privatlivspolitikken på vores hjemmeside.</p>
    `,
  });
  await logEmail(supabase, { organizationId: orgId, leadId, template: "lead_confirmation", to: payload.contact.email, result: userResult });

  return jsonResponse({ reference, uploads });
});
