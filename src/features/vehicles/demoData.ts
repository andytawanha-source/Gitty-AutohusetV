import type { Vehicle } from "./types";
import { resolveBrandKey } from "@/config/brands";

/**
 * DEMO-MODE-DATA – bruges KUN når Supabase ikke er konfigureret.
 * Spejler seed-dataene (supabase/seed.sql). Alt er tydeligt fiktivt.
 */

const ORG_VEST = "11111111-1111-1111-1111-111111111111";
const ORG_V = "22222222-2222-2222-2222-222222222222";

/**
 * DEMO-BILLEDER: Frit anvendelige stockfotos fra Pexels (Pexels License –
 * gratis til kommerciel brug, ingen kildeangivelse påkrævet), valgt pr.
 * biltype så demoen ser præsentabel ud i stedet for grå ikon-placeholders.
 * Billederne linkes direkte fra Pexels' CDN. Dette er KUN til demo-mode –
 * når rigtige biler oprettes via admin, uploades rigtige billeder af den
 * faktiske bil i stedet.
 */
const STOCK_PHOTOS_BY_BODY_TYPE: Record<string, number[]> = {
  SUV: [33145484, 4003121],
  Hatchback: [9943259, 4223877],
  Sedan: [100656, 5864402],
  Stationcar: [18837782, 18837781],
};
const FALLBACK_STOCK_PHOTOS = [33145484, 100656];

function img(id: string, bodyType: string | null | undefined, alt: string) {
  const photoIds = STOCK_PHOTOS_BY_BODY_TYPE[bodyType ?? ""] ?? FALLBACK_STOCK_PHOTOS;
  return photoIds.map((photoId, i) => ({
    id: `${id}-img-${i}`,
    url: `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=1200`,
    altText: `${alt} – demobillede (stockfoto, Pexels)`,
    isPrimary: i === 0,
    sortOrder: i,
  }));
}

let seq = 0;
function base(
  org: string,
  data: Partial<Vehicle> & Pick<Vehicle, "make" | "model" | "slug">
): Vehicle {
  seq += 1;
  const alt = `${data.make} ${data.model}`;
  return {
    id: `demo-${seq}`,
    organizationId: org,
    variant: null,
    modelYear: null,
    firstRegistration: null,
    mileageKm: null,
    priceDkk: null,
    monthlyPriceDkk: null,
    fuelType: null,
    transmission: null,
    bodyType: null,
    color: null,
    doors: 5,
    seats: 5,
    powerHp: null,
    engine: null,
    batteryKwh: null,
    rangeKm: null,
    consumption: null,
    taxPeriodDkk: null,
    registrationNumber: null,
    showRegistrationNumber: false,
    description: null,
    equipment: [],
    badges: [],
    isFeatured: false,
    seoTitle: null,
    seoDescription: null,
    status: "published",
    soldAt: null,
    createdAt: new Date(Date.now() - seq * 86_400_000).toISOString(),
    images: img(`demo-${seq}`, data.bodyType, alt),
    listingType: "sale",
    ...data,
  };
}

