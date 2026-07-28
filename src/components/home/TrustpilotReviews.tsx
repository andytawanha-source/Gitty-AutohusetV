import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

/**
 * Midlertidig Trustpilot-anmeldelses-slider.
 *
 * VIGTIGT: Anmeldelserne herunder er GENERISKE PLACEHOLDER-TEKSTER (fiktive kunder,
 * fiktivt indhold) – IKKE rigtige Trustpilot-anmeldelser. De bruges udelukkende til at
 * vise, hvordan sektionen kommer til at se ud, indtil den kobles til den rigtige
 * Trustpilot-widget/API for Autohuset Vest. Udskift `PLACEHOLDER_REVIEWS` og
 * `PLACEHOLDER_RATING` med rigtige data, når Trustpilot-integrationen er på plads –
 * se TODO nederst i filen.
 */
type Review = {
  name: string;
  initials: string;
  date: string;
  text: string;
};

const PLACEHOLDER_RATING = { score: 4.8, count: 127 };

const PLACEHOLDER_REVIEWS: Review[] = [
  {
    name: "Mette Kristensen",
    initials: "MK",
    date: "for 2 uger siden",
    text: "Super nem oplevelse fra start til slut. Bilen var præcis som beskrevet, og jeg fik en fair pris for min gamle bil i bytte. Kan varmt anbefales!",
  },
  {
    name: "Jonas Pedersen",
    initials: "JP",
    date: "for 3 uger siden",
    text: "God og ærlig rådgivning uden pushy sælgertaktik. Jeg følte mig tryg hele vejen igennem, og papirarbejdet blev klaret hurtigt.",
  },
  {
    name: "Lene Andersen",
    initials: "LA",
    date: "for 1 måned siden",
    text: "Fandt den perfekte familiebil her. Personalet tog sig tid til at svare på alle mine spørgsmål, og bilen var klargjort flot ved afhentning.",
  },
  {
    name: "Thomas Vestergaard",
    initials: "TV",
    date: "for 1 måned siden",
    text: "Solgte min bil til dem – hurtigt, nemt og til en pris jeg var tilfreds med. Pengene stod på kontoen samme dag.",
  },
  {
    name: "Camilla Holm",
    initials: "CH",
    date: "for 2 måneder siden",
    text: "Rigtig god service og et flot udvalg af biler. Vil helt sikkert handle her igen næste gang, jeg skal skifte bil.",
  },
  {
    name: "Anders Kjær",
    initials: "AK",
    date: "for 2 måneder siden",
    text: "Professionel betjening fra første kontakt til nøgleoverdragelse. Alt var, som det skulle være – ingen overraskelser.",
  },
];

function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-[#00b67a] text-[#00b67a]" />
      ))}
    </div>
  );
}

/** TODO: Erstat med rigtig Trustpilot Business-widget (script.tp.widget) eller data
 * hentet via Trustpilot API, når Autohuset Vest har en Trustpilot-profil med rigtige
 * anmeldelser. Se https://businessapp.b2b.trustpilot.com for widget-embed. */
export function TrustpilotReviews() {
  const [index, setIndex] = useState(0);
  const perView = 3;
  const maxIndex = Math.max(0, PLACEHOLDER_REVIEWS.length - perView);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, 6000);
    return () => clearInterval(id);
  }, [maxIndex]);

  return (
    <section className="bg-brand-surface-warm/40 py-14" aria-labelledby="reviews-heading">
      <div className="container">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="reviews-heading" className="font-display text-2xl font-bold text-brand-primary lg:text-3xl">
              Det siger vores kunder
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <Stars />
              <span className="text-sm font-semibold text-brand-ink/80">{PLACEHOLDER_RATING.score.toFixed(1)} / 5</span>
              <span className="text-sm text-brand-ink/50">baseret på {PLACEHOLDER_RATING.count} anmeldelser på Trustpilot</span>
            </div>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              aria-label="Forrige anmeldelser"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="rounded-full bg-white p-2 shadow-sm ring-1 ring-brand-ink/10 hover:bg-brand-surface-warm disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Næste anmeldelser"
              onClick={() => setIndex((i) => Math.min(maxIndex, i + 1))}
              disabled={index === maxIndex}
              className="rounded-full bg-white p-2 shadow-sm ring-1 ring-brand-ink/10 hover:bg-brand-surface-warm disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <div
            className="flex gap-5 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(calc(-${index} * (100% / ${perView} + 1.25rem)))` }}
          >
            {PLACEHOLDER_REVIEWS.map((review) => (
              <blockquote
                key={review.name}
                className="w-full shrink-0 rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5 sm:w-[calc((100%-2.5rem)/3)]"
              >
                <Stars />
                <p className="mt-3 text-sm leading-relaxed text-brand-ink/80">{review.text}</p>
                <footer className="mt-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary">
                    {review.initials}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-brand-ink">{review.name}</span>
                    <span className="block text-xs text-brand-ink/50">{review.date}</span>
                  </span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
