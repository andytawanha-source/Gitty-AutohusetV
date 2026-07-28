import { z } from "zod";
import { isValidPlate } from "@/lib/plate";
import type { NormalizedVehicleLookupResult } from "@/features/plate-lookup/types";

/** Version af samtykketekster – gemmes sammen med samtykket (spec pkt. 10). */
export const CONSENT_TEXT_VERSION = "sell-car-v0.1";
export const PRIVACY_POLICY_VERSION = "v0.1-udkast";

export const plateStepSchema = z.object({
  registrationNumber: z
    .string()
    .min(2, "Indtast din nummerplade")
    .refine(isValidPlate, "Indtast en gyldig dansk nummerplade, fx AB 12 345"),
  mileageKm: z.coerce
    .number({ invalid_type_error: "Indtast bilens kilometerstand" })
    .int()
    .min(0, "Kilometerstand kan ikke være negativ")
    .max(2_000_000, "Kontrollér kilometerstanden"),
});
export type PlateStepInput = z.infer<typeof plateStepSchema>;

/** Manuel indtastning når opslag fejler eller brugeren afviser resultatet. */
export const manualVehicleSchema = z.object({
  make: z.string().min(1, "Indtast bilens mærke"),
  model: z.string().min(1, "Indtast bilens model"),
  variant: z.string().optional(),
  modelYear: z.coerce
    .number({ invalid_type_error: "Indtast årgang" })
    .int()
    .min(1950, "Kontrollér årgangen")
    .max(new Date().getFullYear() + 1, "Kontrollér årgangen"),
  // Påkrævet (ikke bare "optional") – drivmiddel påvirker skønnet markant (fx +8% for el),
  // så et manglende svar her giver et upræcist/useriøst skøn frem for blot et mindre nøjagtigt.
  fuelType: z.string().min(1, "Vælg drivmiddel"),
  transmission: z.string().optional(),
  color: z.string().optional(),
});
export type ManualVehicleInput = z.infer<typeof manualVehicleSchema>;

export const conditionStepSchema = z.object({
  isDrivable: z.enum(["ja", "nej"], { errorMap: () => ({ message: "Vælg om bilen er kørende" }) }),
  hasServiceBook: z.enum(["ja", "nej", "delvist"], { errorMap: () => ({ message: "Vælg en mulighed" }) }),
  lastService: z.string().max(200).optional(),
  keyCount: z.enum(["1", "2", "3+"], { errorMap: () => ({ message: "Vælg antal nøgler" }) }),
  hasDamages: z.enum(["ja", "nej"], { errorMap: () => ({ message: "Vælg en mulighed" }) }),
  knownDamages: z.string().max(1000).optional(),
  hasWarningLights: z.enum(["ja", "nej"], { errorMap: () => ({ message: "Vælg en mulighed" }) }),
  warningLights: z.string().max(500).optional(),
  mechanicalIssues: z.string().max(1000).optional(),
  tireCondition: z.enum(["nye", "gode", "slidte", "ved_ikke"]).optional(),
  interiorCondition: z.enum(["som_ny", "god", "slidt"]).optional(),
  smokeFree: z.enum(["ja", "nej"], { errorMap: () => ({ message: "Vælg en mulighed" }) }),
  isImported: z.enum(["ja", "nej", "ved_ikke"]).optional(),
  hasFinance: z.enum(["ja", "nej"], { errorMap: () => ({ message: "Vælg en mulighed" }) }),
  financeDetails: z.string().max(500).optional(),
  saleTimeline: z.enum(["hurtigst_muligt", "inden_for_en_maaned", "undersoeger_pris"], {
    errorMap: () => ({ message: "Vælg hvornår du ønsker at sælge" }),
  }),
  comment: z.string().max(2000).optional(),
});
export type ConditionStepInput = z.infer<typeof conditionStepSchema>;

export const contactStepSchema = z.object({
  name: z.string().min(2, "Indtast dit navn").max(120),
  phone: z.string().min(6, "Indtast et gyldigt telefonnummer").max(20),
  email: z.string().email("Indtast en gyldig e-mailadresse"),
  postalCode: z.string().regex(/^\d{4}$/, "Indtast et gyldigt postnummer"),
  preferredChannel: z.enum(["phone", "email", "sms"], {
    errorMap: () => ({ message: "Vælg hvordan vi må kontakte dig" }),
  }),
  bestContactTime: z.string().max(100).optional(),
  message: z.string().max(2000).optional(),
  // Honeypot
  website: z.string().max(0).optional(),
});
export type ContactStepInput = z.infer<typeof contactStepSchema>;

export const consentStepSchema = z.object({
  processingConsent: z.literal(true, {
    errorMap: () => ({ message: "Du skal acceptere behandlingen af dine oplysninger for at sende henvendelsen" }),
  }),
  marketingConsent: z.boolean().optional().default(false),
  marketingChannels: z.array(z.enum(["email", "sms"])).optional().default([]),
});
export type ConsentStepInput = z.infer<typeof consentStepSchema>;

export interface LeadPhoto {
  id: string;
  file: File;
  previewUrl: string;
  category: "front" | "back" | "driver_side" | "passenger_side" | "interior" | "dashboard" | "damage" | "extra";
  uploadProgress?: number;
}

export const PHOTO_CATEGORIES: Array<{ key: LeadPhoto["category"]; label: string; required?: boolean }> = [
  { key: "front", label: "Forfra" },
  { key: "back", label: "Bagfra" },
  { key: "driver_side", label: "Førerside" },
  { key: "passenger_side", label: "Passagerside" },
  { key: "interior", label: "Kabine" },
  { key: "dashboard", label: "Instrumentbræt m. km-stand" },
  { key: "damage", label: "Eventuelle skader" },
  { key: "extra", label: "Ekstra billeder" },
];

export interface TradeInEstimate {
  lowDkk: number;
  midDkk: number;
  highDkk: number;
  sampleSize: number;
  basis: string;
}

/** Kontekst når byttebilvurderingen startes fra en konkret bils detaljeside ("Byt din bil"). */
export interface InterestVehicleRef {
  id: string;
  label: string; // fx "Volkswagen ID.4 Pro Performance"
  priceDkk: number | null;
  slug: string;
}

export interface SellCarState {
  plate?: PlateStepInput;
  lookup?: NormalizedVehicleLookupResult | null; // null = manuel indtastning valgt
  manualVehicle?: ManualVehicleInput;
  condition?: ConditionStepInput;
  photos: LeadPhoto[];
  contact?: ContactStepInput;
  /** Kun udfyldt når vurderingen startes som "Byt din bil" fra en bils detaljeside. */
  interestVehicle?: InterestVehicleRef;
  /** Automatisk beregnet skøn – vises for brugeren og gemmes som reference til sælgeren. */
  estimate?: TradeInEstimate;
}
