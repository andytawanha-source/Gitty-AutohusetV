import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X } from "lucide-react";
import { WizardProgress } from "@/components/sell/WizardProgress";
import { StepPlate } from "@/components/sell/StepPlate";
import { StepConfirmVehicle } from "@/components/sell/StepConfirmVehicle";
import { StepCondition } from "@/components/sell/StepCondition";
import { StepEstimateTeaser } from "@/components/sell/StepEstimateTeaser";
import { StepContact } from "@/components/sell/StepContact";
import { lookupPlate } from "@/features/plate-lookup/client";
import { submitSellCarLead } from "@/features/leads/api";
import { useInventory } from "@/features/vehicles/api";
import { estimateTradeInValue, valuationInputFromLookup } from "@/features/leads/valuation";
import type {
  ConditionStepInput,
  ConsentStepInput,
  ContactStepInput,
  ManualVehicleInput,
  PlateStepInput,
  SellCarState,
} from "@/features/leads/schema";
import type { Vehicle } from "@/features/vehicles/types";
import { formatPrice } from "@/lib/format";
import { useBrand } from "@/app/BrandProvider";
import { track } from "@/features/tracking/track";

const STEP_LABELS = ["Nummerplade", "Specifikationer", "Stand", "Vurdering", "Kontakt"];

/**
 * "Hvad er min bil værd?" – byttebilsvurdering startet direkte fra en bils detaljeside.
 * Genbruger samme nummerpladeopslag (motorapi/mock) og lead-indsendelse som den fulde
 * "Sælg din bil"-side (src/pages/public/SellCarPage.tsx), blot som et hurtigere
 * modal-flow med et automatisk skøn i sidste trin i stedet for et billede-trin.
 */
