import { ArrowRight, CheckCircle2, Clock, Droplets, MapPin, Sparkles } from "lucide-react";
import { Seo } from "@/components/seo/Seo";
import { useBrand } from "@/app/BrandProvider";

interface BilplejePakke {
  navn: string;
  undertitel: string;
  pris: string;
  varighed: string;
  intro: string;
  punkter: string[];
  fremhaevet?: boolean;
}

const PAKKER: BilplejePakke[] = [
  {
    navn: "Basis Vask",
    undertitel: "Inklusiv Damp",
    pris: "399 kr",
    varighed: "60 min.",
    intro: "Giv din bil den pleje, den fortjener, med vores Basis Vask.",
    punkter: [
      "Grundig indvendig og udvendig dampvask",
      "Rengøring af fælge",
      "Rens og glans af dæk",
      "Tørring med skånsomme mikrofiberklude",
      "Støvsugning af hele kabinen",
      "Rengøring af ruder indvendigt og udvendigt",
    ],
  },
  {
    navn: "Medium",
    undertitel: "Inklusiv Damp og Voks",
    pris: "599 kr",
    varighed: "60 min.",
    intro:
      "Forkæl din bil med en mere dybdegående rengøring og langvarig beskyttelse. Vores Medium Vask kombinerer professionel håndvask, dampvask og voksbehandling, så din bil fremstår ren, velplejet og beskyttet – både indvendigt og udvendigt.",
    punkter: [
      "Eksklusiv udvendig håndvask",
      "Udvendig dampvask for en dybdegående rengøring",
      "Grundig rengøring af fælge",
      "Rens og dækglans",
      "Skånsom aftørring med mikrofiber",
      "Støvsugning af hele kabinen",
      "Indvendig rengøring af alle ruder",
      "Indvendig dampvask af kabinen",
      "Påføring af kvalitetsvoks for ekstra glans og langvarig lakbeskyttelse",
    ],
  },
  {
    navn: "Premium",
    undertitel: "Inklusiv Damp, Voks og Sæderens",
    pris: "799 kr",
    varighed: "60 min.",
    intro:
      "Når kun det bedste er godt nok. Premium Vask er vores mest eksklusive bilplejepakke og er skabt til dig, der ønsker en komplet klargøring med fokus på hver eneste detalje.",
    punkter: [
      "Eksklusiv udvendig håndvask",
      "Dybdegående udvendig dampvask",
      "Professionel voksbehandling for maksimal glans og lakbeskyttelse",
      "Grundig rengøring af fælge og dæk",
      "Støvsugning af hele kabinen – inkl. bagagerum",
      "Indvendig rengøring af alle ruder",
      "Komplet indvendig dampvask af kabinen",
      "Professionel sæderens (stof eller læder)",
      "Rengøring og pleje af instrumentbord, dørpaneler og øvrige plastdetaljer",
      "Luftfrisker for en frisk og behagelig duft",
      "Afsluttende kvalitetskontrol",
    ],
    fremhaevet: true,
  },
];

export default function BilplejePage() {
  const brand = useBrand();
  const bookingUrl = brand.bilplejeUrl;

  return (
    <div className="pb-10 lg:pb-14">
      <Seo
        title="Bilpleje"
        description={`Book bilvask og bilpleje hos ${brand.name}. Vælg mellem Basis, Medium og Premium Vask, og book din tid direkte online.`}
      />

      {/* Hero */}
      <section className="bg-brand-surface-warm/30">
        <div className="container py-10 lg:py-14">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-brand-accent">
              <Droplets className="h-4 w-4" aria-hidden /> Bilpleje
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold text-brand-primary lg:text-4xl">
              Bilpleje hos {brand.name}
            </h1>
            <p className="mt-3 leading-relaxed text-brand-ink/70">
              Vælg mellem tre bilplejepakker, alt efter hvor grundig en behandling din bil skal have. Du
              booker tid direkte i vores bookingsystem, og bilen er klar igen efter cirka 60 minutter.
            </p>
            {bookingUrl && (
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-track="click_bilpleje"
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-accent px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90"
              >
                Book tid nu <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="container">
        {/* Pakker */}
        <section className="mt-10 lg:mt-14">
          <ul className="grid gap-6 lg:grid-cols-3">
            {PAKKER.map((pakke) => (
              <li
                key={pakke.navn}
                className={`flex flex-col rounded-xl bg-white p-6 shadow-sm ring-1 lg:p-7 ${
                  pakke.fremhaevet ? "ring-2 ring-brand-accent" : "ring-brand-ink/5"
                }`}
              >
                {pakke.fremhaevet && (
                  <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-accent/10 px-3 py-1 text-xs font-semibold text-brand-accent">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden /> Mest populære
                  </span>
                )}
                <h2 className="font-display text-xl font-bold text-brand-primary">{pakke.navn}</h2>
                <p className="text-sm font-medium text-brand-ink/60">{pakke.undertitel}</p>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-2xl font-bold text-brand-ink">{pakke.pris}</span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-brand-ink/50">
                  <Clock className="h-3.5 w-3.5" aria-hidden /> {pakke.varighed}
                </p>

                <p className="mt-4 text-sm leading-relaxed text-brand-ink/70">{pakke.intro}</p>

                <ul className="mt-4 flex-1 space-y-2.5">
                  {pakke.punkter.map((punkt) => (
                    <li key={punkt} className="flex items-start gap-2 text-sm text-brand-ink/70">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" aria-hidden />
                      <span>{punkt}</span>
                    </li>
                  ))}
                </ul>

                {bookingUrl && (
                  <a
                    href={bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-track="click_bilpleje"
                    className={`mt-6 inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90 ${
                      pakke.fremhaevet
                        ? "bg-brand-accent text-white"
                        : "bg-brand-surface-warm text-brand-primary"
                    }`}
                  >
                    Vælg {pakke.navn}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Book tid nu – samlet CTA under kortene */}
        {bookingUrl && (
          <section className="mt-10 flex flex-col items-center gap-4 rounded-xl bg-brand-surface-warm/40 p-8 text-center lg:mt-14">
            <h2 className="font-display text-xl font-bold text-brand-primary">Klar til at booke?</h2>
            <p className="max-w-lg text-sm leading-relaxed text-brand-ink/70">
              Vælg den pakke, der passer til din bil, og find en ledig tid i vores online bookingsystem.
            </p>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-track="click_bilpleje"
              className="inline-flex items-center gap-2 rounded-md bg-brand-accent px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
            >
              Book tid nu <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </section>
        )}

        {/* Praktisk info */}
        <section className="mt-10 grid gap-6 border-t border-brand-ink/10 pt-8 sm:grid-cols-2 lg:mt-14">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-accent/10">
              <MapPin className="h-4 w-4 text-brand-accent" aria-hidden />
            </span>
            <div>
              <h3 className="font-semibold text-brand-ink">Hvor foregår det?</h3>
              <p className="mt-0.5 text-sm text-brand-ink/70">{brand.contact.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-accent/10">
              <Clock className="h-4 w-4 text-brand-accent" aria-hidden />
            </span>
            <div>
              <h3 className="font-semibold text-brand-ink">Åbningstider</h3>
              <ul className="mt-0.5 space-y-0.5 text-sm text-brand-ink/70">
                {brand.openingHours.map((row) => (
                  <li key={row.label} className="flex justify-between gap-6">
                    <span>{row.label}</span>
                    <span>{row.hours}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
