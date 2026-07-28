import { normalizePlate } from "@/lib/plate";
import type { NormalizedVehicleLookupResult, VehicleLookupProvider } from "./types";

/**
 * Mock-provider til lokal udvikling og demo-mode.
 * Deterministisk (samme plade → samme bil), tydeligt markeret som mockdata.
 * Plader der starter med "XX" simulerer "bil ikke fundet".
 */

const MOCK_VEHICLES: Array<Omit<NormalizedVehicleLookupResult, "provider" | "isMock" | "registrationNumber">> = [
  { make: "Volkswagen", model: "Golf", variant: "1.5 TSI Style", modelYear: 2019, firstRegistrationDate: "2019-06-15", fuelType: "Benzin", transmission: "Manuel", bodyType: "Hatchback", color: "Grå", engineSize: 1.5, powerHp: 130, curbWeightKg: 1280, totalWeightKg: 1850, registrationStatus: "Registreret", inspectionDate: "2025-05-12", nextInspectionDate: "2027-05-12", equipment: ["Fartpilot", "Apple CarPlay", "Parkeringssensorer"] },
  { make: "Toyota", model: "Corolla", variant: "1.8 Hybrid Active", modelYear: 2021, firstRegistrationDate: "2021-02-20", fuelType: "Hybrid", transmission: "Automatisk", bodyType: "Stationcar", color: "Sort", engineSize: 1.8, powerHp: 122, curbWeightKg: 1370, totalWeightKg: 1930, registrationStatus: "Registreret", inspectionDate: "2025-01-30", nextInspectionDate: "2027-01-30", equipment: ["Adaptiv fartpilot", "Bakkamera", "Sædevarme"] },
  { make: "Tesla", model: "Model Y", variant: "Long Range AWD", modelYear: 2022, firstRegistrationDate: "2022-09-01", fuelType: "El", transmission: "Automatisk", bodyType: "SUV", color: "Hvid", powerHp: 514, batteryCapacityKwh: 75, electricRangeKm: 533, curbWeightKg: 1979, totalWeightKg: 2554, registrationStatus: "Registreret", equipment: ["Autopilot", "Panoramatag", "Varmepumpe"] },
  { make: "Ford", model: "Focus", variant: "1.0 EcoBoost Titanium", modelYear: 2018, firstRegistrationDate: "2018-04-10", fuelType: "Benzin", transmission: "Manuel", bodyType: "Stationcar", color: "Blå", engineSize: 1.0, powerHp: 125, curbWeightKg: 1322, totalWeightKg: 1900, registrationStatus: "Registreret", inspectionDate: "2024-03-18", nextInspectionDate: "2026-03-18", equipment: ["Navigation", "Fartpilot"] },
  { make: "Audi", model: "A4", variant: "40 TDI Avant S tronic", modelYear: 2020, firstRegistrationDate: "2020-11-05", fuelType: "Diesel", transmission: "Automatisk", bodyType: "Stationcar", color: "Sort", engineSize: 2.0, powerHp: 204, curbWeightKg: 1660, totalWeightKg: 2225, registrationStatus: "Registreret", inspectionDate: "2024-10-22", nextInspectionDate: "2026-10-22", equipment: ["Matrix LED", "Virtual cockpit", "El-bagklap"] },
  { make: "Peugeot", model: "208", variant: "1.2 PureTech Allure", modelYear: 2020, firstRegistrationDate: "2020-07-14", fuelType: "Benzin", transmission: "Manuel", bodyType: "Hatchback", color: "Gul", engineSize: 1.2, powerHp: 100, curbWeightKg: 1090, totalWeightKg: 1590, registrationStatus: "Registreret", equipment: ["3D-cockpit", "Fartpilot"] },
];

function hashPlate(plate: string): number {
  let h = 0;
  for (const ch of plate) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export const mockProvider: VehicleLookupProvider = {
  name: "mock",
  async lookupByRegistration(registrationNumber: string): Promise<NormalizedVehicleLookupResult> {
    const plate = normalizePlate(registrationNumber);
    // Simuleret svartid
    await new Promise((r) => setTimeout(r, 700 + (hashPlate(plate) % 500)));

    if (plate.startsWith("XX")) {
      const err = new Error("NOT_FOUND");
      err.name = "NotFoundError";
      throw err;
    }

    const template = MOCK_VEHICLES[hashPlate(plate) % MOCK_VEHICLES.length];
    return {
      provider: "mock",
      isMock: true,
      registrationNumber: plate,
      ...template,
    };
  },
};
