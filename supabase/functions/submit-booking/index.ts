// Edge Function: submit-booking
// Opretter en værkstedsbooking (service, dækskift, bremser, klargøring til syn,
// reparation m.m.) og sender notifikations-/bekræftelsesmails.
// Dobbeltbooking forhindres AUTORITATIVT server-side af det partielle unikke
// index på (brand_key, appointment_date, appointment_time) i migrationen
// 20260729000001 – klientens gråtoning af optagne tider er kun UX.
// deno-lint-ignore-file no-explicit-any

import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { logEmail, sendEmail } from "../_shared/email.ts";

// Fast, virksomhedskrævet modtageradresse for alle værkstedsbookinger, uafhængig af brand.
const WORKSHOP_NOTIFICATION_EMAIL = "info@autohusetvest.dk";

const SERVICE_TYPES = [
  "Serviceeftersyn",
  "Dækskift",
  "Bremser",
  "Klargøring til syn",
  "Reparation",
  "Andet",
] as const;

const payloadSchema = z.object({
  brandKey: z.enum(["autohuset-vest", "autohuset-v"]),
  registrationNumber: z.string().regex(/^[A-ZÆØÅ0-9]{2,7}$/),
  vehicleMake: z.string().max(80).nullable().optional(),
  vehicleModel: z.string().max(80).nullable().optional(),
  serviceType: z.enum(SERVICE_TYPES),
  serviceNote: z.string().max(1000).nullable().optional(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentTime: z.string().regex(/^([01]\d|2[0-3]):00$/),
  contact: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    phone: z.string().min(6).max(20),
  }),
  // Honeypot – skal altid være tom
  website: z.string().max(0).nullable().optional(),
});

function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );
}

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

  // Honeypot udfyldt → lad som om alt gik godt uden at gemme noget
  if (payload.website) {
    return jsonResponse({ reference: "TAK" });
  }

  // Kun hverdage, og maks. 14 dage frem (samme regel som i klientens Zod-skema)
  const appointment = new Date(`${payload.appointmentDate}T00:00:00Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setUTCDate(maxDate.getUTCDate() + 14);
  const weekday = appointment.getUTCDay();
  if (
    Number.isNaN(appointment.getTime()) ||
    appointment < today ||
    appointment > maxDate ||
    weekday === 0 ||
    weekday === 6
  ) {
    return jsonResponse({ error: "Ugyldig dato" }, 400);
  }

  // Find organisation ud fra brandKey (tenant-isolation)
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("organization_id, name")
    .eq("brand_key", payload.brandKey)
    .single();
  if (brandError || !brand) return jsonResponse({ error: "Ukendt brand" }, 400);

  const orgId = brand.organization_id;

  // Menneskelæsbar reference: VAERK-ÅR-LØBENR
  const year = new Date().getFullYear();
  const { data: seqData, error: seqError } = await supabase.rpc("nextval_booking_reference");
  let sequence: number;
  if (seqError || seqData === null) {
    sequence = Math.floor(Math.random() * 900000) + 100000; // fallback, stadig unik nok
  } else {
    sequence = Number(seqData);
  }
  const reference = `VAERK-${year}-${String(sequence).padStart(4, "0")}`;

  // Server-side autoritativt tjek: forsøg indsættelse og fang unik-konflikt (23505),
  // som opstår hvis nogen har booket samme brand/dato/tid i mellemtiden.
  const { data: booking, error: insertError } = await supabase
    .from("bookings")
    .insert({
      organization_id: orgId,
      brand_key: payload.brandKey,
      reference,
      registration_number: payload.registrationNumber,
      vehicle_make: payload.vehicleMake ?? null,
      vehicle_model: payload.vehicleModel ?? null,
      service_type: payload.serviceType,
      service_note: payload.serviceNote ?? null,
      appointment_date: payload.appointmentDate,
      appointment_time: payload.appointmentTime,
      contact_name: payload.contact.name,
      contact_email: payload.contact.email,
      contact_phone: payload.contact.phone,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError) {
    if ((insertError as any).code === "23505") {
      return jsonResponse({ error: "slot_taken" }, 409);
    }
    console.error("Booking-oprettelse fejlede:", insertError);
    return jsonResponse({ error: "Bookingen kunne ikke oprettes" }, 500);
  }
  const bookingId = booking!.id;

  const vehicleName = [payload.vehicleMake, payload.vehicleModel].filter(Boolean).join(" ") || "Ukendt bil";
  const dateLabel = new Date(`${payload.appointmentDate}T00:00:00`).toLocaleDateString("da-DK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // E-mails – fejl må ikke påvirke svaret (bookingen er allerede gemt)
  const dealerResult = await sendEmail({
    to: WORKSHOP_NOTIFICATION_EMAIL,
    subject: `Ny værkstedsbooking: ${payload.serviceType} (${payload.registrationNumber}) – ${reference}`,
    html: `
      <h2>Ny værkstedsbooking – ${reference}</h2>
      <p><strong>Ydelse:</strong> ${payload.serviceType}${payload.serviceNote ? ` – ${payload.serviceNote}` : ""}<br>
      <strong>Nummerplade:</strong> ${payload.registrationNumber}<br>
      <strong>Bil:</strong> ${vehicleName}</p>
      <p><strong>Ønsket tid:</strong> ${dateLabel} kl. ${payload.appointmentTime}</p>
      <p><strong>Kontakt:</strong> ${payload.contact.name}<br>
      Telefon: ${payload.contact.phone}<br>
      E-mail: ${payload.contact.email}</p>
    `,
  });
  await logEmail(supabase, {
    organizationId: orgId,
    template: "booking_notification",
    to: WORKSHOP_NOTIFICATION_EMAIL,
    result: dealerResult,
  });

  const userResult = await sendEmail({
    to: payload.contact.email,
    subject: `Vi har modtaget din bookingforespørgsel – ${reference}`,
    html: `
      <h2>Tak for din booking, ${payload.contact.name}!</h2>
      <p>Vi har modtaget din forespørgsel om <strong>${payload.serviceType}</strong> for
      ${vehicleName} (${payload.registrationNumber}).</p>
      <p><strong>Ønsket tid:</strong> ${dateLabel} kl. ${payload.appointmentTime}</p>
      <p><strong>Din reference:</strong> ${reference}</p>
      <p>Vi bekræfter tiden hurtigst muligt. Har du spørgsmål, er du velkommen til at kontakte os.</p>
      <p><strong>${brand.name}</strong></p>
    `,
  });
  await logEmail(supabase, {
    organizationId: orgId,
    template: "booking_confirmation",
    to: payload.contact.email,
    result: userResult,
  });

  return jsonResponse({
    reference,
    bookingId,
    appointmentDate: payload.appointmentDate,
    appointmentTime: payload.appointmentTime,
  });
});
