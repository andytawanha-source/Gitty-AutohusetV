import { X } from "lucide-react";
import type { VehicleFilters } from "@/features/vehicles/filters";
import { FUEL_LABELS, type FuelType } from "@/features/vehicles/types";
import { formatNumber } from "@/lib/format";

interface Chip {
  key: string;
  label: string;
  remove: (f: VehicleFilters) => VehicleFilters;
}

function buildChips(f: VehicleFilters): Chip[] {
  const chips: Chip[] = [];
  if (f.make) chips.push({ key: "make", label: f.make, remove: (x) => ({ ...x, make: undefined, model: undefined }) });
  if (f.model) chips.push({ key: "model", label: f.model, remove: (x) => ({ ...x, model: undefined }) });
  if (f.priceFrom !== undefined || f.priceTo !== undefined)
    chips.push({
      key: "price",
      label: `Pris: ${f.priceFrom !== undefined ? formatNumber(f.priceFrom) : "0"}–${f.priceTo !== undefined ? formatNumber(f.priceTo) : "∞"} kr.`,
      remove: (x) => ({ ...x, priceFrom: undefined, priceTo: undefined }),
    });
  if (f.mileageFrom !== undefined || f.mileageTo !== undefined)
    chips.push({
      key: "mileage",
      label: `Km: ${f.mileageFrom !== undefined ? formatNumber(f.mileageFrom) : "0"}–${f.mileageTo !== undefined ? formatNumber(f.mileageTo) : "∞"}`,
      remove: (x) => ({ ...x, mileageFrom: undefined, mileageTo: undefined }),
    });
  if (f.yearFrom !== undefined || f.yearTo !== undefined)
    chips.push({
      key: "year",
      label: `Årgang: ${f.yearFrom ?? ""}–${f.yearTo ?? ""}`,
      remove: (x) => ({ ...x, yearFrom: undefined, yearTo: undefined }),
    });
  for (const fuel of f.fuel ?? [])
    chips.push({
      key: `fuel-${fuel}`,
      label: FUEL_LABELS[fuel as FuelType] ?? fuel,
      remove: (x) => ({ ...x, fuel: (x.fuel ?? []).filter((v) => v !== fuel) }),
    });
  if (f.transmission)
    chips.push({ key: "transmission", label: f.transmission === "manuel" ? "Manuel" : "Automatisk", remove: (x) => ({ ...x, transmission: undefined }) });
  if (f.bodyType) chips.push({ key: "bodyType", label: f.bodyType, remove: (x) => ({ ...x, bodyType: undefined }) });
  if (f.color) chips.push({ key: "color", label: f.color, remove: (x) => ({ ...x, color: undefined }) });
  if (f.doors !== undefined) chips.push({ key: "doors", label: `${f.doors} døre`, remove: (x) => ({ ...x, doors: undefined }) });
  if (f.onlyElectric) chips.push({ key: "el", label: "Kun elbiler", remove: (x) => ({ ...x, onlyElectric: undefined }) });
  if (f.onlyHybrid) chips.push({ key: "hybrid", label: "Kun hybrid", remove: (x) => ({ ...x, onlyHybrid: undefined }) });
  return chips;
}

export function FilterChips({ filters, onChange }: { filters: VehicleFilters; onChange: (f: VehicleFilters) => void }) {
  const chips = buildChips(filters);
  if (!chips.length) return null;

  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Aktive filtre">
      {chips.map((chip) => (
        <li key={chip.key}>
          <button
            type="button"
            onClick={() => onChange(chip.remove(filters))}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1.5 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary/20"
            aria-label={`Fjern filter: ${chip.label}`}
          >
            {chip.label}
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </li>
      ))}
      <li>
        <button type="button" onClick={() => onChange({})} className="text-sm font-medium text-brand-primary underline hover:no-underline">
          Nulstil alle
        </button>
      </li>
    </ul>
  );
}
