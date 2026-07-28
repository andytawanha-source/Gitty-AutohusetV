import type { Vehicle } from "./types";

/** Filtertilstand – afspejles 1:1 i URL-searchparams, så søgninger kan deles. */
export interface VehicleFilters {
  make?: string;
  model?: string;
  priceFrom?: number;
  priceTo?: number;
  mileageFrom?: number;
  mileageTo?: number;
  yearFrom?: number;
  yearTo?: number;
  fuel?: string[];
  transmission?: string;
  bodyType?: string;
  color?: string;
  doors?: number;
  status?: string; // 'available' (default) | 'sold' | 'all'
  onlyElectric?: boolean;
  onlyHybrid?: boolean;
}

export type SortKey =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "mileage_asc"
  | "year_desc"
  | "make"
  | "model";

export const SORT_LABELS: Record<SortKey, string> = {
  newest: "Nyeste",
  price_asc: "Pris (lav til høj)",
  price_desc: "Pris (høj til lav)",
  mileage_asc: "Kilometer (lav til høj)",
  year_desc: "Modelår (nyeste først)",
  make: "Mærke (A–Å)",
  model: "Model (A–Å)",
};

const NUMERIC_KEYS = ["priceFrom", "priceTo", "mileageFrom", "mileageTo", "yearFrom", "yearTo", "doors"] as const;

export function filtersFromSearchParams(params: URLSearchParams): VehicleFilters {
  const f: VehicleFilters = {};
  const get = (k: string) => params.get(k) ?? undefined;
  f.make = get("maerke");
  f.model = get("model");
  f.transmission = get("gear");
  f.bodyType = get("biltype");
  f.color = get("farve");
  f.status = get("status");
  const fuel = params.getAll("drivmiddel");
  if (fuel.length) f.fuel = fuel;
  const numMap: Record<(typeof NUMERIC_KEYS)[number], string> = {
    priceFrom: "pris_fra", priceTo: "pris_til",
    mileageFrom: "km_fra", mileageTo: "km_til",
    yearFrom: "aar_fra", yearTo: "aar_til",
    doors: "doere",
  };
  for (const key of NUMERIC_KEYS) {
    const raw = get(numMap[key]);
    if (raw !== undefined) {
      const n = Number(raw);
      if (Number.isFinite(n)) f[key] = n;
    }
  }
  if (get("kun_el") === "1") f.onlyElectric = true;
  if (get("kun_hybrid") === "1") f.onlyHybrid = true;
  return f;
}

export function filtersToSearchParams(f: VehicleFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (f.make) params.set("maerke", f.make);
  if (f.model) params.set("model", f.model);
  if (f.transmission) params.set("gear", f.transmission);
  if (f.bodyType) params.set("biltype", f.bodyType);
  if (f.color) params.set("farve", f.color);
  if (f.status) params.set("status", f.status);
  for (const fuel of f.fuel ?? []) params.append("drivmiddel", fuel);
  if (f.priceFrom !== undefined) params.set("pris_fra", String(f.priceFrom));
  if (f.priceTo !== undefined) params.set("pris_til", String(f.priceTo));
  if (f.mileageFrom !== undefined) params.set("km_fra", String(f.mileageFrom));
  if (f.mileageTo !== undefined) params.set("km_til", String(f.mileageTo));
  if (f.yearFrom !== undefined) params.set("aar_fra", String(f.yearFrom));
  if (f.yearTo !== undefined) params.set("aar_til", String(f.yearTo));
  if (f.doors !== undefined) params.set("doere", String(f.doors));
  if (f.onlyElectric) params.set("kun_el", "1");
  if (f.onlyHybrid) params.set("kun_hybrid", "1");
  return params;
}

export function countActiveFilters(f: VehicleFilters): number {
  let n = 0;
  if (f.make) n++;
  if (f.model) n++;
  if (f.transmission) n++;
  if (f.bodyType) n++;
  if (f.color) n++;
  if (f.fuel?.length) n += f.fuel.length;
  if (f.priceFrom !== undefined || f.priceTo !== undefined) n++;
  if (f.mileageFrom !== undefined || f.mileageTo !== undefined) n++;
  if (f.yearFrom !== undefined || f.yearTo !== undefined) n++;
  if (f.doors !== undefined) n++;
  if (f.onlyElectric) n++;
  if (f.onlyHybrid) n++;
  return n;
}

/** Anvender filtre klient-side (demo-mode). Mod Supabase oversættes samme filtre til query-betingelser. */
export function applyFilters(vehicles: Vehicle[], f: VehicleFilters): Vehicle[] {
  return vehicles.filter((v) => {
    const status = f.status ?? "available";
    if (status === "available" && !(v.status === "published" || v.status === "reserved")) return false;
    if (status === "sold" && v.status !== "sold") return false;
    if (status === "all" && !["published", "reserved", "sold"].includes(v.status)) return false;
    if (f.make && v.make !== f.make) return false;
    if (f.model && v.model !== f.model) return false;
    if (f.priceFrom !== undefined && (v.priceDkk ?? 0) < f.priceFrom) return false;
    if (f.priceTo !== undefined && (v.priceDkk ?? Infinity) > f.priceTo) return false;
    if (f.mileageFrom !== undefined && (v.mileageKm ?? 0) < f.mileageFrom) return false;
    if (f.mileageTo !== undefined && (v.mileageKm ?? Infinity) > f.mileageTo) return false;
    if (f.yearFrom !== undefined && (v.modelYear ?? 0) < f.yearFrom) return false;
    if (f.yearTo !== undefined && (v.modelYear ?? Infinity) > f.yearTo) return false;
    if (f.fuel?.length && (!v.fuelType || !f.fuel.includes(v.fuelType))) return false;
    if (f.transmission && v.transmission !== f.transmission) return false;
    if (f.bodyType && v.bodyType !== f.bodyType) return false;
    if (f.color && v.color !== f.color) return false;
    if (f.doors !== undefined && v.doors !== f.doors) return false;
    if (f.onlyElectric && v.fuelType !== "el") return false;
    if (f.onlyHybrid && !(v.fuelType === "hybrid" || v.fuelType === "plugin_hybrid")) return false;
    return true;
  });
}

export function sortVehicles(vehicles: Vehicle[], sort: SortKey): Vehicle[] {
  const copy = [...vehicles];
  const cmp: Record<SortKey, (a: Vehicle, b: Vehicle) => number> = {
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    price_asc: (a, b) => (a.priceDkk ?? Infinity) - (b.priceDkk ?? Infinity),
    price_desc: (a, b) => (b.priceDkk ?? -1) - (a.priceDkk ?? -1),
    mileage_asc: (a, b) => (a.mileageKm ?? Infinity) - (b.mileageKm ?? Infinity),
    year_desc: (a, b) => (b.modelYear ?? 0) - (a.modelYear ?? 0),
    make: (a, b) => a.make.localeCompare(b.make, "da"),
    model: (a, b) => a.model.localeCompare(b.model, "da"),
  };
  return copy.sort(cmp[sort]);
}
