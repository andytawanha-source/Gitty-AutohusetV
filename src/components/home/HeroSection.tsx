import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Car, Tag, Check, Phone } from "lucide-react";
import { useBrand } from "@/app/BrandProvider";
import { useInventory, getFilterOptions } from "@/features/vehicles/api";
import { applyFilters, filtersToSearchParams, type VehicleFilters } from "@/features/vehicles/filters";
import { normalizePlate, isValidPlate } from "@/lib/plate";
import { track } from "@/features/tracking/track";
import { cn } from "@/lib/utils";
import { getBrandMedia } from "@/config/brandMedia";
import { SERVICE_TYPES, TIME_SLOTS, MAX_BOOKING_DAYS_AHEAD } from "@/features/workshop/schema";

const selectCls =
  "w-full rounded-md border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white backdrop-blur placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-brand-accent [&>option]:text-brand-ink";

const primaryCtaCls =
  "flex w-full items-center justify-center gap-2 rounded-md bg-white ring-1 ring-brand-primary/20 shadow-sm px-5 py-3.5 font-bold text-brand-primary transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-brand-accent motion-reduce:transform-none";

type Mode = "buy" | "sell";

export function HeroSection() {
  const brand = useBrand();
  const media = getBrandMedia(brand.key);

  if (brand.key === "autohuset-v" && media.heroSplit) {
    return <SplitHero media={media} />;
  }
  return <ClassicHero />;
}

/* -------------------------------------------------------------------------- */
/* Klassisk, énstrenget hero (Autohuset Vest) – uændret fra tidligere version */
/* -------------------------------------------------------------------------- */

function ClassicHero() {
  const brand = useBrand();
  const media = getBrandMedia(brand.key);
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("buy");

  const inventory = useInventory();
  const [filters, setFilters] = useState<VehicleFilters>({});
  const available = useMemo(
    () => (inventory.data ?? []).filter((v) => v.status === "published" || v.status === "reserved"),
    [inventory.data]
  );
  const options = getFilterOptions(available);
  const matchCount = useMemo(() => applyFilters(available, filters).length, [available, filters]);

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
              <button type="submit" className={primaryCtaCls}>
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
              <button type="submit" className={primaryCtaCls}>
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

/* -------------------------------------------------------------------------- */
/* 50/50-delt hero (kun Autohuset V) – "Køb eller sælg bil" / "Værksted og service" */
/* -------------------------------------------------------------------------- */

function todayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function maxIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + MAX_BOOKING_DAYS_AHEAD);
  return d.toISOString().slice(0, 10);
}

function SplitHero({ media }: { media: ReturnType<typeof getBrandMedia> }) {
  const brand = useBrand();
  const heroSplit = media.heroSplit!;
  const navigate = useNavigate();

  return (
    <section className="relative isolate bg-brand-primary text-white" aria-label="Køb eller sælg bil, eller book værksted">
      <Helmet>
        <link rel="preload" as="image" href={heroSplit.buy.src} />
        <link rel="preload" as="image" href={heroSplit.workshop.src} />
      </Helmet>

      {/* Én primær H1 for hele heroen – de to synlige overskrifter herunder er H2 */}
      <h1 className="sr-only">Find din næste bil eller book tid på værksted</h1>

      <div className="grid lg:grid-cols-2">
        <HeroHalf image={heroSplit.buy}>
          <BuyOrSellPanel />
        </HeroHalf>
        <HeroHalf image={heroSplit.workshop}>
          <WorkshopPanel phone={brand.contact.phone} onSubmit={(params) => navigate(`/vaerksted?${params}#book-nu`)} />
        </HeroHalf>
      </div>
    </section>
  );
}

function HeroHalf({ image, children }: { image: { src: string; alt: string }; children: ReactNode }) {
  return (
    <div className="relative flex min-h-[560px] items-center overflow-hidden sm:min-h-[620px] lg:min-h-[760px]">
      <img
        src={image.src}
        alt={image.alt}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-[68%_50%]"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/25" />
      <div className="relative z-10 w-full px-6 py-14 sm:px-10 lg:px-12 lg:py-16">
        <div className="mx-auto w-full max-w-md lg:mx-0">{children}</div>
      </div>
    </div>
  );
}