const vestVehicles: Vehicle[] = [
  base(ORG_VEST, {
    make: "Volkswagen", model: "ID.4", variant: "Pro Performance", modelYear: 2022,
    firstRegistration: "2022-05-10", mileageKm: 48000, priceDkk: 269900, monthlyPriceDkk: 3495,
    fuelType: "el", transmission: "automatisk", bodyType: "SUV", color: "Grå", powerHp: 204,
    engine: "Elmotor", batteryKwh: 77, rangeKm: 480, consumption: "18,1 kWh/100 km",
    description: "TESTDATA: Velholdt elektrisk familie-SUV med ét ejerskab og fuld servicehistorik.",
    equipment: ["Adaptiv fartpilot", "Varmepumpe", "Bakkamera", "Apple CarPlay", "LED Matrix-lygter"],
    badges: ["Elbil", "Populær"], isFeatured: true,
    slug: "volkswagen-id4-pro-performance-2022",
  }),
  base(ORG_VEST, {
    make: "Toyota", model: "Yaris", variant: "1.5 Hybrid H2", modelYear: 2021,
    firstRegistration: "2021-03-15", mileageKm: 62000, priceDkk: 154900, monthlyPriceDkk: 1995,
    fuelType: "hybrid", transmission: "automatisk", bodyType: "Hatchback", color: "Rød", powerHp: 116,
    engine: "1.5 benzin/el", consumption: "25,6 km/l",
    description: "TESTDATA: Økonomisk hybrid i flot stand. Serviceret hos mærkeværksted.",
    equipment: ["Fartpilot", "Bakkamera", "Sædevarme", "Android Auto"],
    badges: ["Nyhed"],
    slug: "toyota-yaris-15-hybrid-h2-2021",
  }),
  base(ORG_VEST, {
    make: "Peugeot", model: "308", variant: "1.5 BlueHDi Allure", modelYear: 2020,
    firstRegistration: "2020-09-01", mileageKm: 89000, priceDkk: 129900, monthlyPriceDkk: 1695,
    fuelType: "diesel", transmission: "manuel", bodyType: "Stationcar", color: "Blå", powerHp: 130,
    engine: "1.5 diesel", consumption: "22,2 km/l",
    description: "TESTDATA: Rummelig dieselstationcar – perfekt pendlerbil med lavt forbrug.",
    equipment: ["Navigation", "Parkeringssensorer", "Fuldautomatisk klima"],
    slug: "peugeot-308-15-bluehdi-allure-2020",
  }),
  base(ORG_VEST, {
    make: "Tesla", model: "Model 3", variant: "Long Range AWD", modelYear: 2023,
    firstRegistration: "2023-01-20", mileageKm: 31000, priceDkk: 319900, monthlyPriceDkk: 4195,
    fuelType: "el", transmission: "automatisk", bodyType: "Sedan", color: "Hvid", doors: 4, powerHp: 498,
    engine: "Dual motor", batteryKwh: 75, rangeKm: 602, consumption: "14,7 kWh/100 km",
    description: "TESTDATA: Lang rækkevidde, autopilot og ét ejerskab fra ny.",
    equipment: ["Autopilot", "Panoramatag", "Sædevarme for/bag", "Premium lyd"],
    badges: ["Elbil", "Populær"], isFeatured: true,
    slug: "tesla-model-3-long-range-awd-2023",
  }),
  base(ORG_VEST, {
    make: "Ford", model: "Kuga", variant: "2.5 PHEV Titanium", modelYear: 2022,
    firstRegistration: "2022-08-05", mileageKm: 44000, priceDkk: 259900, monthlyPriceDkk: 3295,
    fuelType: "plugin_hybrid", transmission: "automatisk", bodyType: "SUV", color: "Sort", powerHp: 225,
    engine: "2.5 benzin/el", batteryKwh: 14.4, rangeKm: 56, consumption: "1,4 l/100 km (WLTP)",
    description: "TESTDATA: Plugin-hybrid SUV med lav beskatning og masser af udstyr.",
    equipment: ["Adaptiv fartpilot", "El-bagklap", "Trådløs opladning", "B&O lydanlæg"],
    badges: ["Nyhed"],
    slug: "ford-kuga-25-phev-titanium-2022",
  }),
  base(ORG_VEST, {
    make: "Skoda", model: "Octavia", variant: "1.0 TSI Style", modelYear: 2019,
    firstRegistration: "2019-06-12", mileageKm: 112000, priceDkk: 119900, monthlyPriceDkk: 1595,
    fuelType: "benzin", transmission: "manuel", bodyType: "Stationcar", color: "Sølv", powerHp: 115,
    engine: "1.0 benzin", consumption: "18,9 km/l",
    description: "TESTDATA: Populær familiebil med stort bagagerum og god økonomi.",
    equipment: ["Fartpilot", "Parkeringssensorer bag", "DAB-radio"],
    slug: "skoda-octavia-10-tsi-style-2019",
  }),
  base(ORG_VEST, {
    make: "Hyundai", model: "Kona Electric", variant: "64 kWh Ultimate", modelYear: 2021,
    firstRegistration: "2021-11-30", mileageKm: 55000, priceDkk: 189900, monthlyPriceDkk: 2495,
    fuelType: "el", transmission: "automatisk", bodyType: "SUV", color: "Grøn", powerHp: 204,
    engine: "Elmotor", batteryKwh: 64, rangeKm: 484, consumption: "14,7 kWh/100 km",
    description: "TESTDATA: Elbil med lang rækkevidde og fabriksgaranti på batteriet.",
    equipment: ["Ventilerede sæder", "Head-up display", "Krell lydanlæg", "Adaptiv fartpilot"],
    badges: ["Elbil"], status: "reserved",
    slug: "hyundai-kona-electric-64-kwh-ultimate-2021",
  }),
  base(ORG_VEST, {
    make: "BMW", model: "320d", variant: "Touring Sport Line", modelYear: 2020,
    firstRegistration: "2020-02-18", mileageKm: 98000, priceDkk: 289900, monthlyPriceDkk: 3695,
    fuelType: "diesel", transmission: "automatisk", bodyType: "Stationcar", color: "Sort", powerHp: 190,
    engine: "2.0 diesel", consumption: "20,4 km/l",
    description: "TESTDATA: Velkørende premium-stationcar med fuld servicehistorik.",
    equipment: ["Læderindtræk", "El-sæder m. memory", "Adaptiv undervogn", "LED-lygter"],
    badges: ["Populær"],
    slug: "bmw-320d-touring-sport-line-2020",
  }),
  base(ORG_VEST, {
    make: "Citroën", model: "C3", variant: "1.2 PureTech Feel", modelYear: 2018,
    firstRegistration: "2018-04-25", mileageKm: 134000, priceDkk: 74900, monthlyPriceDkk: 995,
    fuelType: "benzin", transmission: "manuel", bodyType: "Hatchback", color: "Hvid", powerHp: 82,
    engine: "1.2 benzin", consumption: "20,0 km/l",
    description: "TESTDATA: Prisvenlig bybil – solgt, vises som referencebil.",
    equipment: ["Touchskærm", "Fartpilot", "Bluetooth"],
    badges: ["Solgt"], status: "sold", soldAt: "2026-06-20T10:00:00Z",
    slug: "citroen-c3-12-puretech-feel-2018",
  }),
];

