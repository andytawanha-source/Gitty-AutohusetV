/**
 * Normalisering og validering af danske nummerplader.
 * Standardformat: 2 bogstaver + 5 cifre (AB12345).
 * Historiske/særlige formater (fx ønskeplader) tillades med 2-7 alfanumeriske tegn.
 */

/** Fjerner mellemrum/bindestreger og konverterer til store bogstaver. */
export function normalizePlate(input: string): string {
  return input.replace(/[\s\-.]/g, "").toUpperCase();
}

const STANDARD_PLATE = /^[A-ZÆØÅ]{2}\d{5}$/;
const CUSTOM_PLATE = /^[A-ZÆØÅ0-9]{2,7}$/;

export function isValidPlate(input: string): boolean {
  const plate = normalizePlate(input);
  return STANDARD_PLATE.test(plate) || CUSTOM_PLATE.test(plate);
}

/** true hvis pladen matcher det almindelige danske format AB12345. */
export function isStandardPlate(input: string): boolean {
  return STANDARD_PLATE.test(normalizePlate(input));
}
