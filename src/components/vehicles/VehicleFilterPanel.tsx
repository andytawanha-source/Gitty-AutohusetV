import { useId } from "react";
import type { VehicleFilters } from "@/features/vehicles/filters";
import { FUEL_LABELS, type FuelType, type Vehicle } from "@/features/vehicles/types";
import { getFilterOptions } from "@/features/vehicles/api";

interface Props {
  filters: VehicleFilters;
  onChange: (next: VehicleFilters) => void;
  inventory: Vehicle[];
  resultCount: number;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-brand-ink">{label}</span>
      {children}
    </label>
  );
}

const selectCls =
  "w-full rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm text-brand-ink focus-visible:ring-2 focus-visible:ring-brand-accent";
const inputCls = selectCls;

function RangeInputs({
  label, fromValue, toValue, onFrom, onTo, step, unit,
}: {
  label: string;
  fromValue?: number;
  toValue?: number;
  onFrom: (v?: number) => void;
  onTo: (v?: number) => void;
  step?: number;
  unit?: string;
}) {
  const id = useId();
  const parse = (raw: string) => (raw === "" ? undefined : Number(raw));
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium text-brand-ink">
        {label} {unit && <span className="text-brand-ink/50">({unit})</span>}
      </legend>
      <div className="flex items-center gap-2">
        <label htmlFor={`${id}-fra`} className="sr-only">{label} fra</label>
        <input id={`${id}-fra`} type="number" inputMode="numeric" min={0} step={step} placeholder="Fra"
          className={inputCls} value={fromValue ?? ""} onChange={(e) => onFrom(parse(e.target.value))} />
        <span aria-hidden className="text-brand-ink/40">–</span>
        <label htmlFor={`${id}-til`} className="sr-only">{label} til</label>
        <input id={`${id}-til`} type="number" inputMode="numeric" min={0} step={step} placeholder="Til"
          className={inputCls} value={toValue ?? ""} onChange={(e) => onTo(parse(e.target.value))} />
      </div>
    </fieldset>
  );
}

export function VehicleFilterPanel({ filters, onChange, inventory, resultCount }: Props) {
  const options = getFilterOptions(inventory);
  const set = (patch: Partial<VehicleFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="space-y-5">
      <p className="text-sm font-semibold text-brand-primary" aria-live="polite">
        {resultCount} {resultCount === 1 ? "bil" : "biler"} matcher
      </p>

      <Field label="Mærke">
        <select className={selectCls} value={filters.make ?? ""}
          onChange={(e) => set({ make: e.target.value || undefined, model: undefined })}>
          <option value="">Alle mærker</option>
          {options.makes.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </Field>

      <Field label="Model">
        <select className={selectCls} value={filters.model ?? ""} disabled={!filters.make}
          onChange={(e) => set({ model: e.target.value || undefined })}>
          <option value="">{filters.make ? "Alle modeller" : "Vælg mærke først"}</option>
          {filters.make && options.modelsByMake(filters.make).map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </Field>

      <RangeInputs label="Pris" unit="kr." step={10000}
        fromValue={filters.priceFrom} toValue={filters.priceTo}
        onFrom={(v) => set({ priceFrom: v })} onTo={(v) => set({ priceTo: v })} />

      <RangeInputs label="Kilometer" unit="km" step={10000}
        fromValue={filters.mileageFrom} toValue={filters.mileageTo}
        onFrom={(v) => set({ mileageFrom: v })} onTo={(v) => set({ mileageTo: v })} />

      <RangeInputs label="Modelår" step={1}
        fromValue={filters.yearFrom} toValue={filters.yearTo}
        onFrom={(v) => set({ yearFrom: v })} onTo={(v) => set({ yearTo: v })} />

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-brand-ink">Drivmiddel</legend>
        <div className="space-y-1.5">
          {(Object.keys(FUEL_LABELS) as FuelType[]).filter((f) => f !== "andet").map((fuel) => (
            <label key={fuel} className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 rounded border-brand-ink/30 text-brand-primary"
                checked={filters.fuel?.includes(fuel) ?? false}
                onChange={(e) => {
                  const current = filters.fuel ?? [];
                  set({ fuel: e.target.checked ? [...current, fuel] : current.filter((x) => x !== fuel) });
                }} />
              {FUEL_LABELS[fuel]}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Gearkasse">
        <select className={selectCls} value={filters.transmission ?? ""}
          onChange={(e) => set({ transmission: e.target.value || undefined })}>
          <option value="">Alle</option>
          <option value="manuel">Manuel</option>
          <option value="automatisk">Automatisk</option>
        </select>
      </Field>

      <Field label="Biltype">
        <select className={selectCls} value={filters.bodyType ?? ""}
          onChange={(e) => set({ bodyType: e.target.value || undefined })}>
          <option value="">Alle biltyper</option>
          {options.bodyTypes.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </Field>

      <Field label="Farve">
        <select className={selectCls} value={filters.color ?? ""}
          onChange={(e) => set({ color: e.target.value || undefined })}>
          <option value="">Alle farver</option>
          {options.colors.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>

      <Field label="Antal døre">
        <select className={selectCls} value={filters.doors ?? ""}
          onChange={(e) => set({ doors: e.target.value ? Number(e.target.value) : undefined })}>
          <option value="">Alle</option>
          {[2, 3, 4, 5].map((d) => <option key={d} value={d}>{d} døre</option>)}
        </select>
      </Field>

      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 rounded border-brand-ink/30 text-brand-primary"
            checked={filters.onlyElectric ?? false}
            onChange={(e) => set({ onlyElectric: e.target.checked || undefined })} />
          Kun elbiler
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 rounded border-brand-ink/30 text-brand-primary"
            checked={filters.onlyHybrid ?? false}
            onChange={(e) => set({ onlyHybrid: e.target.checked || undefined })} />
          Kun hybridbiler
        </label>
      </div>

      <button type="button" onClick={() => onChange({})}
        className="w-full rounded-md border border-brand-primary px-4 py-2 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-gradient hover:text-white">
        Nulstil filtre
      </button>
    </div>
  );
}