/** Tomt, ikke-interaktivt "faneblad" der giver Værksted-panelet samme lodrette rytme som køb/sælg-panelets tabs. */
function GhostTabBar({ label }: { label: string }) {
  return (
    <div className="mb-5 rounded-lg bg-black/20 p-1">
      <div className="flex items-center justify-center rounded-md bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/80">
        {label}
      </div>
    </div>
  );
}

function UspList({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-1.5 text-sm text-white/80">
          <Check className="h-4 w-4 shrink-0 text-brand-accent" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

function BuyOrSellPanel() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("buy");

  const inventory = useInventory();
  const [filters, setFilters] = useState<VehicleFilters>({});
  const available = useMemo(
    () => (inventory.data ?? []).filter((v) => v.status === "published" || v.status === "reserved"),
    [inventory.data]
  );
  const options = getFilterOptions(available);
  const matchCount = useMemo(() => applyFilters(available, filters).length, [available, filters]);
  const years = useMemo(
    () => [...new Set(available.map((v) => v.modelYear).filter((y): y is number => Boolean(y)))].sort((a, b) => b - a),
    [available]
  );

  const [plate, setPlate] = useState("");
  const [mileage, setMileage] = useState("");
  const [plateError, setPlateError] = useState<string | null>(null);

  const set = (patch: Partial<VehicleFilters>) => setFilters((f) => ({ ...f, ...patch }));

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

  return (
    <div className="animate-fade-up">
      <h2 className="font-display text-3xl font-bold leading-tight lg:text-4xl">Find din næste bil</h2>
      <p className="mt-3 text-white/80">
        Se vores udvalg af klargjorte kvalitetsbiler – eller få et uforpligtende tilbud på din nuværende bil.
      </p>

      <div className="mt-6 flex flex-col rounded-2xl bg-white/10 p-5 shadow-xl ring-1 ring-white/15 backdrop-blur lg:min-h-[440px] lg:p-6">
        <div role="tablist" aria-label="Vælg køb eller salg" className="mb-5 grid grid-cols-2 gap-2 rounded-lg bg-black/20 p-1">
          {([
            { key: "buy", label: "Søg blandt biler", icon: Car },
            { key: "sell", label: "Sælg din bil", icon: Tag },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              id={`hero-split-tab-${key}`}
              aria-selected={mode === key}
              aria-controls={`hero-split-panel-${key}`}
              onClick={() => setMode(key)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors",
                mode === key ? "bg-white text-brand-primary" : "text-white/80 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>

        {mode === "buy" ? (
          <form
            id="hero-split-panel-buy"
            role="tabpanel"
            aria-labelledby="hero-split-tab-buy"
            onSubmit={submitBuy}
            className="flex flex-1 flex-col justify-between gap-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="sr-only">Mærke</span>
                <select className={selectCls} value={filters.make ?? ""}
                  onChange={(e) => set({ make: e.target.value || undefined, model: undefined })}>
                  <option value="">Mærke</option>
                  {options.makes.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="sr-only">Model</span>
                <select className={selectCls} value={filters.model ?? ""} disabled={!filters.make}
                  onChange={(e) => set({ model: e.target.value || undefined })}>
                  <option value="">{filters.make ? "Model" : "Model (vælg mærke)"}</option>
                  {filters.make && options.modelsByMake(filters.make).map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="sr-only">Maksimal pris</span>
                <select className={selectCls} value={filters.priceTo ?? ""}
                  onChange={(e) => set({ priceTo: e.target.value ? Number(e.target.value) : undefined })}>
                  <option value="">Maksimal pris</option>
                  {[100000, 150000, 200000, 300000, 400000, 500000, 750000, 1000000].map((p) => (
                    <option key={p} value={p}>Op til {p.toLocaleString("da-DK")} kr.</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="sr-only">Årgang fra</span>
                <select className={selectCls} value={filters.yearFrom ?? ""}
                  onChange={(e) => set({ yearFrom: e.target.value ? Number(e.target.value) : undefined })}>
                  <option value="">Årgang fra</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="sr-only">Brændstof</span>
                <select className={selectCls} value={filters.fuel?.[0] ?? ""}
                  onChange={(e) => set({ fuel: e.target.value ? [e.target.value] : undefined })}>
                  <option value="">Brændstof</option>
                  <option value="benzin">Benzin</option>
                  <option value="diesel">Diesel</option>
                  <option value="el">El</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="plugin_hybrid">Plugin-hybrid</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="sr-only">Gearkasse</span>
                <select className={selectCls} value={filters.transmission ?? ""}
                  onChange={(e) => set({ transmission: e.target.value || undefined })}>
                  <option value="">Gearkasse</option>
                  <option value="manuel">Manuel</option>
                  <option value="automatisk">Automatisk</option>
                </select>
              </label>
            </div>
            <button type="submit" className={primaryCtaCls}>
              Se {inventory.data ? matchCount : ""} {matchCount === 1 ? "bil" : "biler"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </form>
        ) : (
          <form
            id="hero-split-panel-sell"
            role="tabpanel"
            aria-labelledby="hero-split-tab-sell"
            onSubmit={submitSell}
            className="flex flex-1 flex-col justify-between gap-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="hero-split-plate" className="mb-1 block text-sm font-medium text-white/90">Nummerplade</label>
                <input
                  id="hero-split-plate"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="AB 12 345"
                  autoComplete="off"
                  maxLength={9}
                  className="w-full rounded-md border-2 border-brand-accent/60 bg-white px-3 py-2.5 text-center font-display text-lg font-bold uppercase tracking-widest text-brand-ink placeholder:text-brand-ink/30"
                  aria-invalid={!!plateError}
                  aria-describedby={plateError ? "hero-split-plate-err" : undefined}
                />
                {plateError && <p id="hero-split-plate-err" className="mt-1 text-sm text-red-300">{plateError}</p>}
              </div>
              <div>
                <label htmlFor="hero-split-km" className="mb-1 block text-sm font-medium text-white/90">Kilometerstand</label>
                <input
                  id="hero-split-km"
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
            <div>
              <button type="submit" className={primaryCtaCls}>
                Få et uforpligtende tilbud
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
              <p className="mt-2 text-center text-xs text-white/60">Gratis og uforpligtende</p>
            </div>
          </form>
        )}
      </div>

      <UspList items={["Klargjorte kvalitetsbiler", "Mulighed for byttebil", "Garanti gennem AutoConcept"]} />
    </div>
  );
}

function WorkshopPanel({ phone, onSubmit }: { phone: string; onSubmit: (params: URLSearchParams) => void }) {
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    track("start_workshop_booking", { source: "hero", service: service || "" });
    const params = new URLSearchParams();
    if (service) params.set("ydelse", service);
    if (date) params.set("dato", date);
    if (time) params.set("tid", time);
    onSubmit(params);
  };

  return (
    <div className="animate-fade-up">
      <h2 className="font-display text-3xl font-bold leading-tight lg:text-4xl">Book værksted &amp; service</h2>
      <p className="mt-3 text-white/80">
        Professionel service og reparation af din bil med fokus på kvalitet, tryghed og gennemsigtige priser.
      </p>

      <div className="mt-6 flex flex-col rounded-2xl bg-white/10 p-5 shadow-xl ring-1 ring-white/15 backdrop-blur lg:min-h-[440px] lg:p-6">
        <GhostTabBar label="Book en tid" />

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col justify-between gap-4">
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="sr-only">Vælg service eller ydelse</span>
              <select
                className={selectCls}
                value={service}
                onChange={(e) => setService(e.target.value)}
              >
                <option value="">Vælg service eller ydelse</option>
                {SERVICE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="sr-only">Vælg dato</span>
                <input
                  type="date"
                  min={todayIso()}
                  max={maxIso()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={selectCls}
                />
              </label>
              <label className="block text-sm">
                <span className="sr-only">Vælg tidspunkt</span>
                <select
                  className={selectCls}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                >
                  <option value="">Vælg tidspunkt</option>
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div>
            <button type="submit" className={primaryCtaCls}>
              Se ledige tider
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-white/60">
              <Phone className="h-3.5 w-3.5" aria-hidden />
              Har du akut brug for hjælp? Ring på {phone}
            </p>
          </div>
        </form>
      </div>

      <UspList items={["Erfarne mekanikere", "Moderne værkstedsudstyr", "Fair og gennemsigtige priser"]} />
    </div>
  );
}
