import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_STEPS = ["Din bil", "Bekræft", "Stand", "Billeder", "Kontakt"];

export function WizardProgress({ current, steps = DEFAULT_STEPS }: { current: number; steps?: string[] }) {
  return (
    <nav aria-label="Trin i salgsvurderingen">
      <ol className="flex items-center gap-1 sm:gap-2">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                aria-hidden
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors",
                  done && "bg-brand-gradient text-white",
                  active && "bg-white text-brand-primary ring-4 ring-brand-primary/25",
                  !done && !active && "bg-brand-ink/10 text-brand-ink/50"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-xs sm:block",
                  active ? "font-semibold text-brand-primary" : "text-brand-ink/50"
                )}
                aria-current={active ? "step" : undefined}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-center text-sm text-brand-ink/60 sm:hidden">
        Trin {current + 1} af {steps.length}: {steps[current]}
      </p>
    </nav>
  );
}
