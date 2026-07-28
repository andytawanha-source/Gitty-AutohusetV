import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { resolveBrandKey } from "@/config/brands";
import { normalizePlate } from "@/lib/plate";
import type { NormalizedVehicleLookupResult } from "@/features/plate-lookup/types";
import type { BookingFormInput } from "./schema";

export interface BookedSlot {
  appointmentDate: string; // ISO (yyyy-mm-dd)
  appointmentTime: string; // HH:mm
}

export interface SubmitBookingResult {
  reference: string;
  appointmentDate: string;
  appointmentTime: string;
  isDemo: boolean;
}

/** "slot_taget"-fejl: tiden blev booket af en anden kunde, mens formularen var åben. */
export class SlotTakenError extends Error {
  constructor() {
    super("Tiden er desværre lige blevet booket af en anden. Vælg venligst et andet tidspunkt.");
    this.name = "SlotTakenError";
  }
}

/**
 * Dataadgang for værkstedsbookinger.
 *  - Demo-mode (Supabase ikke konfigureret): simulerer indsendelse, ingen optagede tider.
 *  - Supabase: `get_booked_slots` (SECURITY DEFINER, PII-fri) bruges til at gråtone optagede
 *    tider i UI, og selve oprettelsen sker via Edge Function `submit-booking` (service role),
 *    som autoritativt forhindrer dobbeltbooking via et unikt partial index i databasen.
 *  - Opslag/booking sker pr. BRAND (brand_key), ikke pr. organisation: værkstedskalenderen
 *    er brandets egen, også når to brands deler organisation og bil-lager.
 */

/** Henter allerede bookede tider for et datointerval, så UI kan gråtone dem. */
export async function getBookedSlots(fromDate: string, toDate: string): Promise<BookedSlot[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await getSupabase().rpc("get_booked_slots", {
    p_brand_key: resolveBrandKey(),
    p_from_date: fromDate,
    p_to_date: toDate,
  });
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    appointmentDate: row.appointment_date,
    appointmentTime: typeof row.appointment_time === "string" ? row.appointment_time.slice(0, 5) : row.appointment_time,
  }));
}

export async function submitBooking(
  input: BookingFormInput,
  lookup: NormalizedVehicleLookupResult | null
): Promise<SubmitBookingResult> {
  if (input.website) {
    // Honeypot udfyldt → lad som om alt gik godt uden at gemme noget
    return { reference: "TAK", appointmentDate: input.appointmentDate, appointmentTime: input.appointmentTime, isDemo: true };
  }

  const payload = {
    brandKey: resolveBrandKey(),
    registrationNumber: normalizePlate(input.registrationNumber),
    vehicleMake: lookup?.make ?? null,
    vehicleModel: lookup?.model ?? null,
    serviceType: input.serviceType,
    serviceNote: input.serviceType === "Andet" ? input.serviceNote ?? null : null,
    appointmentDate: input.appointmentDate,
    appointmentTime: input.appointmentTime,
    contact: { name: input.name, email: input.email, phone: input.phone },
    website: input.website ?? "",
  };

  if (!isSupabaseConfigured) {
    await new Promise((r) => setTimeout(r, 700));
    const reference = `DEMO-VAERK-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    // eslint-disable-next-line no-console
    console.info("[DEMO-MODE] Værkstedsbooking modtaget (ikke gemt):", payload);
    return { reference, appointmentDate: input.appointmentDate, appointmentTime: input.appointmentTime, isDemo: true };
  }

  const { data, error } = await getSupabase().functions.invoke("submit-booking", { body: payload });
  if (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = (error as any)?.context?.status;
    if (status === 409) throw new SlotTakenError();
    throw new Error("Din booking kunne ikke sendes. Prøv igen, eller ring til os.");
  }
  if (!data?.reference) {
    throw new Error("Din booking kunne ikke sendes. Prøv igen, eller ring til os.");
  }

  return {
    reference: data.reference as string,
    appointmentDate: (data.appointmentDate as string) ?? input.appointmentDate,
    appointmentTime: (data.appointmentTime as string) ?? input.appointmentTime,
    isDemo: false,
  };
}
