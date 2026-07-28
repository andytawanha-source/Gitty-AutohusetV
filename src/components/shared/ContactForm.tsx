import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { contactSchema, submitContactMessage, type ContactInput, type GeneralInquiryType } from "@/features/inquiries/api";
import { useBrand } from "@/app/BrandProvider";

const inputCls =
  "w-full rounded-md border border-brand-ink/15 bg-white px-3 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-brand-accent";

export function ContactForm({
  inquiryType = "contact",
  defaultMessage,
}: {
  /** Mærker henvendelsen korrekt i adminpanelets samlede leadindbakke. */
  inquiryType?: GeneralInquiryType;
  defaultMessage?: string;
}) {
  const brand = useBrand();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { message: defaultMessage },
  });

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      await submitContactMessage(data, inquiryType);
      setSubmitted(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Noget gik galt. Prøv igen.");
    }
  });

  if (submitted) {
    return (
      <div className="rounded-xl bg-emerald-50 p-6 text-center" role="status">
        <CheckCircle2 className="mx-auto h-10 w-10 animate-pop-in text-emerald-600" aria-hidden />
        <h3 className="mt-3 font-display text-lg font-bold text-emerald-900">Tak for din besked</h3>
        <p className="mt-1 text-sm text-emerald-800">Vi vender tilbage {brand.leadResponseTime}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="ct-name" className="mb-1 block text-sm font-medium">Navn *</label>
        <input id="ct-name" autoComplete="name" className={inputCls} {...register("name")}
          aria-invalid={!!formState.errors.name} />
        {formState.errors.name && <p className="mt-1 text-sm text-red-700">{formState.errors.name.message}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ct-phone" className="mb-1 block text-sm font-medium">Telefon *</label>
          <input id="ct-phone" type="tel" autoComplete="tel" className={inputCls} {...register("phone")}
            aria-invalid={!!formState.errors.phone} />
          {formState.errors.phone && <p className="mt-1 text-sm text-red-700">{formState.errors.phone.message}</p>}
        </div>
        <div>
          <label htmlFor="ct-email" className="mb-1 block text-sm font-medium">E-mail *</label>
          <input id="ct-email" type="email" autoComplete="email" className={inputCls} {...register("email")}
            aria-invalid={!!formState.errors.email} />
          {formState.errors.email && <p className="mt-1 text-sm text-red-700">{formState.errors.email.message}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="ct-message" className="mb-1 block text-sm font-medium">Besked</label>
        <textarea id="ct-message" rows={5} className={inputCls} {...register("message")} />
      </div>

      <div className="absolute left-[-9999px]" aria-hidden>
        <label htmlFor="ct-website">Udfyld ikke dette felt</label>
        <input id="ct-website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
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

      <button type="submit" disabled={formState.isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-gradient px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60">
        {formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Send besked
      </button>
    </form>
  );
}