export function TradeInModal({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  const brand = useBrand();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<SellCarState>(() => ({
    photos: [],
    interestVehicle: {
      id: vehicle.id,
      label: [vehicle.make, vehicle.model, vehicle.variant].filter(Boolean).join(" "),
      priceDkk: vehicle.priceDkk,
      slug: vehicle.slug,
    },
  }));
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ reference: string } | null>(null);
  const { data: stock } = useInventory();
  const headingRef = useRef<HTMLDivElement>(null);
  const startTracked = useRef(false);

  // Beregnes løbende, så vi kan vise et bredt skøn allerede efter Stand-trinnet – FØR vi
  // beder om kontaktoplysninger. Se StepEstimateTeaser.tsx.
  const liveEstimate = useMemo(() => {
    const input = valuationInputFromLookup(state.lookup, state.manualVehicle, state.plate?.mileageKm ?? 0, state.condition);
    return estimateTradeInValue(input, stock ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.lookup, state.manualVehicle, state.plate?.mileageKm, state.condition, stock]);

  useEffect(() => {
    if (!startTracked.current) {
      startTracked.current = true;
      track("start_sell_car", { source: "vehicle_detail_trade_in", vehicle_id: vehicle.id });
    }
  }, [vehicle.id]);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: false });
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const goTo = (next: number) => {
    if (next > step) track("sell_car_step_completed", { step: step + 1, source: "vehicle_detail_trade_in" });
    setStep(next);
  };

  const handlePlate = async (data: PlateStepInput) => {
    setLookupError(null);
    setIsLookingUp(true);
    track("plate_lookup_started", { source: "vehicle_detail_trade_in" });
    const outcome = await lookupPlate(data.registrationNumber);
    setIsLookingUp(false);

    switch (outcome.status) {
      case "success":
        track("plate_lookup_success", { provider: outcome.result.provider });
        setState((s) => ({ ...s, plate: data, lookup: outcome.result }));
        goTo(1);
        break;
      case "not_found":
        track("plate_lookup_failed", { reason: "not_found" });
        setState((s) => ({ ...s, plate: data, lookup: null }));
        goTo(1);
        break;
      case "rate_limited":
        track("plate_lookup_failed", { reason: "rate_limited" });
        setLookupError("Du har lavet for mange opslag på kort tid. Vent et øjeblik og prøv igen.");
        break;
      case "disabled":
      case "error":
      default:
        track("plate_lookup_failed", { reason: outcome.status });
        setState((s) => ({ ...s, plate: data, lookup: null }));
        goTo(1);
        break;
    }
  };

  // Kontaktoplysninger + samtykke sendes med det samme, FØR det automatiske skøn
  // vises – se kommentaren i StepContact.tsx. Skønnet beregnes her (synkront, via
  // de rene funktioner i features/leads/valuation.ts) og gemmes med henvendelsen,
  // så en sælger kan se det samme tal som kunden fik at se.
  const handleContactSubmit = async (contact: ContactStepInput, consent: ConsentStepInput) => {
    setSubmitError(null);
    setIsSubmitting(true);

    const estimate: NonNullable<SellCarState["estimate"]> = {
      lowDkk: liveEstimate.low,
      midDkk: liveEstimate.mid,
      highDkk: liveEstimate.high,
      sampleSize: liveEstimate.sampleSize,
      basis: liveEstimate.basis,
    };
    const nextState: SellCarState = { ...state, contact, estimate };
    setState(nextState);

    try {
      const submitResult = await submitSellCarLead(nextState, consent);
      track("submit_sell_car_lead", {
        reference: submitResult.reference,
        is_demo: submitResult.isDemo,
        source: "vehicle_detail_trade_in",
        vehicle_id: vehicle.id,
      });
      setResult({ reference: submitResult.reference });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Noget gik galt. Prøv igen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const vehicleTitle = [vehicle.make, vehicle.model, vehicle.variant].filter(Boolean).join(" ");
  const thumbnail = vehicle.images[0]?.url;

  // Renderes via en portal direkte i <body>, så modalens interne <form> (Trin 5)
  // aldrig ender som et nested <form> inde i VehicleInquiryForms egen <form>.
  // Nestede formularer er ugyldig HTML – browseren dropper den indre form-tag,
  // hvilket får "Send"-knappen til i stedet at submitte den YDRE kontaktformular
  // (fuld side-reload, ingen bekræftelse) i stedet for at sende byttebil-leadet.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hvad er min bil værd?"
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/60 p-3 py-8 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-brand-surface-warm/60 p-4 shadow-2xl sm:p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Luk"
          className="absolute right-3 top-3 z-10 rounded-full bg-white p-2 shadow hover:bg-brand-ink/5"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        {!result && (
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-brand-ink/5">
            {thumbnail ? (
              <img src={thumbnail} alt="" width={80} height={56} className="h-14 w-20 shrink-0 rounded-md object-cover" />
            ) : (
              <div className="h-14 w-20 shrink-0 rounded-md bg-brand-ink/10" aria-hidden />
            )}
            <div className="min-w-0">
              <p className="text-xs text-brand-ink/60">Din bytning gælder</p>
              <p className="truncate font-display font-bold text-brand-ink">{vehicleTitle}</p>
              {vehicle.priceDkk !== null && (
                <p className="text-sm text-brand-primary">{formatPrice(vehicle.priceDkk)}</p>
              )}
            </div>
          </div>
        )}

        {!result && <WizardProgress current={step} steps={STEP_LABELS} />}

        <div
          ref={headingRef}
          tabIndex={-1}
          className="mt-6 animate-fade-up rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5 outline-none sm:p-7"
          key={result ? "result" : step}
        >
          {result ? (
            <div className="space-y-4 text-center" role="status">
              <CheckCircle2 className="mx-auto h-12 w-12 animate-pop-in text-emerald-600" aria-hidden />
              <h3 className="font-display text-xl font-bold text-brand-primary">Tak for din henvendelse</h3>
              <p className="text-sm text-brand-ink/70">
                Din foreløbige vurdering af {state.estimate ? `${formatPrice(state.estimate.lowDkk)} – ${formatPrice(state.estimate.highDkk)}` : "din bil"} er
                modtaget under referencen <span className="font-semibold">{result.reference}</span>. En af vores
                bilsælgere gennemgår oplysningerne og kontakter dig telefonisk eller på mail med det{" "}
                <strong>endelige, uforpligtende bud</strong> på din byttebil {brand.leadResponseTime}. Haster det?
                Ring på{" "}
                <a href={`tel:${brand.contact.phone}`} className="font-semibold underline">
                  {brand.contact.phone}
                </a>
                .
              </p>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-gradient px-5 py-3 font-semibold text-white hover:opacity-90"
              >
                Luk
              </button>
            </div>
          ) : (
            <>
              {step === 0 && (
                <StepPlate
                  defaultValues={{
                    registrationNumber: state.plate?.registrationNumber ?? "",
                    mileageKm: state.plate?.mileageKm,
                  }}
                  isLookingUp={isLookingUp}
                  lookupError={lookupError}
                  onSubmit={handlePlate}
                />
              )}
              {step === 1 && (
                <StepConfirmVehicle
                  lookup={state.lookup ?? null}
                  manualDefault={state.manualVehicle}
                  onConfirm={() => goTo(2)}
                  onManual={(manual: ManualVehicleInput) => {
                    setState((s) => ({ ...s, manualVehicle: manual, lookup: null }));
                    goTo(2);
                  }}
                  onBack={() => goTo(0)}
                />
              )}
              {step === 2 && (
                <StepCondition
                  defaultValues={state.condition}
                  onSubmit={(condition: ConditionStepInput) => {
                    setState((s) => ({ ...s, condition }));
                    goTo(3);
                  }}
                  onBack={() => goTo(1)}
                />
              )}
              {step === 3 && (
                <StepEstimateTeaser estimate={liveEstimate} onContinue={() => goTo(4)} onBack={() => goTo(2)} />
              )}
              {step === 4 && (
                <StepContact
                  defaultValues={state.contact}
                  isSubmitting={isSubmitting}
                  submitError={submitError}
                  onSubmit={handleContactSubmit}
                  onBack={() => goTo(3)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
