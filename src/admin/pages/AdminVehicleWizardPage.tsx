import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Eye,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
import { useAdminVehicles, useSaveVehicle, useVehicleStatusMutation, type VehicleFormValues } from "../api";
import type { AdminVehicle } from "../types";
import { VehicleImageManager } from "../components/VehicleImageManager";
import { EquipmentPicker } from "../components/EquipmentPicker";
import { checkVehicleQuality, findDuplicateVehicle } from "../vehicleQuality";
import { lookupPlate } from "@/features/plate-lookup/client";
import type { NormalizedVehicleLookupResult } from "@/features/plate-lookup/types";
import { normalizePlate, isValidPlate } from "@/lib/plate";
import { generateDescriptionDraft } from "@/features/vehicles/descriptionGenerator";
import { cn } from "@/lib/utils";

const inputCls = "w-full rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm";

function emptyForm(listingType: "sale" | "rental"): VehicleFormValues {
  return {
    listingType,
    make: "", model: "", variant: "", modelYear: "", firstRegistration: "", mileageKm: "",
    priceDkk: "", monthlyPriceDkk: "", fuelType: "", transmission: "", bodyType: "", color: "",
    doors: "", seats: "", powerHp: "", engine: "", batteryKwh: "", rangeKm: "", consumption: "",
    taxPeriodDkk: "", registrationNumber: "", showRegistrationNumber: false, vin: "",
    description: "", internalNotes: "", equipment: "", badges: [], isFeatured: false,
    seoTitle: "", seoDescription: "", slug: "", status: "draft", publishAt: "",
    downPaymentDkk: "", deliveryCostDkk: "", warrantyText: "", serviceHistoryText: "", lastServiceDate: "", ownerCount: "",
    pricePerDayDkk: "", pricePerWeekDkk: "", pricePerMonthDkk: "", depositDkk: "", includedKmPerDay: "",
    extraKmPriceDkk: "", minAge: "", licenseRequirement: "", availabilityStatus: "available",
    pickupLocation: "", insuranceInfo: "", extraFeesText: "",
  };
}

function toForm(v: AdminVehicle): VehicleFormValues {
  const s = (x: unknown) => (x === null || x === undefined ? "" : String(x));
  return {
    id: v.id,
    listingType: v.listingType,
    make: v.make, model: v.model, variant: s(v.variant), modelYear: s(v.modelYear),
    firstRegistration: s(v.firstRegistration), mileageKm: s(v.mileageKm), priceDkk: s(v.priceDkk),
    monthlyPriceDkk: s(v.monthlyPriceDkk), fuelType: s(v.fuelType), transmission: s(v.transmission),
    bodyType: s(v.bodyType), color: s(v.color), doors: s(v.doors), seats: s(v.seats),
    powerHp: s(v.powerHp), engine: s(v.engine), batteryKwh: s(v.batteryKwh), rangeKm: s(v.rangeKm),
    consumption: s(v.consumption), taxPeriodDkk: s(v.taxPeriodDkk),
    registrationNumber: s(v.registrationNumber), showRegistrationNumber: v.showRegistrationNumber,
    vin: s(v.vin), description: s(v.description), internalNotes: s(v.internalNotes),
    equipment: v.equipment.join("\n"), badges: v.badges, isFeatured: v.isFeatured,
    seoTitle: s(v.seoTitle), seoDescription: s(v.seoDescription), slug: v.slug,
    status: v.status, publishAt: v.publishAt ? v.publishAt.slice(0, 16) : "",
    downPaymentDkk: s(v.saleDetails?.downPaymentDkk), deliveryCostDkk: s(v.saleDetails?.deliveryCostDkk),
    warrantyText: s(v.saleDetails?.warrantyText), serviceHistoryText: s(v.saleDetails?.serviceHistoryText),
    lastServiceDate: s(v.saleDetails?.lastServiceDate), ownerCount: s(v.saleDetails?.ownerCount),
    pricePerDayDkk: s(v.rentalDetails?.pricePerDayDkk), pricePerWeekDkk: s(v.rentalDetails?.pricePerWeekDkk),
    pricePerMonthDkk: s(v.rentalDetails?.pricePerMonthDkk), depositDkk: s(v.rentalDetails?.depositDkk),
    includedKmPerDay: s(v.rentalDetails?.includedKmPerDay), extraKmPriceDkk: s(v.rentalDetails?.extraKmPriceDkk),
    minAge: s(v.rentalDetails?.minAge), licenseRequirement: s(v.rentalDetails?.licenseRequirement),
    availabilityStatus: v.rentalDetails?.availabilityStatus ?? "available",
    pickupLocation: s(v.rentalDetails?.pickupLocation), insuranceInfo: s(v.rentalDetails?.insuranceInfo),
    extraFeesText: s(v.rentalDetails?.extraFeesText),
  };
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-brand-ink/50">{hint}</span>}
    </label>
  );
}

