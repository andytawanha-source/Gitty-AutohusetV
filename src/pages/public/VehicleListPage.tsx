import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { Seo } from "@/components/seo/Seo";
import { useVehicles, useInventory } from "@/features/vehicles/api";
import {
  countActiveFilters,
  filtersFromSearchParams,
  filtersToSearchParams,
  SORT_LABELS,
  type SortKey,
  type VehicleFilters,
} from "@/features/vehicles/filters";
import { VehicleFilterPanel } from "@/components/vehicles/VehicleFilterPanel";
import { FilterChips } from "@/components/vehicles/FilterChips";
import { VehicleGrid, VehicleGridSkeleton } from "@/components/vehicles/VehicleGrid";
import { track } from "@/features/tracking/track";

export default function VehicleListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);
  const sort = (searchParams.get("sortering") as SortKey) || "newest";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const { vehicles, isLoading, isError } = useVehicles(filters, sort);
  const inventory = useInventory();
  const activeCount = countActiveFilters(filters);

  const updateFilters = (next: VehicleFilters) => {
    const params = filtersToSearchParams(next);
    const currentSort = searchParams.get("sortering");
    if (currentSort) params.set("sortering", currentSort);
    setSearchParams(params, { replace: true });
    track("apply_vehicle_filter", { active_filters: countActiveFilters(next) });
  };

  const updateSort = (next: SortKey) => {
    const params = new URLSearchParams(searchParams);
    if (next === "newest") params.delete("sortering");
    else params.set("sortering", next);
    setSearchParams(params, { replace: true });
  };

  // Luk drawer med Escape + simpel fokushåndtering
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("select, input, button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const availableInventory = useMemo(
    () => (inventory.data ?? []).filter((v) => v.status === "published" || v.status === "reserved"),
    [inventory.data]
  );

  return (
    <div className="container py-8 lg:py-12">
      <Seo
        title="Biler til salg"
        description="Se alle vores biler til salg. Filtrér på mærke, pris, kilometer, drivmiddel og meget mere."
      />

      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-brand-primary lg:text-4xl">Biler til salg</h1>
        {!isLoading && vehicles && (
          <p className="mt-2 text-brand-ink/70" aria-live="polite">
            {vehicles.length} {vehicles.length === 1 ? "bil" : "biler"}
            {activeCount > 0 && ` · ${activeCount} aktive filtre`}
          </p>
        )}
      </header>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 rounded-md border border-brand-ink/15 bg-white px-4 py-2 text-sm font-medium lg:hidden"
          aria-expanded={drawerOpen}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filtre{activeCount > 0 && ` (${activeCount})`}
        </button>

        <label className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-brand-ink/70">Sortér efter</span>
          <select
            value={sort}
            onChange={(e) => updateSort(e.target.value as SortKey)}
            className="rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm"
          >
            {Object.entries(SORT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-5">
        <FilterChips filters={filters} onChange={updateFilters} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block" aria-label="Filtre">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
            <VehicleFilterPanel
              filters={filters}
              onChange={updateFilters}
              inventory={availableInventory}
              resultCount={vehicles?.length ?? 0}
            />
          </div>
        </aside>

        <section aria-label="Søgeresultater">
          {isLoading && <VehicleGridSkeleton />}
          {isError && (
            <p className="rounded-md bg-red-50 p-4 text-red-800">
              Bilerne kunne ikke hentes. Prøv at genindlæse siden.
            </p>
          )}
          {vehicles && vehicles.length === 0 && (
            <div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-brand-ink/5">
              <p className="font-display text-lg font-semibold">Ingen biler matcher din søgning</p>
              <p className="mt-1 text-brand-ink/70">Prøv at fjerne et eller flere filtre.</p>
              <button
                type="button"
                onClick={() => updateFilters({})}
                className="mt-4 rounded-md bg-brand-gradient px-5 py-2 font-medium text-white hover:opacity-90"
              >
                Nulstil filtre
              </button>
            </div>
          )}
          {vehicles && vehicles.length > 0 && <VehicleGrid vehicles={vehicles} />}
        </section>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filtre">
          <button
            type="button"
            aria-label="Luk filtre"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            ref={drawerRef}
            className="absolute inset-y-0 left-0 w-[85%] max-w-sm overflow-y-auto bg-brand-surface p-5 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Filtre</h2>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Luk" className="rounded-md p-2 hover:bg-brand-ink/5">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <VehicleFilterPanel
              filters={filters}
              onChange={updateFilters}
              inventory={availableInventory}
              resultCount={vehicles?.length ?? 0}
            />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="mt-5 w-full rounded-md bg-brand-gradient px-4 py-3 font-semibold text-white"
            >
              Vis {vehicles?.length ?? 0} biler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
