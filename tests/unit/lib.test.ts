import { normalizePlate, isValidPlate, isStandardPlate } from "@/lib/plate";
import { formatMileage, formatMonthlyPrice, formatPrice } from "@/lib/format";
import { slugify, vehicleSlug } from "@/lib/slug";
import { applyFilters, filtersFromSearchParams, filtersToSearchParams, sortVehicles } from "@/features/vehicles/filters";
import { getDemoVehicles } from "@/features/vehicles/demoData";

describe("normalizePlate", () => {
  it("fjerner mellemrum og bindestreger og bruger store bogstaver", () => {
    expect(normalizePlate("ab 12 345")).toBe("AB12345");
    expect(normalizePlate("ab-12-345")).toBe("AB12345");
    expect(normalizePlate(" cd67890 ")).toBe("CD67890");
  });

  it("validerer danske plader", () => {
    expect(isValidPlate("AB12345")).toBe(true);
    expect(isStandardPlate("ab 12 345")).toBe(true);
    expect(isValidPlate("X")).toBe(false);
    expect(isValidPlate("ALTFORLANGPLADE")).toBe(false);
    expect(isValidPlate("MINBIL")).toBe(true); // ønskeplade
  });
});

describe("formatering", () => {
  it("formaterer priser og kilometer på dansk", () => {
    expect(formatPrice(249900)).toMatch(/249\.900/);
    expect(formatMileage(85000)).toBe("85.000 km");
    expect(formatMonthlyPrice(2495)).toBe("2.495 kr./md.");
  });
});

describe("slugify", () => {
  it("håndterer æ/ø/å og specialtegn", () => {
    expect(slugify("Citroën C3 – blå")).toBe("citroen-c3-blaa");
    expect(slugify("Škoda Octavia 1.0")).toBe("skoda-octavia-1-0");
    expect(slugify("Sælges hurtigt")).toBe("saelges-hurtigt");
  });

  it("bygger bilslugs", () => {
    expect(vehicleSlug({ make: "VW", model: "ID.4", variant: "Pro", year: 2022 })).toBe("vw-id-4-pro-2022");
  });
});

describe("filtre", () => {
  const vehicles = getDemoVehicles();

  it("viser kun tilgængelige biler som standard (aldrig kladder)", () => {
    const result = applyFilters(vehicles, {});
    expect(result.every((v) => v.status === "published" || v.status === "reserved")).toBe(true);
  });

  it("filtrerer på drivmiddel, pris og kun-el", () => {
    const el = applyFilters(vehicles, { onlyElectric: true });
    expect(el.length).toBeGreaterThan(0);
    expect(el.every((v) => v.fuelType === "el")).toBe(true);

    const cheap = applyFilters(vehicles, { priceTo: 160000 });
    expect(cheap.every((v) => (v.priceDkk ?? 0) <= 160000)).toBe(true);
  });

  it("sorterer efter pris", () => {
    const sorted = sortVehicles(applyFilters(vehicles, {}), "price_asc");
    const prices = sorted.map((v) => v.priceDkk ?? 0);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it("URL-parametre er tur/retur-stabile", () => {
    const filters = { make: "Tesla", priceTo: 400000, fuel: ["el"], onlyElectric: true };
    const roundTripped = filtersFromSearchParams(filtersToSearchParams(filters));
    expect(roundTripped.make).toBe("Tesla");
    expect(roundTripped.priceTo).toBe(400000);
    expect(roundTripped.fuel).toEqual(["el"]);
    expect(roundTripped.onlyElectric).toBe(true);
  });
});

describe("tenant-isolation i demodata", () => {
  it("demobiler tilhører kun det aktive brand (default: autohuset-vest)", () => {
    const vehicles = getDemoVehicles();
    expect(vehicles.every((v) => v.organizationId === "11111111-1111-1111-1111-111111111111")).toBe(true);
  });
});
