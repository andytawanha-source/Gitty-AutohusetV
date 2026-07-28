import type { AdminVehicle } from "./types";

export interface QualityCheck {
  ready: boolean;
  missing: string[];
}

/** Simpel annoncekvalitets-indikator: hvad mangler, før annoncen er klar til publicering. */
export function checkVehicleQuality(v: Pick<AdminVehicle, "images" | "description" | "priceDkk" | "equipment" | "listingType">): QualityCheck {
  const missing: string[] = [];
  if (v.images.length === 0) missing.push("Billeder");
  if (!v.description || v.description.trim().length < 20) missing.push("Beskrivelse");
  if (v.listingType === "sale" && v.priceDkk === null) missing.push("Pris");
  if (v.equipment.length === 0) missing.push("Ekstraudstyr");
  return { ready: missing.length === 0, missing };
}

/** Advarer, hvis der findes en anden aktiv (ikke-arkiveret) annonce med samme reg.nr. eller stelnummer. */
export function findDuplicateVehicle(
  vehicles: AdminVehicle[],
  candidate: { id?: string; registrationNumber: string | null; vin: string | null }
): AdminVehicle | null {
  const regNr = candidate.registrationNumber?.trim().toUpperCase() || null;
  const vin = candidate.vin?.trim().toUpperCase() || null;
  if (!regNr && !vin) return null;
  return (
    vehicles.find(
      (v) =>
        v.id !== candidate.id &&
        v.status !== "archived" &&
        ((regNr && v.registrationNumber?.trim().toUpperCase() === regNr) || (vin && v.vin?.trim().toUpperCase() === vin))
    ) ?? null
  );
}
