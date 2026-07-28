import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { FieldError, inputCls } from "@/components/sell/fields";
import { bookingFormSchema, MAX_BOOKING_DAYS_AHEAD, SERVICE_TYPES, TIME_SLOTS, type BookingFormInput } from "@/features/workshop/schema";
import { getBookedSlots, submitBooking, SlotTakenError } from "@/features/workshop/api";
import { lookupPlate } from "@/features/plate-lookup/client";
import type { NormalizedVehicleLookupResult } from "@/features/plate-lookup/types";
import { cn } from "@/lib/utils";

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

function isWeekend(dateStr: string): boolean {
  if (!dateStr) return false;
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; reference: string; date: string; time: string }
  | { status: "conflict" }
  | { status: "error"; message: string };

export function BookingForm() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormInput>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: { appointmentDate: "", appointmentTime: undefined, serviceType: undefined },
  });

  const [lookup, setLookup] = useState<NormalizedVehicleLookupResult | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupNotice, setLookupNotice] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  const serviceType = watch("serviceType");
  const appointmentDate = watch("appointmentDate");
  const registrationNumber = watch("registrationNumber");

  const slotsQuery = useQuery({
    queryKey: ["workshop-booked-slots", appointmentDate],
    queryFn: () => getBookedSlots(appointmentDate, appointmentDate),
    enabled: Boolean(appointmentDate) && !isWeekend(appointmentDate),
  });

  const takenTimes = useMemo(
    () => new Set((slotsQuery.data ?? []).map((s) => s.appointmentTime)),
    [slotsQuery.data]
  );

  // Hvis den valgte tid lige er blevet optaget af en anden (fx efter en konflikt), fravælg den.
  useEffect(() => {
    const current = watch("appointmentTime");
    if (current && takenTimes.has(current)) {
      setValue("appointmentTime", undefined as unknown as BookingFormInput["appointmentTime"]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [takenTimes]);

  async function handlePlateBlur() {
    if (!registrationNumber || registrationNumber.trim().length < 2) return;
    setLookupNotice(null);
    setIsLookingUp(true);
    const outcome = await lookupPlate(registrationNumber);
    setIsLookingUp(false);

    if (outcome.status === "success") {
      setLookup(outcome.result);
    } else {
      // Ikke-blokerende: booking kan altid gennemføres med kun nummerpladen
      setLookup(null);
      if (outcome.status === "not_found") {
        setLookupNotice("Vi kunne ikke finde bilen automatisk – det er helt fint, vi booker alligevel din tid.");
      }
    }
  }

  const onSubmit = async (data: BookingFormInput) => {
    setSubmitState({ status: "submitting" });
    try {
      const result = await submitBooking(data, lookup);
      setSubmitState({
        status: "success",
        reference: result.reference,
        date: result.appointmentDate,
        time: result.appointmentTime,
      });
    } catch (err) {
      if (err instanceof SlotTakenError) {
        setSubmitState({ status: "conflict" });
        slotsQuery.refetch();
      } else {
        setSubmitState({
          status: "error",
          message: err instanceof Error ? err.message : "Der skete en uventet fejl. Prøv igen.",
        });
      }
    }
  };

  if (submitState.status === "success") {
    const dateLabel = new Date(`${submitState.date}T00:00:00`).toLocaleDateString("da-DK", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-brand-ink/5 lg:p-8" role="status">
        <CheckCircle2 className="h-10 w-10 text-brand-accent" aria-hidden />
        <h2 className="mt-3 font-display text-xl font-bold text-brand-primary">Tak for din booking!</h2>
        <p className="mt-2 text-brand-ink/70">
          Vi har modtaget din forespørgsel om en tid {dateLabel} kl. {submitState.time}. Du modtager en
          bekræftelse på e-mail, og vi kontakter dig, hvis der er behov for at justere tiden.
        </p>
        <p className="mt-4 text-sm font-medium text-brand-ink">
          Din reference: <span className="font-mono">{submitState.reference}</span>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Honeypot – skjult for mennesker, fanger simple bots */}
      <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden {...register("website")} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="bf-plate" className="mb-1 block text-sm font-medium">Nummerplade *</label>
          <input
            id="bf-plate"
            autoComplete="off"
            maxLength={9}
            placeholder="AB 12 345"
            className="w-full rounded-md border-2 border-brand-accent/60 bg-white px-3 py-3 text-center font-display text-xl font-bold uppercase tracking-widest placeholder:text-brand-ink/30"
            aria-invalid={!!errors.registrationNumber}
            aria-describedby={errors.registrationNumber ? "bf-plate-err" : undefined}
            {...register("registrationNumber", { onBlur: handlePlateBlur })}
          />
          <FieldError id="bf-plate-err" message={errors.registrationNumber?.message} />
          {isLookingUp && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-brand-ink/60">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Henter biloplysninger…
            </p>
          )}
          {!isLookingUp && lookup && (
            <p className="mt-1.5 text-sm text-brand-ink/70">
              Fundet: <strong>{[lookup.make, lookup.model, lookup.modelYear].filter(Boolean).join(" ")}</strong>
            </p>
          )}
          {!isLookingUp && lookupNotice && <p className="mt-1.5 text-sm text-amber-800">{lookupNotice}</p>}
        </div>

        <div>
          <label htmlFor="bf-service" className="mb-1 block text-sm font-medium">Ydelse *</label>
          <select
            id="bf-service"
            className={inputCls}
            aria-invalid={!!errors.serviceType}
            defaultValue=""
            {...register("serviceType")}
          >
            <option value="" disabled>Vælg en ydelse</option>
            {SERVICE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <FieldError id="bf-service-err" message={errors.serviceType?.message} />
        </div>
      </div>

      {serviceType === "Andet" && (
        <div>
          <label htmlFor="bf-note" className="mb-1 block text-sm font-medium">Beskriv kort hvad du har brug for *</label>
          <textarea
            id="bf-note"
            rows={3}
            maxLength={500}
            className={inputCls}
            aria-invalid={!!errors.serviceNote}
            {...register("serviceNote")}
          />
          <FieldError id="bf-note-err" message={errors.serviceNote?.message} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="bf-date" className="mb-1 block text-sm font-medium">Ønsket dato *</label>
          <input
            id="bf-date"
            type="date"
            min={todayIso()}
            max={maxIso()}
            className={inputCls}
            aria-invalid={!!errors.appointmentDate}
            {...register("appointmentDate")}
          />
          <FieldError id="bf-date-err" message={errors.appointmentDate?.message} />
          {appointmentDate && isWeekend(appointmentDate) && (
            <p className="mt-1.5 text-sm text-amber-800">
              Vi holder lukket i weekenden – vælg venligst en hverdag.
            </p>
          )}
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium">Ønsket tidspunkt *</span>
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map((slot) => {
              const isTaken = takenTimes.has(slot);
              const isSelected = watch("appointmentTime") === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={isTaken || !appointmentDate || isWeekend(appointmentDate)}
                  onClick={() => setValue("appointmentTime", slot, { shouldValidate: true })}
                  className={cn(
                    "rounded-md border px-2 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    isSelected
                      ? "border-brand-primary bg-brand-gradient text-white"
                      : "border-brand-ink/15 bg-white hover:border-brand-primary/50",
                    isTaken && "line-through"
                  )}
                  aria-pressed={isSelected}
                >
                  {slot}
                </button>
              );
            })}
          </div>
          <FieldError id="bf-time-err" message={errors.appointmentTime?.message} />
          {slotsQuery.isFetching && <p className="mt-1.5 text-xs text-brand-ink/50">Tjekker ledige tider…</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="bf-name" className="mb-1 block text-sm font-medium">Navn *</label>
          <input id="bf-name" autoComplete="name" className={inputCls} aria-invalid={!!errors.name} {...register("name")} />
          <FieldError id="bf-name-err" message={errors.name?.message} />
        </div>
        <div>
          <label htmlFor="bf-phone" className="mb-1 block text-sm font-medium">Telefon *</label>
          <input id="bf-phone" type="tel" autoComplete="tel" className={inputCls} aria-invalid={!!errors.phone} {...register("phone")} />
          <FieldError id="bf-phone-err" message={errors.phone?.message} />
        </div>
        <div>
          <label htmlFor="bf-email" className="mb-1 block text-sm font-medium">E-mail *</label>
          <input id="bf-email" type="email" autoComplete="email" className={inputCls} aria-invalid={!!errors.email} {...register("email")} />
          <FieldError id="bf-email-err" message={errors.email?.message} />
        </div>
      </div>

      {submitState.status === "conflict" && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900" role="alert">
          Tiden blev desværre lige booket af en anden kunde. Vælg venligst et andet tidspunkt herover.
        </p>
      )}
      {submitState.status === "error" && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">
          {submitState.message}
        </p>
      )}

      <button
        type="submit"
        disabled={submitState.status === "submitting"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-gradient px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
      >
        {submitState.status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Sender booking…
          </>
        ) : (
          <>
            Book tid <ArrowRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </button>
      <p className="text-xs text-brand-ink/50">
        Din bookingforespørgsel bekræftes af os hurtigst muligt. Gratis og uforpligtende.
      </p>
    </form>
  );
}
