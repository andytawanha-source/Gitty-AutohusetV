import { z } from "zod";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { getAttribution } from "@/lib/attribution";
import { resolveBrandKey } from "@/config/brands";
import type { Vehicle } from "@/features/vehicles/types";

export const inquirySchema = z.object({
  inquiryType: z.enum(["contact", "test_drive", "finance", "trade_in"]),
  name: z.string().min(2, "Indtast dit navn").max(120),
  phone: z.string().min(6, "Indtast et gyldigt telefonnummer").max(20),
  email: z.string().email("Indtast en gyldig e-mailadresse"),
  message: z.string().max(2000).optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Du skal acceptere behandlingen af dine oplysninger" }),
  }),
  // Honeypot – skal være tomt (skjult for mennesker)
  website: z.string().max(0).optional(),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

const CONSENT_TEXT_VERSION = "inquiry-v0.1";

/** Simpel klient-side rate limit (suppleres af server-side kontrol) */
let lastSubmit = 0;

export async function submitVehicleInquiry(input: InquiryInput, vehicle: Vehicle): Promise<void> {
  if (input.website) return; // honeypot udfyldt → drop stille
  const now = Date.now();
  if (now - lastSubmit < 10_000) {
    throw new Error("Vent venligst et øjeblik, før du sender igen.");
  }
  lastSubmit = now;

  if (!isSupabaseConfigured) {
    await new Promise((r) => setTimeout(r, 600));
    // eslint-disable-next-line no-console
    console.info("[DEMO-MODE] Forespørgsel modtaget (ikke gemt):", { input, vehicleId: vehicle.id });
    return;
  }

  const { error } = await getSupabase().from("vehicle_inquiries").insert({
    organization_id: vehicle.organizationId,
    vehicle_id: vehicle.id,
    inquiry_type: input.inquiryType,
    name: input.name,
    phone: input.phone,
    email: input.email,
    message: input.message ?? null,
    vehicle_snapshot: {
      make: vehicle.make,
      model: vehicle.model,
      variant: vehicle.variant,
      price_dkk: vehicle.priceDkk,
      slug: vehicle.slug,
    },
    consent_processing: true,
    consent_text_version: CONSENT_TEXT_VERSION,
    attribution: getAttribution() ?? {},
    status: "new",
  });
  if (error) throw new Error("Din forespørgsel kunne ikke sendes. Prøv igen, eller ring til os.");
}

export const contactSchema = inquirySchema.omit({ inquiryType: true });
export type ContactInput = z.infer<typeof contactSchema>;

/** Henvendelsestyper der (i modsætning til VehicleInquiryForm) ikke kræver en konkret bil. */
export type GeneralInquiryType = "contact" | "finance" | "rental";

/**
 * Generel kontaktformular (uden bil). `inquiryType` mærker henvendelsen, så den
 * kan filtreres korrekt i den samlede leadindbakke (fx finansiering vs. leje
 * vs. almindelig kontakt) i stedet for at alt bare hedder "contact".
 */
export async function submitContactMessage(input: ContactInput, inquiryType: GeneralInquiryType = "contact"): Promise<void> {
  if (input.website) return; // honeypot
  const now = Date.now();
  if (now - lastSubmit < 10_000) {
    throw new Error("Vent venligst et øjeblik, før du sender igen.");
  }
  lastSubmit = now;

  if (!isSupabaseConfigured) {
    await new Promise((r) => setTimeout(r, 600));
    // eslint-disable-next-line no-console
    console.info("[DEMO-MODE] Kontaktbesked modtaget (ikke gemt):", { input, inquiryType });
    return;
  }

  const { data: brand, error: brandError } = await getSupabase()
    .from("brands")
    .select("organization_id")
    .eq("brand_key", resolveBrandKey())
    .single();
  if (brandError) throw new Error("Beskeden kunne ikke sendes. Prøv igen, eller ring til os.");

  const { error } = await getSupabase().from("vehicle_inquiries").insert({
    organization_id: brand.organization_id,
    vehicle_id: null,
    inquiry_type: inquiryType,
    name: input.name,
    phone: input.phone,
    email: input.email,
    message: input.message ?? null,
    consent_processing: true,
    consent_text_version: CONSENT_TEXT_VERSION,
    attribution: getAttribution() ?? {},
    status: "new",
  });
  if (error) throw new Error("Beskeden kunne ikke sendes. Prøv igen, eller ring til os.");
}
