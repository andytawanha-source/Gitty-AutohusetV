import { FUEL_LABELS, TRANSMISSION_LABELS, type FuelType, type Transmission } from "./types";

export interface DescriptionInput {
  make: string;
  model: string;
  variant: string | null;
  modelYear: number | null;
  mileageKm: number | null;
  fuelType: FuelType | null;
  transmission: Transmission | null;
  bodyType: string | null;
  color: string | null;
  equipment: string[];
  listingType: "sale" | "rental";
}

/**
 * Genererer et REALISTISK, NEUTRALT udkast til en annoncetekst ud fra bilens
 * data og valgte ekstraudstyr. Skabelonbaseret (ingen ekstern AI-tjeneste) –
 * bevidst afdæmpet i sprogbrug, uden overdrevne eller ukontrollerbare
 * påstande ("perfekt", "fejlfri", "aldrig ramt af uheld" osv.).
 *
 * Dette er ALTID kun et forslag – kaldes eksplicit af admin via en knap, og
 * skal gennemses og redigeres/godkendes, før annoncen publiceres.
 */
export function generateDescriptionDraft(input: DescriptionInput): string {
  const title = [input.make, input.model, input.variant].filter(Boolean).join(" ");
  const yearPart = input.modelYear ? `${input.modelYear}-årgang` : null;
  const kmPart = input.mileageKm !== null ? `${input.mileageKm.toLocaleString("da-DK")} km` : null;
  const fuelPart = input.fuelType ? FUEL_LABELS[input.fuelType].toLowerCase() : null;
  const gearPart = input.transmission ? TRANSMISSION_LABELS[input.transmission].toLowerCase() : null;
  const bodyPart = input.bodyType ? input.bodyType.toLowerCase() : null;

  const introFacts = [yearPart, kmPart, fuelPart && `${fuelPart}motor`, gearPart, bodyPart].filter(Boolean).join(", ");
  const intro =
    input.listingType === "sale"
      ? `${title || "Denne bil"}${introFacts ? ` – ${introFacts}` : ""}.`
      : `${title || "Denne bil"} tilbydes til leje${introFacts ? ` – ${introFacts}` : ""}.`;

  const equipmentSentence =
    input.equipment.length > 0
      ? `Bilen er udstyret med blandt andet ${input.equipment.slice(0, 6).join(", ").toLowerCase()}${
          input.equipment.length > 6 ? " m.m." : ""
        }.`
      : null;

  const colorSentence = input.color ? `Farve: ${input.color}.` : null;

  const closing =
    input.listingType === "sale"
      ? "Kontakt os for en uforpligtende snak eller book en fremvisning – vi hjælper også gerne med finansiering og indregistrering."
      : "Kontakt os for at høre nærmere om ledighed og priser, eller book direkte.";

  return [intro, equipmentSentence, colorSentence, closing].filter(Boolean).join(" ");
}
