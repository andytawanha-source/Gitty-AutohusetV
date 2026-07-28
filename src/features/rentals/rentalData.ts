/**
 * PLACEHOLDER-DATA: Biludlejningen sker gennem samarbejdspartneren One2move –
 * vi har ikke selv et lejebillager. Nedenstående er tilfældige eksempelbiler,
 * der viser typen af biler man typisk kan leje. Erstat med rigtige biler/priser,
 * hvis One2move leverer et feed.
 */
export interface RentalCar {
  slug: string;
  name: string;
  category: string;
  priceFrom: number;
  seats: number;
  transmission: string;
  fuel: string;
  description: string;
  features: string[];
}

export const RENTAL_CARS: RentalCar[] = [
  {
    slug: "vw-polo-eller-lignende",
    name: "VW Polo eller lignende",
    category: "Personbil, lille",
    priceFrom: 349,
    seats: 4,
    transmission: "Manuel",
    fuel: "Benzin",
    description:
      "TESTDATA: En kompakt og økonomisk bybil, der er nem at parkere og billig i drift. Perfekt til byture, pendling eller som ekstra bil i en kortere periode.",
    features: ["Klimaanlæg", "Bluetooth", "Lavt forbrug", "100 km/dag inkluderet"],
  },
  {
    slug: "vw-golf-eller-lignende",
    name: "VW Golf eller lignende",
    category: "Personbil, mellemklasse",
    priceFrom: 449,
    seats: 5,
    transmission: "Automatgear",
    fuel: "Benzin",
    description:
      "TESTDATA: Rummelig mellemklassebil med god plads til bagage – velegnet til familieture eller længere kørsel.",
    features: ["Automatgear", "Fartpilot", "Bakkamera", "100 km/dag inkluderet"],
  },
  {
    slug: "vw-caddy-eller-lignende",
    name: "VW Caddy eller lignende",
    category: "Varevogn",
    priceFrom: 549,
    seats: 3,
    transmission: "Manuel",
    fuel: "Diesel",
    description:
      "TESTDATA: Praktisk varevogn med god lastkapacitet – ideel til transport af møbler, værktøj eller varer.",
    features: ["Stor lastplads", "Bakkamera", "Diesel – lavt forbrug ved kørsel", "100 km/dag inkluderet"],
  },
  {
    slug: "ford-transit-eller-lignende",
    name: "Ford Transit eller lignende",
    category: "Flyttebil",
    priceFrom: 649,
    seats: 3,
    transmission: "Manuel",
    fuel: "Diesel",
    description:
      "TESTDATA: Stor flyttebil med plads til møbler og flyttekasser. Perfekt til flyttedagen eller større transportopgaver.",
    features: ["Stor kassevogn", "Lad-lift kan tilvælges", "Automatisk bakalarm", "100 km/dag inkluderet"],
  },
  {
    slug: "mercedes-vito-eller-lignende",
    name: "Mercedes Vito eller lignende",
    category: "Minibus, 9 personer",
    priceFrom: 899,
    seats: 9,
    transmission: "Automatgear",
    fuel: "Diesel",
    description:
      "TESTDATA: Minibus til hele holdet – velegnet til udflugter, fester eller transport af en større gruppe.",
    features: ["9 personer", "Klimaanlæg", "Automatgear", "100 km/dag inkluderet"],
  },
  {
    slug: "vw-passat-stationcar",
    name: "VW Passat stationcar",
    category: "Stationcar",
    priceFrom: 499,
    seats: 5,
    transmission: "Automatgear",
    fuel: "Diesel",
    description:
      "TESTDATA: Rummelig stationcar med stort bagagerum – ideel til ferieture eller når der skal køres med meget bagage.",
    features: ["Stort bagagerum", "Fartpilot", "Automatgear", "100 km/dag inkluderet"],
  },
];

export function getRentalCarBySlug(slug: string): RentalCar | undefined {
  return RENTAL_CARS.find((c) => c.slug === slug);
}
