import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { contactStepSchema, type ConsentStepInput, type ContactStepInput } from "@/features/leads/schema";
import { useBrand } from "@/app/BrandProvider";
import { FieldError, inputCls, RadioPills } from "./fields";

/**
 * Kontaktoplysninger OG samtykke til databehandling indsamles sammen her –
 * ikke som et separat sidste "gennemgå og send"-trin. Så snart dette trin er
 * udfyldt og godkendt, sendes leadet reelt til systemet (se SellCarWizard/
 * TradeInModal), FØR det automatiske skøn vises. Det sikrer, at en sælger kan
 * følge op, selv hvis kunden bliver forskrækket over skønnet og ikke
 * fuldfører de sidste trin.
 */
export function StepContact({
  defaultValues,
  isSubmitting,
  submitError,
  onSubmit,
  onBack,
}: {
  defaultValues?: Partial<ContactStepInput>;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (data: ContactStepInput, consent: ConsentStepInput) => void;
  onBack: () => void;
}) {
  const brand = useBrand();
  const { control, register, handleSubmit, formState } = useForm<ContactStepInput>({
    resolver: zodResolver(contactStepSchema),
    defaultValues,
  });
  const err = formState.errors;

  const [processing, setProcessing] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [channels, setChannels] = useState<Array<"email" | "sms">>([]);
  const [consentError, setConsentError] = useState<string | null>(null);

  const submit = handleSubmit((data) => {
    if (!processing) {
      setConsentError("Du skal acceptere behandlingen af dine oplysninger for at fortsætte");
      return;
    }
    setConsentError(null);
    onSubmit(data, {
      processingConsent: true,
      marketingConsent: marketing,
      marketingChannels: marketing ? channels : [],
    });
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-brand-primary">Dine kontaktoplysninger</h2>
        <p className="mt-1 text-sm text-brand-ink/70">Så vi kan sende dig dit uforpligtende tilbud.</p>
      </div>

      <div>
        <label htmlFor="cs-name" className="mb-1 block text-sm font-medium">Navn *</label>
        <input id="cs-name" autoComplete="name" className={inputCls} {...register("name")} aria-invalid={!!err.name} />
        <FieldError id="cs-name-err" message={err.name?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cs-phone" className="mb-1 block text-sm font-medium">Telefon *</label>
          <input id="cs-phone" type="tel" autoComplete="tel" className={inputCls} {...register("phone")} aria-invalid={!!err.phone} />
          <FieldError id="cs-phone-err" message={err.phone?.message} />
        </div>
        <div>
          <label htmlFor="cs-email" className="mb-1 block text-sm font-medium">E-mail *</label>
          <input id="cs-email" type="email" autoComplete="email" className={inputCls} {...register("email")} aria-invalid={!!err.email} />
          <FieldError id="cs-email-err" message={err.email?.message} />
        </div>
        <div>
          <label htmlFor="cs-zip" className="mb-1 block text-sm font-medium">Postnummer *</label>
          <input id="cs-zip" inputMode="numeric" autoComplete="postal-code" maxLength={4} className={inputCls} {...register("postalCode")} aria-invalid={!!err.postalCode} />
          <FieldError id="cs-zip-err" message={err.postalCode?.message} />
        </div>
        <div>
          <label htmlFor="cs-time" className="mb-1 block text-sm font-medium">Bedste tidspunkt at kontakte dig</label>
          <input id="cs-time" className={inputCls} placeholder="fx hverdage efter kl. 16" {...register("bestContactTime")} />
        </div>
      </div>

      <Controller
        control={control}
        name="preferredChannel"
        render={({ field }) => (
          <RadioPills
            legend="Hvordan må vi kontakte dig? *"
            name="preferredChannel"
            options={[
              { value: "phone", label: "Telefon" },
              { value: "email", label: "E-mail" },
              { value: "sms", label: "SMS" },
            ]}
            value={field.value}
            onChange={field.onChange}
            error={err.preferredChannel?.message}
          />
        )}
      />

      <div>
        <label htmlFor="cs-message" className="mb-1 block text-sm font-medium">Supplerende besked</label>
        <textarea id="cs-message" rows={3} className={inputCls} {...register("message")} />
      </div>

      {/* Honeypot */}
      <div className="absolute left-[-9999px]" aria-hidden>
        <label htmlFor="cs-website">Udfyld ikke dette felt</label>
        <input id="cs-website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div className="space-y-4 rounded-xl border border-brand-ink/10 bg-white p-5">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={processing}
            onChange={(e) => setProcessing(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-brand-ink/30"
            aria-describedby={consentError ? "cs-consent-err" : undefined}
          />
          <span>
            Jeg accepterer, at {brand.name} behandler mine oplysninger for at kunne vurdere min bil og
            kontakte mig om min henvendelse.{" "}
            <Link to="/privatlivspolitik" target="_blank" className="underline">
              Læs privatlivspolitikken
            </Link>
            . *
          </span>
        </label>
        {consentError && <p id="cs-consent-err" className="text-sm text-red-700">{consentError}</p>}

        <hr className="border-brand-ink/10" />

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-brand-ink/30"
          />
          <span>
            <span className="font-medium">Valgfrit:</span> Ja tak, jeg ønsker også at modtage relevante
            tilbud og nyheder fra {brand.name}. Dette er ikke et krav, og jeg kan altid trække mit
            samtykke tilbage.
          </span>
        </label>

        {marketing && (
          <fieldset className="ml-7 animate-fade-up">
            <legend className="mb-1.5 text-sm text-brand-ink/70">Via hvilke kanaler?</legend>
            <div className="flex gap-4">
              {(["email", "sms"] as const).map((channel) => (
                <label key={channel} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={channels.includes(channel)}
                    onChange={(e) =>
                      setChannels((prev) => (e.target.checked ? [...prev, channel] : prev.filter((c) => c !== channel)))
                    }
                    className="h-4 w-4 rounded border-brand-ink/30"
                  />
                  {channel === "email" ? "E-mail" : "SMS"}
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      {submitError && <p className="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{submitError}</p>}

      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} disabled={isSubmitting} className="inline-flex items-center gap-1.5 text-sm text-brand-ink/60 hover:text-brand-primary disabled:opacity-50">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Tilbage
        </button>
        <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-md bg-brand-gradient px-5 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Fortsæt <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </form>
  );
}
