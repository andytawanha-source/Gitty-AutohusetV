import { useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { useConsent } from "./ConsentProvider";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "necessary" as const, label: "Nødvendige", description: "Kræves for at hjemmesiden fungerer (fx dit cookievalg). Kan ikke fravælges.", locked: true },
  { key: "functional" as const, label: "Funktionelle", description: "Husker dine valg og muliggør fx kortvisning og favoritter på tværs af besøg." },
  { key: "statistics" as const, label: "Statistik", description: "Anonym statistik over, hvordan hjemmesiden bruges, så vi kan forbedre den." },
  { key: "marketing" as const, label: "Marketing", description: "Bruges til at måle effekten af annoncer og vise relevante annoncer på andre platforme." },
];

export function CookiePreferencesDialog() {
  const { consent, preferencesOpen, closePreferences, savePreferences } = useConsent();
  const [functional, setFunctional] = useState(consent?.functional ?? false);
  const [statistics, setStatistics] = useState(consent?.statistics ?? false);
  const [marketing, setMarketing] = useState(consent?.marketing ?? false);

  if (!preferencesOpen) return null;

  const values: Record<string, boolean> = { necessary: true, functional, statistics, marketing };
  const setters: Record<string, (v: boolean) => void> = {
    functional: setFunctional,
    statistics: setStatistics,
    marketing: setMarketing,
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="cookie-prefs-title">
      <button type="button" aria-label="Luk" className="absolute inset-0 bg-black/50" onClick={closePreferences} />
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="cookie-prefs-title" className="font-display text-lg font-bold text-brand-primary">Tilpas dit cookiesamtykke</h2>
          <button type="button" onClick={closePreferences} aria-label="Luk" className="rounded-md p-1.5 hover:bg-brand-ink/5">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-4">
          {CATEGORIES.map((cat) => (
            <label key={cat.key} className={cn("flex items-start gap-3 rounded-lg border border-brand-ink/10 p-4", cat.locked && "opacity-70")}>
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-brand-ink/30"
                checked={values[cat.key]}
                disabled={cat.locked}
                onChange={(e) => setters[cat.key]?.(e.target.checked)}
              />
              <span>
                <span className="block text-sm font-semibold">{cat.label}</span>
                <span className="block text-sm text-brand-ink/60">{cat.description}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => savePreferences({ functional: false, statistics: false, marketing: false })}
            className="rounded-md border border-brand-ink/15 px-4 py-2.5 text-sm font-medium hover:bg-brand-ink/5">
            Afvis alle
          </button>
          <button type="button" onClick={() => savePreferences({ functional, statistics, marketing })}
            className="rounded-md border border-brand-primary px-4 py-2.5 text-sm font-medium text-brand-primary hover:bg-brand-primary/5">
            Gem mine valg
          </button>
          <button type="button" onClick={() => savePreferences({ functional: true, statistics: true, marketing: true })}
            className="rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
            Accepter alle
          </button>
        </div>

        <p className="mt-4 text-xs text-brand-ink/50">
          Læs mere i vores <Link to="/cookiepolitik" className="underline" onClick={closePreferences}>cookiepolitik</Link> og{" "}
          <Link to="/privatlivspolitik" className="underline" onClick={closePreferences}>privatlivspolitik</Link>.
          Du kan altid ændre dit valg under “Cookieindstillinger” i bunden af siden.
        </p>
      </div>
    </div>
  );
}

/** Banner ved første besøg – “Accepter alle” og “Afvis alle” præsenteres ligeværdigt uden dark patterns. */
export function CookieBanner() {
  const { bannerVisible, acceptAll, rejectAll, openPreferences } = useConsent();
  if (!bannerVisible) return null;

  return (
    <div
      role="region"
      aria-label="Cookiesamtykke"
      className="fixed inset-x-0 bottom-0 z-[85] border-t border-brand-ink/10 bg-white p-4 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] sm:p-5"
    >
      <div className="container flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 h-6 w-6 shrink-0 text-brand-primary" aria-hidden />
          <p className="text-sm text-brand-ink/80">
            Vi bruger cookies til at få hjemmesiden til at fungere og – med dit samtykke – til statistik
            og marketing. Du vælger selv, og du kan altid ændre dit valg.{" "}
            <Link to="/cookiepolitik" className="underline">Læs cookiepolitikken</Link>.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:ml-auto lg:shrink-0">
          <button type="button" onClick={rejectAll}
            className="rounded-md border border-brand-ink/20 px-5 py-2.5 text-sm font-semibold hover:bg-brand-ink/5">
            Afvis alle
          </button>
          <button type="button" onClick={openPreferences}
            className="rounded-md border border-brand-primary px-5 py-2.5 text-sm font-semibold text-brand-primary hover:bg-brand-primary/5">
            Tilpas
          </button>
          <button type="button" onClick={acceptAll}
            className="rounded-md bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
            Accepter alle
          </button>
        </div>
      </div>
    </div>
  );
}
