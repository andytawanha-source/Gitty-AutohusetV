import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, FlaskConical } from "lucide-react";
import type { NormalizedVehicleLookupResult } from "@/features/plate-lookup/types";
import { manualVehicleSchema, type ManualVehicleInput } from "@/features/leads/schema";
import { formatDate } from "@/lib/format";
import { FieldError, inputCls } from "./fields";

/**
 * Årgang og drivmiddel er de to felter, der påvirker det automatiske skøn allermest
 * (deprecieringsalder hhv. op til +8% for el). Mangler opslaget dem, får kunden et
 * useriøst/upræcist skøn uden selv at vide hvorfor – derfor tvinges disse (og kun disse)
 * to felter til at være udfyldt, før vi går videre, uanset om resten af opslaget lykkedes.
 */
function isMissingCriticalInfo(lookup: NormalizedVehicleLookupResult | null): boolean {
  if (!lookup) return false;
  return !lookup.modelYear || !lookup.fuelType;
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 border-b border-brand-ink/5 py-1.5 text-sm">
      <dt className="text-brand-ink/60">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

export function StepConfirmVehicle({
  lookup,
  manualDefault,
  onConfirm,
  onManual,
  onBack,
}: {
  lookup: NormalizedVehicleLookupResult | null;
  manualDefault?: Partial<ManualVehicleInput>;
  onConfirm: () => void;
  onManual: (data: ManualVehicleInput) => void;
  onBack: () => void;
}) {
  const missingCritical = isMissingCriticalInfo(lookup);
  const [manualMode, setManualMode] = useState(lookup === null);
  const { register, handleSubmit, formState } = useForm<ManualVehicleInput>({
    resolver: zodResolver(manualVehicleSchema),
    defaultValues:
      manualDefault ??
      (lookup
        ? {
            make: lookup.make,
            model: lookup.model,
            variant: lookup.variant,
            modelYear: lookup.modelYear,
            fuelType: lookup.fuelType,
            transmission: lookup.transmission,
            color: lookup.color,
          }
        : undefined),
  });

  if (!manualMode && lookup) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="font-display text-xl font-bold text-brand-primary">Er dette din bil?</h2>
          <p className="mt-1 text-sm text-brand-ink/70">
            Vi fandt følgende oplysninger for {lookup.registrationNumber}.
          </p>
        </div>

        {lookup.isMock && (
          <p className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900" role="status">
            <FlaskConical className="h-4 w-4 shrink-0" aria-hidden />
            DEMO-MODE: Dette er mockdata – der er ikke foretaget et rigtigt registeropslag.
          </p>
        )}

        {missingCritical && (
          <p className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900" role="status">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            Opslaget mangler {!lookup.modelYear && !lookup.fuelType ? "årgang og drivmiddel" : !lookup.modelYear ? "årgang" : "drivmiddel"}
            {" "}– vi beder dig lige udfylde det, så vi kan give dig en retvisende vurdering.
          </p>
        )}

        <dl className="rounded-xl bg-brand-surface-warm/40 p-5">
          <Row label="Mærke" value={lookup.make} />
          <Row label="Model" value={lookup.model} />
          <Row label="Variant" value={lookup.variant} />
          <Row label="Modelår" value={lookup.modelYear} />
          <Row label="1. registrering" value={lookup.firstRegistrationDate ? formatDate(lookup.firstRegistrationDate) : null} />
          <Row label="Drivmiddel" value={lookup.fuelType} />
          <Row label="Gearkasse" value={lookup.transmission} />
          <Row label="Karrosseri" value={lookup.bodyType} />
          <Row label="Farve" value={lookup.color} />
          <Row label="Motorstørrelse" value={lookup.engineSize ? `${lookup.engineSize} l` : null} />
          <Row label="Effekt" value={lookup.powerHp ? `${lookup.powerHp} hk` : null} />
          <Row label="Batteri" value={lookup.batteryCapacityKwh ? `${lookup.batteryCapacityKwh} kWh` : null} />
          <Row label="Rækkevidde" value={lookup.electricRangeKm ? `${lookup.electricRangeKm} km` : null} />
          <Row label="Egenvægt" value={lookup.curbWeightKg ? `${lookup.curbWeightKg} kg` : null} />
          <Row label="Totalvægt" value={lookup.totalWeightKg ? `${lookup.totalWeightKg} kg` : null} />
          <Row label="Registreringsstatus" value={lookup.registrationStatus} />
          <Row label="Seneste syn" value={lookup.inspectionDate ? formatDate(lookup.inspectionDate) : null} />
          <Row label="Næste syn" value={lookup.nextInspectionDate ? formatDate(lookup.nextInspectionDate) : null} />
        </dl>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={missingCritical ? () => setManualMode(true) : onConfirm}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-gradient px-5 py-3 font-semibold text-white hover:opacity-90"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {missingCritical ? "Ja, det er min bil – udfyld manglende info" : "Ja, det er min bil"}
          </button>
          <button
            type="button"
            onClick={() => setManualMode(true)}
            className="rounded-md border border-brand-primary px-5 py-3 font-medium text-brand-primary hover:bg-brand-primary/5"
          >
            Nej, indtast oplysninger manuelt
          </button>
        </div>
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-brand-ink/60 hover:text-brand-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Tilbage
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onManual)} noValidate className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-brand-primary">Indtast bilens oplysninger</h2>
        <p className="mt-1 text-sm text-brand-ink/70">
          {lookup === null
            ? "Vi kunne ikke hente bilens oplysninger automatisk – udfyld dem her i stedet."
            : "Udfyld bilens korrekte oplysninger herunder."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="mv-make" className="mb-1 block text-sm font-medium">Mærke *</label>
          <input id="mv-make" className={inputCls} {...register("make")} aria-invalid={!!formState.errors.make} />
          <FieldError id="mv-make-err" message={formState.errors.make?.message} />
        </div>
        <div>
          <label htmlFor="mv-model" className="mb-1 block text-sm font-medium">Model *</label>
          <input id="mv-model" className={inputCls} {...register("model")} aria-invalid={!!formState.errors.model} />
          <FieldError id="mv-model-err" message={formState.errors.model?.message} />
        </div>
        <div>
          <label htmlFor="mv-variant" className="mb-1 block text-sm font-medium">Variant</label>
          <input id="mv-variant" className={inputCls} placeholder="fx 1.5 TSI Style" {...register("variant")} />
        </div>
        <div>
          <label htmlFor="mv-year" className="mb-1 block text-sm font-medium">Årgang *</label>
          <input id="mv-year" type="number" inputMode="numeric" className={inputCls} {...register("modelYear")}
            aria-invalid={!!formState.errors.modelYear} />
          <FieldError id="mv-year-err" message={formState.errors.modelYear?.message} />
        </div>
        <div>
          <label htmlFor="mv-fuel" className="mb-1 block text-sm font-medium">Drivmiddel *</label>
          <select id="mv-fuel" className={inputCls} {...register("fuelType")} aria-invalid={!!formState.errors.fuelType}>
            <option value="">Vælg…</option>
            <option>Benzin</option>
            <option>Diesel</option>
            <option>El</option>
            <option>Hybrid</option>
            <option>Plugin-hybrid</option>
          </select>
          <FieldError id="mv-fuel-err" message={formState.errors.fuelType?.message} />
        </div>
        <div>
          <label htmlFor="mv-trans" className="mb-1 block text-sm font-medium">Gearkasse</label>
          <select id="mv-trans" className={inputCls} {...register("transmission")}>
            <option value="">Vælg…</option>
            <option>Manuel</option>
            <option>Automatisk</option>
          </select>
        </div>
        <div>
          <label htmlFor="mv-color" className="mb-1 block text-sm font-medium">Farve</label>
          <input id="mv-color" className={inputCls} {...register("color")} />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-gradient px-5 py-3 font-semibold text-white hover:opacity-90">
          Fortsæt <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
        {lookup && (
          <button type="button" onClick={() => setManualMode(false)} className="text-sm text-brand-ink/60 hover:text-brand-primary">
            Tilbage til de fundne oplysninger
          </button>
        )}
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-brand-ink/60 hover:text-brand-primary sm:ml-auto">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Tilbage
        </button>
      </div>
    </form>
  );
}
