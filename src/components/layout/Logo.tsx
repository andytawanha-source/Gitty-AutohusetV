import { useBrand } from "@/app/BrandProvider";
import { cn } from "@/lib/utils";

/**
 * Wordmark stærkt inspireret af referencelogoet fra kunden (skrå "speed lines" +
 * fed, kursiv, versaleret tekst i ét stykke). Bruger `currentColor`, så den arver
 * tekstfarven fra sin forælder (hvid i header på brandets primærfarve).
 */
export function Logo({ className }: { className?: string }) {
  const brand = useBrand();
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 34 28" width="30" height="24" aria-hidden className="shrink-0">
        <g fill="currentColor">
          <polygon points="0,28 8,28 20,0 12,0" />
          <polygon points="11,28 19,28 28,4 20,4" />
          <polygon points="22,28 28,28 34,12 27,12" />
        </g>
      </svg>
      <span className="font-display text-xl font-black uppercase italic leading-none tracking-wide">
        {brand.name}
      </span>
    </span>
  );
}
