import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import type { ValuationEstimate } from "@/features/leads/valuation";

/**
 * Vises lige efter Stand-trinnet – FØR vi beder om kontaktoplysninger. Viser bevidst
 * ikke noget prisoverslag til kunden; det interne estimat (estimate) beregnes og
 * gemmes stadig som reference til sælgeren (se TradeInModal.tsx), men kommunikeres
 * ikke i UI'en. Selve leadet indsendes stadig først når kontakt+samtykke er givet –
 * denne skærm sender intet og gemmer intet.
 */
export function StepEstimateTeaser({
  onContinue,
  onBack,
}: {
  estimate: ValuationEstimate;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-brand-primary">Tak for oplysningerne</h2>
        <p className="mt-1 text-sm text-brand-ink/70">
          Vi har det, vi skal bruge, for at kigge nærmere på din bil.
        </p>
      </div>

      <div className="flex gap-3 rounded-md bg-brand-primary/5 p-4 text-sm text-brand-ink/80 ring-1 ring-brand-primary/10">
        <Info className="h-5 w-5 shrink-0 text-brand-primary" aria-hidden />
        <p>
          Vi kontakter dig ift. hvad du kan få for din byttebil, når en af vores bilsælgere har gennemgået
          oplysningerne. Det er <strong>ikke et bindende tilbud</strong>.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-brand-ink/60 hover:text-brand-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Tilbage
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-2 rounded-md bg-brand-gradient px-6 py-3 font-bold text-white transition-transform hover:scale-[1.02] motion-reduce:transform-none"
        >
          Få det endelige bud <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
