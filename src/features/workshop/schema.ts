import { z } from "zod";
import { isValidPlate } from "@/lib/plate";

/** Ydelser der kan bookes i værkstedet (spejler `service_type` som fri tekst i databasen). */
export const SERVICE_TYPES = [
  "Serviceeftersyn",
  "Dækskift",
  "Bremser",
  "Klargøring til syn",
  "Reparation",
  "Andet",
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

/**
 * Bookbare tider: timeslots inden for åbningstiden mandag–fredag 09:00–17:30.
 * Sidste slot starter 16:00, så der er en time til arbejdet inden lukketid.
 */
export const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];

export const MAX_BOOKING_DAYS_AHEAD = 14;

function toLocalDate(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** true hvis datoen er en hverdag (mandag–fredag) – værkstedet holder lukket i weekenden. */
export function isWeekday(dateStr: string): boolean {
  const d = toLocalDate(dateStr);
  if (!d) return false;
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

/** true hvis datoen ligger mellem i dag og i dag + {@link MAX_BOOKING_DAYS_AHEAD} dage. */
export function isWithinBookingWindow(dateStr: string): boolean {
  const d = toLocalDate(dateStr);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const max = new Date(today);
  max.setDate(max.getDate() + MAX_BOOKING_DAYS_AHEAD);
  return d.getTime() >= today.getTime() && d.getTime() <= max.getTime();
}

export const bookingFormSchema = z
  .object({
    registrationNumber: z
      .string()
      .min(2, "Indtast din nummerplade")
      .refine(isValidPlate, "Indtast en gyldig dansk nummerplade, fx AB 12 345"),
    serviceType: z.enum(SERVICE_TYPES, { errorMap: () => ({ message: "Vælg en ydelse" }) }),
    serviceNote: z.string().max(500).optional(),
    appointmentDate: z
      .string()
      .min(1, "Vælg en dato")
      .refine(isWithinBookingWindow, `Vælg en dato inden for de næste ${MAX_BOOKING_DAYS_AHEAD} dage`)
      .refine(isWeekday, "Vi holder lukket i weekenden – vælg en hverdag"),
    appointmentTime: z.enum(TIME_SLOTS, { errorMap: () => ({ message: "Vælg et tidspunkt" }) }),
    name: z.string().min(2, "Indtast dit navn").max(120),
    email: z.string().email("Indtast en gyldig e-mailadresse"),
    phone: z.string().min(6, "Indtast et gyldigt telefonnummer").max(20),
    // Honeypot
    website: z.string().max(0).optional(),
  })
  .refine((data) => data.serviceType !== "Andet" || Boolean(data.serviceNote?.trim()), {
    message: "Beskriv kort, hvad du har brug for hjælp til",
    path: ["serviceNote"],
  });

export type BookingFormInput = z.infer<typeof bookingFormSchema>;
