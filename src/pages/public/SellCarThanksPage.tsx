import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Mail, Phone } from "lucide-react";
import { Seo } from "@/components/seo/Seo";
import { useBrand } from "@/app/BrandProvider";
import { track } from "@/features/tracking/track";

/** Diskret premium-succesanimation (CSS-konfetti, respekterer prefers-reduced-motion). */
function SuccessConfetti() {
  const reduced =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex justify-center overflow-hidden">
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${8 + (i * 84) % 88}%`,
            animationDelay: `${(i % 6) * 0.12}s`,
            backgroundColor: i % 3 === 0 ? "rgb(var(--brand-accent))" : i % 3 === 1 ? "rgb(var(--brand-primary))" : "rgb(var(--brand-surface-warm))",
          }}
        />
      ))}
    </div>
  );
}

export default function SellCarThanksPage() {
  const { reference } = useParams();
  const brand = useBrand();
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      track("lead_confirmed", { reference: reference ?? "" });
    }
  }, [reference]);

  return (
    <div className="relative">
      <SuccessConfetti />
      <div className="container flex min-h-[60vh] items-center justify-center py-14">
        <Seo title="Tak for din henvendelse" index={false} />
        <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-brand-ink/5">
          <CheckCircle2 className="mx-auto h-14 w-14 animate-pop-in text-emerald-600" aria-hidden />
          <h1 className="mt-4 font-display text-2xl font-bold text-brand-primary">Tak for din henvendelse!</h1>
          <p className="mt-2 text-brand-ink/70">
            Vi har modtaget oplysningerne om din bil og vender tilbage med et uforpligtende tilbud{" "}
            <strong>{brand.leadResponseTime}</strong>.
          </p>

          <div className="mt-5 rounded-lg bg-brand-surface-warm/50 p-4">
            <p className="text-sm text-brand-ink/60">Din reference</p>
            <p className="font-display text-xl font-bold tracking-wide text-brand-primary">{reference}</p>
          </div>

          <p className="mt-4 text-sm text-brand-ink/60">
            Du modtager også en bekræftelse på e-mail. Har du spørgsmål, er du velkommen til at kontakte os:
          </p>
          <div className="mt-3 flex flex-col items-center gap-2 text-sm font-medium">
            <a href={`tel:${brand.contact.phone}`} className="inline-flex items-center gap-2 text-brand-primary hover:underline">
              <Phone className="h-4 w-4" aria-hidden /> {brand.contact.phone}
            </a>
            <a href={`mailto:${brand.contact.email}`} className="inline-flex items-center gap-2 text-brand-primary hover:underline">
              <Mail className="h-4 w-4" aria-hidden /> {brand.contact.email}
            </a>
          </div>

          <Link to="/" className="mt-6 inline-block rounded-md bg-brand-gradient px-6 py-2.5 font-medium text-white hover:opacity-90">
            Tilbage til forsiden
          </Link>
        </div>
      </div>
    </div>
  );
}