const vVehicles: Vehicle[] = [
  base(ORG_V, {
    make: "Mercedes-Benz", model: "E300de", variant: "AMG Line", modelYear: 2021,
    firstRegistration: "2021-07-08", mileageKm: 72000, priceDkk: 429900, monthlyPriceDkk: 5495,
    fuelType: "plugin_hybrid", transmission: "automatisk", bodyType: "Sedan", color: "Sort", doors: 4, powerHp: 306,
    engine: "2.0 diesel/el", batteryKwh: 13.5, rangeKm: 54, consumption: "1,6 l/100 km (WLTP)",
    description: "TESTDATA: Eksklusiv plugin-hybrid sedan med AMG-udstyr.",
    equipment: ["AMG Line", "Burmester lyd", "360-kamera", "Multibeam LED"],
    badges: ["Populær"], isFeatured: true,
    slug: "mercedes-benz-e300de-amg-line-2021",
  }),
  base(ORG_V, {
    make: "Porsche", model: "Taycan", variant: "4S", modelYear: 2022,
    firstRegistration: "2022-03-14", mileageKm: 29000, priceDkk: 899900, monthlyPriceDkk: 10995,
    fuelType: "el", transmission: "automatisk", bodyType: "Sedan", color: "Grå", doors: 4, seats: 4, powerHp: 530,
    engine: "Dual motor", batteryKwh: 93.4, rangeKm: 464, consumption: "20,4 kWh/100 km",
    description: "TESTDATA: Elektrisk sportssedan i exceptionel stand.",
    equipment: ["Sport Chrono", "Luftundervogn", "Panoramatag", "BOSE lyd"],
    badges: ["Elbil"], isFeatured: true,
    slug: "porsche-taycan-4s-2022",
  }),
  base(ORG_V, {
    make: "Audi", model: "Q5", variant: "55 TFSI e quattro S line", modelYear: 2021,
    firstRegistration: "2021-10-01", mileageKm: 58000, priceDkk: 449900, monthlyPriceDkk: 5795,
    fuelType: "plugin_hybrid", transmission: "automatisk", bodyType: "SUV", color: "Blå", powerHp: 367,
    engine: "2.0 benzin/el", batteryKwh: 17.9, rangeKm: 62, consumption: "1,9 l/100 km (WLTP)",
    description: "TESTDATA: Kraftfuld plugin-hybrid SUV med S line-pakke.",
    equipment: ["S line", "Matrix LED", "Virtual cockpit", "El-bagklap"],
    badges: ["Nyhed"],
    slug: "audi-q5-55-tfsi-e-quattro-s-line-2021",
  }),
  base(ORG_V, {
    make: "BMW", model: "iX3", variant: "Charged Plus", modelYear: 2022,
    firstRegistration: "2022-06-20", mileageKm: 41000, priceDkk: 419900, monthlyPriceDkk: 5395,
    fuelType: "el", transmission: "automatisk", bodyType: "SUV", color: "Hvid", powerHp: 286,
    engine: "Elmotor", batteryKwh: 80, rangeKm: 460, consumption: "18,9 kWh/100 km",
    description: "TESTDATA: Elektrisk SUV med lang rækkevidde og premium-komfort.",
    equipment: ["Panoramatag", "Harman Kardon", "Adaptiv fartpilot", "360-kamera"],
    badges: ["Elbil"],
    slug: "bmw-ix3-charged-plus-2022",
  }),
  base(ORG_V, {
    make: "Volvo", model: "XC60", variant: "B4 Mild-Hybrid Plus Dark", modelYear: 2023,
    firstRegistration: "2023-02-11", mileageKm: 24000, priceDkk: 519900, monthlyPriceDkk: 6695,
    fuelType: "hybrid", transmission: "automatisk", bodyType: "SUV", color: "Sort", powerHp: 197,
    engine: "2.0 benzin mild-hybrid", consumption: "15,4 km/l",
    description: "TESTDATA: Næsten ny svensk premium-SUV med fabriksgaranti.",
    equipment: ["Pilot Assist", "Panoramatag", "Sædevarme hele vejen rundt", "El-bagklap"],
    badges: ["Nyhed", "Populær"],
    slug: "volvo-xc60-b4-mild-hybrid-plus-dark-2023",
  }),
];

/** Returnerer demobiler for det aktive brand (tenant-isolation gælder også i demo-mode). */
export function getDemoVehicles(): Vehicle[] {
  const key = resolveBrandKey();
  return key === "autohuset-v" ? vVehicles : vestVehicles;
}