const SALE_STEPS = ["Nummerplade", "Billeder", "Pris og praktisk", "Ekstraudstyr", "Beskrivelse", "Forhåndsvisning"];
const RENTAL_STEPS = ["Nummerplade", "Billeder", "Udlejningsvilkår", "Ekstraudstyr", "Beskrivelse", "Forhåndsvisning"];

export function AdminVehicleWizardPage({ listingType: fixedListingType }: { listingType: "sale" | "rental" }) {
  const { id } = useParams();
  const isNew = !id || id === "ny";
  const navigate = useNavigate();
  const { data: vehicles, refetch: refetchVehicles } = useAdminVehicles();
  const saveMutation = useSaveVehicle();
  const statusMutation = useVehicleStatusMutation();

  const existing = isNew ? undefined : vehicles?.find((v) => v.id === id);
  const listingType = existing?.listingType ?? fixedListingType;
  const listPath = listingType === "rental" ? "/admin/lejebiler" : "/admin/biler";
  const steps = listingType === "rental" ? RENTAL_STEPS : SALE_STEPS;

  const [form, setForm] = useState<VehicleFormValues>(() => emptyForm(fixedListingType));
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(existing?.id ?? null);
  const [step, setStep] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [plateInput, setPlateInput] = useState("");
  const [plateBusy, setPlateBusy] = useState(false);
  const [plateMessage, setPlateMessage] = useState<string | null>(null);
  const [dismissedDuplicate, setDismissedDuplicate] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (existing && loadedId !== existing.id) {
      setForm(toForm(existing));
      setVehicleId(existing.id);
      setLoadedId(existing.id);
    }
  }, [existing, loadedId]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  // Advar ved forsøg på at forlade siden med ugemte ændringer
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const set = <K extends keyof VehicleFormValues>(key: K, value: VehicleFormValues[K]) => {
    dirtyRef.current = true;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const duplicate = useMemo(
    () =>
      !dismissedDuplicate
        ? findDuplicateVehicle(vehicles ?? [], { id: vehicleId ?? undefined, registrationNumber: form.registrationNumber, vin: form.vin })
        : null,
    [vehicles, vehicleId, form.registrationNumber, form.vin, dismissedDuplicate]
  );

  const quality = existing
    ? checkVehicleQuality(existing)
    : checkVehicleQuality({ images: [], description: form.description, priceDkk: form.priceDkk ? Number(form.priceDkk) : null, equipment: form.equipment.split("\n").filter(Boolean), listingType });

  /** Autosave: gemmer kladden i baggrunden, når felter ændres, så arbejde aldrig går tabt. */
  const persist = async (overrides?: Partial<VehicleFormValues>) => {
    setSaveStatus("saving");
    setSaveError(null);
    try {
      const payload = { ...form, ...overrides, id: vehicleId ?? undefined };
      const savedId = await saveMutation.mutateAsync(payload);
      setVehicleId(savedId);
      dirtyRef.current = false;
      setSaveStatus("saved");
      return savedId;
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err instanceof Error ? err.message : "Kunne ikke gemme.");
      return null;
    }
  };

  const runPlateLookup = async () => {
    const plate = normalizePlate(plateInput);
    if (!isValidPlate(plate)) {
      setPlateMessage("Indtast en gyldig dansk nummerplade, fx AB 12 345.");
      return;
    }
    setPlateBusy(true);
    setPlateMessage(null);
    try {
      const outcome = await lookupPlate(plate);
      if (outcome.status === "success") {
        applyLookupResult(outcome.result, plate);
        setPlateMessage(outcome.result.isMock ? "Data hentet (mock/testdata i demo-mode)." : "Data hentet fra nummerpladeopslag.");
      } else if (outcome.status === "not_found") {
        set("registrationNumber", plate);
        setPlateMessage("Bilen blev ikke fundet – udfyld oplysningerne manuelt.");
      } else if (outcome.status === "rate_limited") {
        setPlateMessage("For mange opslag – vent et øjeblik og prøv igen.");
      } else {
        setPlateMessage("Opslaget kunne ikke gennemføres. Udfyld manuelt, eller prøv igen.");
      }
    } finally {
      setPlateBusy(false);
    }
  };

  const applyLookupResult = (r: NormalizedVehicleLookupResult, plate: string) => {
    dirtyRef.current = true;
    setForm((f) => ({
      ...f,
      registrationNumber: plate,
      make: r.make ?? f.make,
      model: r.model ?? f.model,
      variant: r.variant ?? f.variant,
      modelYear: r.modelYear ? String(r.modelYear) : f.modelYear,
      firstRegistration: r.firstRegistrationDate ?? f.firstRegistration,
      fuelType: r.fuelType ?? f.fuelType,
      transmission: r.transmission ?? f.transmission,
      bodyType: r.bodyType ?? f.bodyType,
      color: r.color ?? f.color,
      powerHp: r.powerHp ? String(r.powerHp) : f.powerHp,
      batteryKwh: r.batteryCapacityKwh ? String(r.batteryCapacityKwh) : f.batteryKwh,
      rangeKm: r.electricRangeKm ? String(r.electricRangeKm) : f.rangeKm,
    }));
  };

  const goNext = async () => {
    if (step === 0) {
      // Opret kladden nu, så billedupload i næste trin aldrig er blokeret
      const savedId = await persist({ status: "draft" });
      if (!savedId) return;
    } else {
      await persist();
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const publishAction = async (status: VehicleFormValues["status"]) => {
    const savedId = await persist({ status });
    if (savedId) navigate(listPath);
  };

  const duplicateAsNew = async () => {
    await saveMutation.mutateAsync({ ...form, id: undefined, slug: "", status: "draft", registrationNumber: "", vin: "" });
    navigate(listPath);
  };

  const generateDescription = () => {
    const draft = generateDescriptionDraft({
      make: form.make, model: form.model, variant: form.variant || null,
      modelYear: form.modelYear ? Number(form.modelYear) : null,
      mileageKm: form.mileageKm ? Number(form.mileageKm) : null,
      fuelType: (form.fuelType || null) as never, transmission: (form.transmission || null) as never,
      bodyType: form.bodyType || null, color: form.color || null,
      equipment: form.equipment.split("\n").map((s) => s.trim()).filter(Boolean),
      listingType,
    });
    set("description", draft);
  };

  const title = existing ? `${form.make} ${form.model}` : listingType === "rental" ? "Opret lejebil" : "Opret bil til salg";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to={listPath} className="rounded-md p-2 hover:bg-brand-ink/5" aria-label="Tilbage til oversigt">
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <h1 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-bold text-brand-primary outline-none">
            {title}
          </h1>
        </div>
        <SaveStatus status={saveStatus} error={saveError} />
      </div>

      {/* Fremdriftsbjælke */}
      <ol className="flex flex-wrap gap-2" aria-label="Trin i oprettelsen">
        {steps.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => i <= step && setStep(i)}
              disabled={i > step}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                i === step ? "bg-brand-gradient text-white" : i < step ? "bg-brand-primary/10 text-brand-primary" : "bg-brand-ink/5 text-brand-ink/40"
              )}
            >
              {i < step && <Check className="h-3.5 w-3.5" aria-hidden />}
              {i + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      {duplicate && (
        <div className="flex items-start gap-3 rounded-md bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Mulig dublet</p>
            <p>
              Der findes allerede en aktiv annonce med samme registreringsnummer/stelnummer:{" "}
              <Link to={`${listPath}/${duplicate.id}`} className="underline">{duplicate.make} {duplicate.model}</Link>.
            </p>
            <button type="button" onClick={() => setDismissedDuplicate(true)} className="mt-1 text-xs underline">
              Ignorér og fortsæt alligevel
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
        {step === 0 && (
          <StepPlate
            plateInput={plateInput}
            setPlateInput={setPlateInput}
            onLookup={runPlateLookup}
            busy={plateBusy}
            message={plateMessage}
            form={form}
            set={set}
          />
        )}
        {step === 1 && (
          <div>
            <h2 className="mb-4 font-display text-lg font-bold text-brand-primary">Billeder</h2>
            {vehicleId ? (
              <VehicleImageManager
                vehicleId={vehicleId}
                images={existing?.images ?? []}
                altBase={`${form.make} ${form.model}`}
                onChanged={() => void refetchVehicles()}
              />
            ) : (
              <p className="text-sm text-brand-ink/50">Gennemfør trin 1 for at oprette kladden, så billeder kan tilføjes.</p>
            )}
          </div>
        )}
        {step === 2 && (listingType === "sale" ? (
          <StepSaleDetails form={form} set={set} />
        ) : (
          <StepRentalDetails form={form} set={set} />
        ))}
        {step === 3 && (
          <div>
            <h2 className="mb-4 font-display text-lg font-bold text-brand-primary">Ekstraudstyr</h2>
            <EquipmentPicker
              value={form.equipment.split("\n").map((s) => s.trim()).filter(Boolean)}
              onChange={(next) => set("equipment", next.join("\n"))}
            />
          </div>
        )}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-brand-primary">Beskrivelse</h2>
              <button type="button" onClick={generateDescription}
                className="inline-flex items-center gap-1.5 rounded-md border border-brand-primary/30 bg-brand-primary/5 px-3 py-1.5 text-sm font-medium text-brand-primary hover:bg-brand-primary/10">
                <Sparkles className="h-4 w-4" aria-hidden /> Generér forslag
              </button>
            </div>
            <p className="text-xs text-brand-ink/50">
              Forslaget er skabelonbaseret ud fra bilens data og valgte udstyr – gennemse og redigér altid teksten, før annoncen publiceres.
            </p>
            <Field label="Annoncetekst"><textarea rows={7} className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
            <Field label="Interne noter (vises aldrig offentligt)"><textarea rows={2} className={inputCls} value={form.internalNotes} onChange={(e) => set("internalNotes", e.target.value)} /></Field>
            <fieldset>
              <legend className="mb-1 text-sm font-medium">Badges</legend>
              <div className="flex flex-wrap gap-4">
                {["Nyhed", "Populær", "Elbil"].map((b) => (
                  <label key={b} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 rounded" checked={form.badges.includes(b)}
                      onChange={(e) => set("badges", e.target.checked ? [...form.badges, b] : form.badges.filter((x) => x !== b))} />
                    {b}
                  </label>
                ))}
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 rounded" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} />
                  Fremhævet
                </label>
              </div>
            </fieldset>
          </div>
        )}
        {step === 5 && (
          <StepPreviewPublish
            form={form}
            quality={quality}
            existing={existing}
            listPath={listPath}
            onSaveDraft={() => void publishAction("draft")}
            onPublish={() => void publishAction("published")}
            onSchedule={(publishAt) => void persist({ status: "scheduled", publishAt }).then((id) => id && navigate(listPath))}
            onUnpublish={() => void publishAction("draft")}
            onMarkSold={() => existing && statusMutation.mutate({ ids: [existing.id], status: "sold" })}
            onMarkArchived={() => existing && statusMutation.mutate({ ids: [existing.id], status: "archived" })}
            onDuplicate={() => void duplicateAsNew()}
            setPublishAt={(v) => set("publishAt", v)}
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <button type="button" onClick={goBack} disabled={step === 0}
          className="inline-flex items-center gap-1.5 rounded-md border border-brand-ink/15 bg-white px-4 py-2 text-sm hover:bg-brand-ink/5 disabled:opacity-40">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Tilbage
        </button>
        <div className="flex gap-2">
          {vehicleId && (
            <button type="button" onClick={() => void persist()}
              className="inline-flex items-center gap-1.5 rounded-md border border-brand-ink/15 bg-white px-4 py-2 text-sm hover:bg-brand-ink/5">
              <Save className="h-4 w-4" aria-hidden /> Gem kladde
            </button>
          )}
          {step < steps.length - 1 && (
            <button type="button" onClick={() => void goNext()} disabled={step === 0 && (!form.make || !form.model)}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
              Næste <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SaveStatus({ status, error }: { status: "idle" | "saving" | "saved" | "error"; error: string | null }) {
  if (status === "idle") return null;
  if (status === "saving") return <span className="flex items-center gap-1.5 text-xs text-brand-ink/50"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Gemmer…</span>;
  if (status === "error") return <span className="text-xs text-red-700">Kunne ikke gemme{error ? `: ${error}` : ""}</span>;
  return <span className="flex items-center gap-1.5 text-xs text-emerald-700"><Check className="h-3.5 w-3.5" aria-hidden /> Gemt</span>;
}

function StepPlate({
  plateInput, setPlateInput, onLookup, busy, message, form, set,
}: {
  plateInput: string;
  setPlateInput: (v: string) => void;
  onLookup: () => void;
  busy: boolean;
  message: string | null;
  form: VehicleFormValues;
  set: <K extends keyof VehicleFormValues>(key: K, value: VehicleFormValues[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-bold text-brand-primary">Nummerplade</h2>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Indtast nummerplade">
          <input value={plateInput} onChange={(e) => setPlateInput(e.target.value.toUpperCase())} placeholder="AB 12 345"
            className="w-48 rounded-md border-2 border-brand-accent/60 px-3 py-2 text-center font-display text-lg font-bold uppercase tracking-widest" />
        </Field>
        <button type="button" onClick={onLookup} disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null} Slå op
        </button>
      </div>
      {message && <p className="text-sm text-brand-ink/70" role="status">{message}</p>}
      <p className="text-xs text-brand-ink/50">Findes bilen ikke, kan du bare udfylde felterne herunder manuelt – alle felter kan altid redigeres.</p>

      <div className="grid gap-4 border-t border-brand-ink/5 pt-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Mærke *"><input className={inputCls} value={form.make} onChange={(e) => set("make", e.target.value)} required /></Field>
        <Field label="Model *"><input className={inputCls} value={form.model} onChange={(e) => set("model", e.target.value)} required /></Field>
        <Field label="Variant"><input className={inputCls} value={form.variant} onChange={(e) => set("variant", e.target.value)} /></Field>
        <Field label="Årgang"><input type="number" className={inputCls} value={form.modelYear} onChange={(e) => set("modelYear", e.target.value)} /></Field>
        <Field label="1. registrering"><input type="date" className={inputCls} value={form.firstRegistration} onChange={(e) => set("firstRegistration", e.target.value)} /></Field>
        <Field label="Kilometerstand"><input type="number" className={inputCls} value={form.mileageKm} onChange={(e) => set("mileageKm", e.target.value)} /></Field>
        <Field label="Drivmiddel">
          <select className={inputCls} value={form.fuelType} onChange={(e) => set("fuelType", e.target.value)}>
            <option value="">Vælg…</option>
            <option value="benzin">Benzin</option><option value="diesel">Diesel</option>
            <option value="el">El</option><option value="hybrid">Hybrid</option>
            <option value="plugin_hybrid">Plugin-hybrid</option><option value="andet">Andet</option>
          </select>
        </Field>
        <Field label="Gearkasse">
          <select className={inputCls} value={form.transmission} onChange={(e) => set("transmission", e.target.value)}>
            <option value="">Vælg…</option><option value="manuel">Manuel</option><option value="automatisk">Automatisk</option>
          </select>
        </Field>
        <Field label="Karrosseri"><input className={inputCls} value={form.bodyType} onChange={(e) => set("bodyType", e.target.value)} placeholder="fx SUV" /></Field>
        <Field label="Farve"><input className={inputCls} value={form.color} onChange={(e) => set("color", e.target.value)} /></Field>
        <Field label="Døre"><input type="number" className={inputCls} value={form.doors} onChange={(e) => set("doors", e.target.value)} /></Field>
        <Field label="Sæder"><input type="number" className={inputCls} value={form.seats} onChange={(e) => set("seats", e.target.value)} /></Field>
        <Field label="Effekt (hk)"><input type="number" className={inputCls} value={form.powerHp} onChange={(e) => set("powerHp", e.target.value)} /></Field>
        <Field label="Motor"><input className={inputCls} value={form.engine} onChange={(e) => set("engine", e.target.value)} /></Field>
        <Field label="Batteri (kWh)"><input type="number" step="0.1" className={inputCls} value={form.batteryKwh} onChange={(e) => set("batteryKwh", e.target.value)} /></Field>
        <Field label="Rækkevidde (km)"><input type="number" className={inputCls} value={form.rangeKm} onChange={(e) => set("rangeKm", e.target.value)} /></Field>
        <Field label="Forbrug"><input className={inputCls} value={form.consumption} onChange={(e) => set("consumption", e.target.value)} placeholder="fx 18,5 km/l" /></Field>
        <Field label="Halvårlig afgift (kr.)"><input type="number" className={inputCls} value={form.taxPeriodDkk} onChange={(e) => set("taxPeriodDkk", e.target.value)} /></Field>
        <Field label="Stelnummer (privat)"><input className={inputCls} value={form.vin} onChange={(e) => set("vin", e.target.value)} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.showRegistrationNumber} onChange={(e) => set("showRegistrationNumber", e.target.checked)} className="h-4 w-4 rounded" />
        Vis registreringsnummer offentligt på annoncen
      </label>
    </div>
  );
}

function StepSaleDetails({ form, set }: { form: VehicleFormValues; set: <K extends keyof VehicleFormValues>(key: K, value: VehicleFormValues[K]) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold text-brand-primary">Pris og praktisk</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kontantpris (kr.)"><input type="number" className={inputCls} value={form.priceDkk} onChange={(e) => set("priceDkk", e.target.value)} /></Field>
        <Field label="Månedlig ydelse (kr.)"><input type="number" className={inputCls} value={form.monthlyPriceDkk} onChange={(e) => set("monthlyPriceDkk", e.target.value)} /></Field>
        <Field label="Udbetaling (kr.)"><input type="number" className={inputCls} value={form.downPaymentDkk} onChange={(e) => set("downPaymentDkk", e.target.value)} /></Field>
        <Field label="Leveringsomkostninger (kr.)"><input type="number" className={inputCls} value={form.deliveryCostDkk} onChange={(e) => set("deliveryCostDkk", e.target.value)} /></Field>
        <Field label="Registreringsnummer"><input className={inputCls} value={form.registrationNumber} onChange={(e) => set("registrationNumber", e.target.value.toUpperCase())} /></Field>
        <Field label="Antal ejere"><input type="number" className={inputCls} value={form.ownerCount} onChange={(e) => set("ownerCount", e.target.value)} /></Field>
        <Field label="Seneste service"><input type="date" className={inputCls} value={form.lastServiceDate} onChange={(e) => set("lastServiceDate", e.target.value)} /></Field>
        <Field label="Garanti"><input className={inputCls} value={form.warrantyText} onChange={(e) => set("warrantyText", e.target.value)} placeholder="fx 12 måneders garanti via AutoConcept" /></Field>
      </div>
      <Field label="Servicehistorik"><textarea rows={2} className={inputCls} value={form.serviceHistoryText} onChange={(e) => set("serviceHistoryText", e.target.value)} /></Field>
    </div>
  );
}

function StepRentalDetails({ form, set }: { form: VehicleFormValues; set: <K extends keyof VehicleFormValues>(key: K, value: VehicleFormValues[K]) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold text-brand-primary">Udlejningsvilkår</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pris pr. dag (kr.)"><input type="number" className={inputCls} value={form.pricePerDayDkk} onChange={(e) => set("pricePerDayDkk", e.target.value)} /></Field>
        <Field label="Pris pr. uge (kr.)"><input type="number" className={inputCls} value={form.pricePerWeekDkk} onChange={(e) => set("pricePerWeekDkk", e.target.value)} /></Field>
        <Field label="Pris pr. måned (kr.)"><input type="number" className={inputCls} value={form.pricePerMonthDkk} onChange={(e) => set("pricePerMonthDkk", e.target.value)} /></Field>
        <Field label="Depositum (kr.)"><input type="number" className={inputCls} value={form.depositDkk} onChange={(e) => set("depositDkk", e.target.value)} /></Field>
        <Field label="Inkluderede km/dag"><input type="number" className={inputCls} value={form.includedKmPerDay} onChange={(e) => set("includedKmPerDay", e.target.value)} /></Field>
        <Field label="Pris pr. ekstra km (kr.)"><input type="number" step="0.1" className={inputCls} value={form.extraKmPriceDkk} onChange={(e) => set("extraKmPriceDkk", e.target.value)} /></Field>
        <Field label="Minimumsalder"><input type="number" className={inputCls} value={form.minAge} onChange={(e) => set("minAge", e.target.value)} /></Field>
        <Field label="Krav til kørekort"><input className={inputCls} value={form.licenseRequirement} onChange={(e) => set("licenseRequirement", e.target.value)} placeholder="fx Kategori B" /></Field>
        <Field label="Afhentningssted"><input className={inputCls} value={form.pickupLocation} onChange={(e) => set("pickupLocation", e.target.value)} /></Field>
        <Field label="Ledighed">
          <select className={inputCls} value={form.availabilityStatus} onChange={(e) => set("availabilityStatus", e.target.value)}>
            <option value="available">Ledig</option>
            <option value="booked">Optaget</option>
            <option value="maintenance">Ikke tilgængelig (service)</option>
          </select>
        </Field>
      </div>
      <Field label="Forsikringsoplysninger"><textarea rows={2} className={inputCls} value={form.insuranceInfo} onChange={(e) => set("insuranceInfo", e.target.value)} /></Field>
      <Field label="Eventuelle ekstra gebyrer"><textarea rows={2} className={inputCls} value={form.extraFeesText} onChange={(e) => set("extraFeesText", e.target.value)} /></Field>
    </div>
  );
}

function StepPreviewPublish({
  form, quality, existing, listPath, onSaveDraft, onPublish, onSchedule, onUnpublish, onMarkSold, onMarkArchived, onDuplicate, setPublishAt,
}: {
  form: VehicleFormValues;
  quality: { ready: boolean; missing: string[] };
  existing: AdminVehicle | undefined;
  listPath: string;
  onSaveDraft: () => void;
  onPublish: () => void;
  onSchedule: (publishAt: string) => void;
  onUnpublish: () => void;
  onMarkSold: () => void;
  onMarkArchived: () => void;
  onDuplicate: () => void;
  setPublishAt: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-bold text-brand-primary">Forhåndsvisning og publicering</h2>

      <div className={cn("rounded-md p-3 text-sm", quality.ready ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900")}>
        {quality.ready ? "Klar til publicering." : `Mangler før publicering: ${quality.missing.join(", ")}.`}
      </div>

      <div className="rounded-lg border border-brand-ink/10 p-4">
        <p className="font-display text-lg font-bold">{form.make} {form.model} {form.variant}</p>
        <p className="text-sm text-brand-ink/60">{form.modelYear} · {form.mileageKm ? `${Number(form.mileageKm).toLocaleString("da-DK")} km` : "–"}</p>
        <p className="mt-2 whitespace-pre-line text-sm text-brand-ink/80">{form.description || "Ingen beskrivelse endnu."}</p>
      </div>

      {existing && (
        <a href={`/biler/${form.slug}`} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm hover:bg-brand-ink/5">
          <Eye className="h-4 w-4" aria-hidden /> Åbn offentlig side
        </a>
      )}

      <div className="flex flex-wrap gap-2 border-t border-brand-ink/5 pt-4">
        <button type="button" onClick={onSaveDraft} className="rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm hover:bg-brand-ink/5">Gem som kladde</button>
        <button type="button" onClick={onPublish} className="rounded-md bg-brand-gradient px-3 py-2 text-sm font-semibold text-white hover:opacity-90">Publicér</button>
        {existing?.status === "published" && (
          <button type="button" onClick={onUnpublish} className="rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm hover:bg-brand-ink/5">Afpublicér</button>
        )}
        {existing && form.listingType === "sale" && (
          <button type="button" onClick={onMarkSold} className="rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm hover:bg-brand-ink/5">Markér som solgt</button>
        )}
        {existing && (
          <button type="button" onClick={onMarkArchived} className="rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50">Arkivér</button>
        )}
        {existing && (
          <button type="button" onClick={onDuplicate} className="inline-flex items-center gap-1.5 rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm hover:bg-brand-ink/5">
            <Copy className="h-4 w-4" aria-hidden /> Duplikér
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-2 border-t border-brand-ink/5 pt-4">
        <Field label="Planlæg publicering til"><input type="datetime-local" className={inputCls} value={form.publishAt} onChange={(e) => setPublishAt(e.target.value)} /></Field>
        <button type="button" disabled={!form.publishAt} onClick={() => onSchedule(form.publishAt)}
          className="rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm hover:bg-brand-ink/5 disabled:opacity-40">
          Planlæg
        </button>
      </div>

      <Link to={listPath} className="inline-block text-sm text-brand-ink/60 hover:underline">Tilbage til oversigten</Link>
    </div>
  );
}
