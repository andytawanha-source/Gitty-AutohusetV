/**
 * Provider-uafhængig nummerpladeintegration (spec pkt. 11).
 * Rigtige opslag sker ALTID server-side i Edge Functionen `plate-lookup`.
 * Klienten kender kun den normaliserede model.
 */

export interface VehicleLookupProvider {
  readonly name: string;
  lookupByRegistration(registrationNumber: string): Promise<NormalizedVehicleLookupResult>;
}

export type NormalizedVehicleLookupResult = {
  provider: string;
  /** true når resultatet er mockdata – skal vises tydeligt i UI */
  isMock: boolean;
  registrationNumber: string;
  make?: string;
  model?: string;
  variant?: string;
  modelYear?: number;
  firstRegistrationDate?: string;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  color?: string;
  engineSize?: number;
  powerHp?: number;
  powerKw?: number;
  batteryCapacityKwh?: number;
  electricRangeKm?: number;
  curbWeightKg?: number;
  totalWeightKg?: number;
  registrationStatus?: string;
  inspectionDate?: string;
  nextInspectionDate?: string;
  equipment?: string[];
  rawProviderData?: Record<string, unknown>;
};

export type LookupOutcome =
  | { status: "success"; result: NormalizedVehicleLookupResult }
  | { status: "not_found" }
  | { status: "rate_limited" }
  | { status: "disabled" }
  | { status: "error"; message?: string };
