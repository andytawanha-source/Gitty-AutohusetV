import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Car, Tag } from "lucide-react";
import { useBrand } from "@/app/BrandProvider";
import { useInventory, getFilterOptions } from "@/features/vehicles/api";
import { applyFilters, filtersToSearchParams, type VehicleFilters } from "@/features/vehicles/filters";
import { normalizePlate, isValidPlate } from "@/lib/plate";
import { track } from "@/features/tracking/track";
import { cn } from "@/lib/utils";
import { getBrandMedia } from "@/config/brandMedia";

const selectCls =
  "w-full rounded-md border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white backdrop-blur placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-brand-accent [&>option]:text-brand-ink";

type Mode = "buy" | "sell";

export function HeroSection() {
  const brand = useBrand();
  const media = getBrandMedia(brand.key);
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("buy");

  // Køb
  const inventory = useInventory();
  const [filters, setFilters] = useState<VehicleFilters>({});
  const available = useMemo(
    () => (inventory.data ?? []).filter((v) => v.status === "published" || v.status === "reserved"),
    [inventory.data]
  );
  const options = getFilterOptions(available);
  const matchCount = useMemo(() => applyFilters(available, filters).length, [available, filters]);

  // Sælg
  const [plate, setPlate] = useState("");
  const [mileage, setMileage] = useState("");
  const [plateError, setPlateError] = useState<string | null>(null);

  const submitBuy = (e: React.FormEvent) => {
    e.preventDefault();
    track("search_inventory", { match_count: matchCount });
    navigate(`/biler?${filtersToSearchParams(filters)}`);
  };

  const submitSell = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizePlate(plate);
    if (!isValidPlate(normalized)) {
      setPlateError("Indtast en gyldig dansk nummerplade, fx AB 12 345");
      return;
    }
    setPlateError(null);
    track("start_sell_car", { source: "hero" });
    const params = new URLSearchParams({ plade: normalized });
    if (mileage) params.set("km", mileage);
    navigate(`/saelg-din-bil?${params}`);
  };

  const set = (patch: Partial<VehicleFilters>) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <section className="relative overflow-hidden bg-brand-gradient text-white" aria-label="Find eller sælg din bil">
      {/* Preload af hero-billedet, så LCP ikke venter på at CSS/JS opdager det */}
      <Helmet>
        <link rel="preload" as="image" href={media.heroDesktop} media="(min-width: 1024px)" />
        <link rel="preload" as="image" href={media.heroMobile} media="(max-width: 1023px)" />
      </Helmet>

      {/* Hero-baggrundsbillede med separat desktop-/mobilcrop og kongeblåt overlay for læsbarhed */}
      <picture aria-hidden className="absolute inset-0">
        <source media="(min-width: 1024px)" srcSet={media.heroDesktop} width={2400} height={1350} />
        <img
          src={media.heroMobile}
          alt=""
          width={1200}
          height={1600}
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover object-[80%_50%]"
        />
      </picture>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, rgb(var(--brand-primary) / 0.92) 0%, rgb(var(--brand-secondary) / 0.82) 45%, rgb(var(--brand-primary) / 0.5) 100%)",
        }}
      />

      <div className="container relative py-14 lg:py-24">
        <div className="max-w-2xl animate-fade-up">
          <h1 className="font-display text-4xl font-bold leading-tight lg:text-5xl">
            Din næste bil venter hos {brand.name}
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Kvalitetsbiler til fair priser – og et uforpligtende tilbud på din nuværende bil på under 2 minutter.
          </p>
        </div>

        <div className="mt-8 max-w-2xl rounded-2xl bg-brand-secondary/60 p-5 shadow-xl ring-1 ring-white/10 backdrop-blur lg:p-6">
          <div role="tablist" aria-label="Vælg køb eller salg" className="mb-5 grid grid-cols-2 gap-2 rounded-lg bg-black/20 p-1">
            {([
              { key: "buy", label: "Køb bil", icon: Car },
              { key: "sell", label: "Sælg bil", icon: Tag },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                role="tab"
                id={`hero-tab-${key}`}
                aria-selected={mode === key}
                aria-controls={`hero-panel-${key}`}
                onClick={() => setMode(key)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors",
                  mode === key ? "bg-white text-brand-primary" : "text-white/80 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </button>
            ))}
          </div>

          {mode === "buy" ? (
            <form id="hero-panel-buy" role="tabpanel" aria-labelledby="hero-tab-buy" onSubmit={submitBuy} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="sr-only">Mærke</span>
                  <select className={selectCls} value={filters.make ?? ""}
                    onChange={(e) => set({ make: e.target.value || undefined, model: undefined })}>
                    <option value="">Alle mærker</option>
                    {options.makes.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="sr-only">Model</span>
                  <select className={selectCls} value={filters.model ?? ""} disabled={!filters.make}
                    onChange={(e) => set({ model: e.target.value || undefined })}>
                    <option value="">{filters.make ? "Alle modeller" : "Model (vælg mærke)"}</option>
                    {filters.make && options.modelsByMake(filters.make).map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="sr-only">Drivmiddel</span>
                  <select className={selectCls} value={filters.fuel?.[0] ?? ""}
                    onChange={(e) => set({ fuel: e.target.value ? [e.target.value] : undefined })}>
                    <option value="">Alle drivmidler</option>
                    <option value="benzin">Benzin</option>
                    <option value="diesel">Diesel</option>
                    <option value="el">El</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="plugin_hybrid">Plugin-hybrid</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="sr-only">Biltype</span>
                  <select className={selectCls} value={filters.bodyType ?? ""}
                    onChange={(e) => set({ bodyType: e.target.value || undefined })}>
                    <option value="">Alle biltyper</option>
                    {options.bodyTypes.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="sr-only">Maksimal pris</span>
                  <select className={selectCls} value={filters.priceTo ?? ""}
                    onChange={(e) => set({ priceTo: e.target.value ? Number(e.target.value) : undefined })}>
                    <option value="">Ingen maksimal pris</option>
                    {[100000, 150000, 200000, 300000, 400000, 500000, 750000, 1000000].map((p) => (
                      <option key={p} value={p}>Op til {p.toLocaleString("da-DK")} kr.</option>
                    ))}
                  </select>
                </label>
              </div>
              <button type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-md bg-white ring-1 ring-brand-primary/20 shadow-sm px-5 py-3 font-bold text-brand-primary transition-transform hover:scale-[1.02] motion-reduce:transform-none">
                Se {inventory.data ? matchCount : ""} {matchCount === 1 ? "bil" : "biler"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </form>
          ) : (
            <form id="hero-panel-sell" role="tabpanel" aria-labelledby="hero-tab-sell" onSubmit={submitSell} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="hero-plate" className="mb-1 block text-sm font-medium text-white/90">Nummerplade</label>
                  <input
                    id="hero-plate"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    placeholder="AB 12 345"
                    autoComplete="off"
                    maxLength={9}
                    className="w-full rounded-md border-2 border-brand-accent/60 bg-white px-3 py-2.5 text-center font-display text-lg font-bold uppercase tracking-widest text-brand-ink placeholder:text-brand-ink/30"
                    aria-invalid={!!plateError}
                    aria-describedby={plateError ? "hero-plate-err" : undefined}
                  />
                  {plateError && <p id="hero-plate-err" className="mt-1 text-sm text-red-300">{plateError}</p>}
                </div>
                <div>
                  <label htmlFor="hero-km" className="mb-1 block text-sm font-medium text-white/90">Kilometerstand</label>
                  <input
                    id="hero-km"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="fx 85.000"
                    className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2.5 text-white backdrop-blur placeholder:text-white/50"
                  />
                </div>
              </div>
              <button type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-md bg-white ring-1 ring-brand-primary/20 shadow-sm px-5 py-3 font-bold text-brand-primary transition-transform hover:scale-[1.02] motion-reduce:transform-none">
                Få et uforpligtende tilbud
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
              <p className="text-center text-xs text-white/60">Gratis og uforpligtende · Svar {brand.leadResponseTime}</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
