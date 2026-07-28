import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2, Repeat } from "lucide-react";
import { inquirySchema, submitVehicleInquiry, type InquiryInput } from "@/features/inquiries/api";
import type { Vehicle } from "@/features/vehicles/types";
import { useBrand } from "@/app/BrandProvider";
import { track } from "@/features/tracking/track";
import { cn } from "@/lib/utils";
import { TradeInModal } from "./TradeInModal";

const INQUIRY_LABELS: Record<InquiryInput["inquiryType"], string> = {
  contact: "Kontakt os om bilen",
  test_drive: "Book prøvetur",
  finance: "Få finansiering",
  trade_in: "Hvad er din byttebil værd?",
};

const inputCls =
  "w-full rounded-md border border-brand-ink/15 bg-white px-3 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-brand-accent";

export function VehicleInquiryForm({
  vehicle,
  initialType = "contact",
}: {
  vehicle: Vehicle;
  initialType?: InquiryInput["inquiryType"];
}) {
  const brand = useBrand();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showTradeInModal, setShowTradeInModal] = useState(false);

  const form = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { inquiryType: initialType, consent: undefined as unknown as true },
  });
  const { register, handleSubmit, formState, watch } = form;
  const inquiryType = watch("inquiryType");

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      await submitVehicleInquiry(data, vehicle);
      setSubmitted(true);
      track(data.inquiryType === "test_drive" ? "book_test_drive" : data.inquiryType === "finance" ? "finance_inquiry" : "submit_vehicle_inquiry", {
        vehicle_id: vehicle.id,
        inquiry_type: data.inquiryType,
      });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Noget gik galt. Prøv igen.");
    }
  });

  if (submitted) {
    return (
      <div className="rounded-xl bg-emerald-50 p-6 text-center" role="status">
        <CheckCircle2 className="mx-auto h-10 w-10 animate-pop-in text-emerald-600" aria-hidden />
        <h3 className="mt-3 font-display text-lg font-bold text-emerald-900">Tak for din henvendelse</h3>
        <p className="mt-1 text-sm text-emerald-800">
          Vi vender tilbage {brand.leadResponseTime}. Haster det? Ring på{" "}
          <a href={`tel:${brand.contact.phone}`} className="font-semibold underline">{brand.contact.phone}</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" id="forespoergsel">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Hvad drejer din henvendelse sig om?</legend>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(INQUIRY_LABELS) as InquiryInput["inquiryType"][]).map((type) => (
            <label
              key={type}
              className={cn(
                "cursor-pointer rounded-md border px-3 py-2 text-center text-sm font-medium transition-colors",
                inquiryType === type
                  ? "border-brand-primary bg-brand-gradient text-white"
                  : "border-brand-ink/15 bg-white hover:border-brand-primary/50"
              )}
            >
              <input type="radio" value={type} {...register("inquiryType")} className="sr-only" />
              {INQUIRY_LABELS[type]}
            </label>
          ))}
        </div>
      </fieldset>

      {inquiryType === "trade_in" ? (
        <div className="rounded-xl bg-brand-surface-warm/40 p-5 text-center">
          <Repeat className="mx-auto h-8 w-8 text-brand-accent" aria-hidden />
          <h3 className="mt-2 font-display text-base font-bold text-brand-primary">Hvad er din bil værd?</h3>
          <p className="mt-1 text-sm text-brand-ink/70">
            Indtast din nummerplade, svar på et par spørgsmål om bilens stand, og få en foreløbig vurdering med det
            samme. Vi vender bagefter tilbage med det endelige, uforpligtende bud – telefonisk eller på mail.
          </p>
          <button
            type="button"
            onClick={() => {
              track("start_sell_car_cta", { vehicle_id: vehicle.id, source: "vehicle_detail_inquiry_form" });
              setShowTradeInModal(true);
            }}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-gradient px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
          >
            <Repeat className="h-4 w-4" aria-hidden /> Start byttebilvurdering
          </button>
          {showTradeInModal && <TradeInModal vehicle={vehicle} onClose={() => setShowTradeInModal(false)} />}
        </div>
      ) : (
        <>
      <div>
        <label htmlFor="inq-name" className="mb-1 block text-sm font-medium">Navn *</label>
        <input id="inq-name" autoComplete="name" className={inputCls} {...register("name")}
          aria-invalid={!!formState.errors.name} aria-describedby={formState.errors.name ? "inq-name-err" : undefined} />
        {formState.errors.name && <p id="inq-name-err" className="mt-1 text-sm text-red-700">{formState.errors.name.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="inq-phone" className="mb-1 block text-sm font-medium">Telefon *</label>
          <input id="inq-phone" type="tel" autoComplete="tel" className={inputCls} {...register("phone")}
            aria-invalid={!!formState.errors.phone} aria-describedby={formState.errors.phone ? "inq-phone-err" : undefined} />
          {formState.errors.phone && <p id="inq-phone-err" className="mt-1 text-sm text-red-700">{formState.errors.phone.message}</p>}
        </div>
        <div>
          <label htmlFor="inq-email" className="mb-1 block text-sm font-medium">E-mail *</label>
          <input id="inq-email" type="email" autoComplete="email" className={inputCls} {...register("email")}
            aria-invalid={!!formState.errors.email} aria-describedby={formState.errors.email ? "inq-email-err" : undefined} />
          {formState.errors.email && <p id="inq-email-err" className="mt-1 text-sm text-red-700">{formState.errors.email.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="inq-message" className="mb-1 block text-sm font-medium">Besked</label>
        <textarea id="inq-message" rows={4} className={inputCls}
          placeholder={`Jeg er interesseret i ${vehicle.make} ${vehicle.model}…`} {...register("message")} />
      </div>

      {/* Honeypot – skjult for mennesker, udfyldes af bots */}
      <div className="absolute left-[-9999px]" aria-hidden>
        <label htmlFor="inq-website">Udfyld ikke dette felt</label>
        <input id="inq-website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-brand-ink/30" {...register("consent")} />
        <span>
          Jeg accepterer, at {brand.name} behandler mine oplysninger for at kunne besvare min henvendelse.{" "}
          <Link to="/privatlivspolitik" className="underline" target="_blank">Læs privatlivspolitikken</Link>. *
        </span>
      </label>
      {formState.errors.consent && <p className="text-sm text-red-700">{formState.errors.consent.message}</p>}

      {serverError && <p className="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{serverError}</p>}

      <button
        type="submit"
        disabled={formState.isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-gradient px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Send forespørgsel
      </button>
        </>
      )}
    </form>
  );
}
