import { Link } from "react-router-dom";
import { ArrowRight, Banknote, Clock, MapPin, ShieldCheck, Wrench } from "lucide-react";
import { Seo } from "@/components/seo/Seo";
import { useBrand } from "@/app/BrandProvider";
import { HeroSection } from "@/components/home/HeroSection";
import { PartnerLogos } from "@/components/home/PartnerLogos";
import { AnimatedCounter } from "@/components/home/AnimatedCounter";
import { FaqAccordion } from "@/components/home/FaqAccordion";
import { TrustpilotReviews } from "@/components/home/TrustpilotReviews";
import { VehicleGrid, VehicleGridSkeleton } from "@/components/vehicles/VehicleGrid";
import { useInventory } from "@/features/vehicles/api";
import { getBrandMedia } from "@/config/brandMedia";

const PROCESS_STEPS = [
  { title: "Indtast nummerplade", text: "Skriv din nummerplade og kilometerstand – vi henter bilens oplysninger automatisk." },
  { title: "Beskriv bilens stand", text: "Svar på et par korte spørgsmål og upload billeder af bilen." },
  { title: "Modtag dit tilbud", text: "Vi vurderer din bil og kontakter dig med et uforpligtende tilbud." },
  { title: "Handl trygt", text: "Accepterer du tilbuddet, klarer vi papirarbejdet og betaler med det samme." },
];

const FAQ_ITEMS = [
  { question: "Hvordan foregår en bilvurdering?", answer: "Du indtaster din nummerplade og kilometerstand, bekræfter bilens oplysninger og fortæller os om dens stand. Herefter kontakter vi dig med et uforpligtende tilbud." },
  { question: "Er tilbuddet bindende?", answer: "Nej, vores tilbud er helt uforpligtende. Du bestemmer selv, om du vil acceptere." },
  { question: "Kan I hjælpe med finansiering?", answer: "Ja, vi samarbejder med finansieringspartnere og finder en løsning, der passer til dig." },
  { question: "Kan jeg bytte min nuværende bil?", answer: "Ja, vi tager gerne din nuværende bil i bytte. Nævn det blot i din henvendelse." },
];

export default function HomePage() {
  const brand = useBrand();
  const media = getBrandMedia(brand.key);
  const inventory = useInventory();
  const available = (inventory.data ?? []).filter((v) => v.status === "published" || v.status === "reserved");
  const latest = available.slice(0, 3);
  const featured = available.filter((v) => v.isFeatured).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: brand.name,
    telephone: brand.contact.phone,
    email: brand.contact.email,
    address: { "@type": "PostalAddress", streetAddress: brand.contact.address },
  };

  return (
    <>
      <Seo jsonLd={jsonLd} image={media.heroDesktop} />
      <HeroSection />
      <PartnerLogos />

      {/* Nøgletal */}
      <section className="border-b border-brand-ink/5 bg-white py-8" aria-label="Nøgletal">
        <div className="container grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-display text-3xl font-bold text-brand-primary">
              <AnimatedCounter value={available.length} />
            </p>
            <p className="mt-1 text-sm text-brand-ink/60">biler på lager</p>
          </div>
          <div>
            <p className="font-display text-3xl font-bold text-brand-primary">
              <AnimatedCounter value={15} />
            </p>
            <p className="mt-1 text-sm text-brand-ink/60">års erfaring</p>
          </div>
          <div>
            <p className="font-display text-3xl font-bold text-brand-primary">100+</p>
            <p className="mt-1 text-sm text-brand-ink/60">tilfredse kunder</p>
          </div>
        </div>
      </section>

      {/* Nyeste biler */}
      <section className="py-14" aria-labelledby="latest-heading">
        <div className="container">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 id="latest-heading" className="font-display text-2xl font-bold text-brand-primary lg:text-3xl">Nyeste biler</h2>
            <Link to="/biler" className="inline-flex items-center gap-1.5 font-medium text-brand-primary hover:underline">
              Se alle biler <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          {inventory.isLoading ? <VehicleGridSkeleton count={3} /> : <VehicleGrid vehicles={latest} />}
        </div>
      </section>

      {/* Fremhævede biler */}
      {featured.length > 0 && (
        <section className="bg-brand-surface-warm/40 py-14" aria-labelledby="featured-heading">
          <div className="container">
            <h2 id="featured-heading" className="mb-6 font-display text-2xl font-bold text-brand-primary lg:text-3xl">
              Udvalgt til dig
            </h2>
            <VehicleGrid vehicles={featured} />
          </div>
        </section>
      )}

      {/* Sådan sælger du din bil */}
      <section className="bg-brand-gradient py-16 text-white" aria-labelledby="process-heading">
        <div className="container">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <h2 id="process-heading" className="font-display text-2xl font-bold lg:text-3xl">Sådan sælger du din bil</h2>
              <p className="mt-2 max-w-xl text-white/70">Fra nummerplade til penge på kontoen – uden annoncer, fremvisninger og usikre købere.</p>
              <Link to="/saelg-din-bil"
                className="mt-6 hidden items-center gap-2 rounded-md bg-white ring-1 ring-brand-primary/20 shadow-sm px-6 py-3 font-bold text-brand-primary transition-transform hover:scale-[1.02] motion-reduce:transform-none lg:inline-flex">
                Start din vurdering <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <img
              src={media.sellCarInspection.src}
              width={media.sellCarInspection.width}
              height={media.sellCarInspection.height}
              alt={media.sellCarInspection.alt}
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] w-full rounded-2xl object-cover ring-1 ring-white/10"
            />
          </div>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((step, i) => (
              <li key={step.title} className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
                <p aria-hidden className="font-display text-3xl font-bold text-brand-accent">{i + 1}</p>
                <h3 className="mt-2 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-white/70">{step.text}</p>
              </li>
            ))}
          </ol>
          <Link to="/saelg-din-bil"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-white ring-1 ring-brand-primary/20 shadow-sm px-6 py-3 font-bold text-brand-primary transition-transform hover:scale-[1.02] motion-reduce:transform-none lg:hidden">
            Start din vurdering <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Fordele */}
      <section className="py-14" aria-labelledby="usp-heading">
        <div className="container">
          <h2 id="usp-heading" className="mb-8 font-display text-2xl font-bold text-brand-primary lg:text-3xl">
            Derfor handler du trygt hos {brand.name}
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: "Tryg handel", text: "Gennemsigtige priser og ordentlige vilkår – ingen skjulte gebyrer." },
              { icon: Wrench, title: "Klargjorte biler", text: "Alle biler er gennemgået og klargjort inden levering." },
              { icon: Banknote, title: "Fair priser", text: "Ærlig prissætning uden overraskelser – det du ser, er det du betaler." },
              { icon: Clock, title: "Hurtigt svar", text: `Vi svarer på henvendelser ${brand.leadResponseTime}.` },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
                <Icon className="h-8 w-8 text-brand-accent" aria-hidden />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-brand-ink/70">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <TrustpilotReviews />

      {/* Om + lokation */}
      <section className="bg-brand-gradient py-14 text-white" aria-labelledby="about-heading">
        <div className="container grid gap-8 lg:grid-cols-2">
          <div>
            <h2 id="about-heading" className="font-display text-2xl font-bold lg:text-3xl">Om {brand.name}</h2>
            <p className="mt-3 leading-relaxed text-white/75">
              Hos {brand.name} handler det om én ting: tryghed – uanset om du skal købe, sælge eller have bilen
              til service. Vi er både bilforhandler og værksted under samme tag, med gennemgåede og klargjorte
              biler, gennemsigtige priser og et erfarent værksted, der holder din bil kørende i mange år. Du
              får altid et ærligt svar, også når det ikke er det, du havde håbet på. Mere end 100 kunder har
              allerede handlet trygt hos os, og vi vil hellere have en god oplevelse, du fortæller videre om,
              end en hurtig handel, du fortryder.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/om-os" className="rounded-md border border-white/30 px-5 py-2.5 font-medium hover:bg-white/10">
                Læs mere om os
              </Link>
              <Link to="/kontakt" className="rounded-md bg-white ring-1 ring-brand-primary/20 shadow-sm px-5 py-2.5 font-semibold text-brand-primary">
                Kontakt os
              </Link>
            </div>
          </div>
          <div className="rounded-xl bg-white/5 p-6 ring-1 ring-white/10">
            <h3 className="flex items-center gap-2 font-display text-lg font-bold">
              <MapPin className="h-5 w-5 text-brand-accent" aria-hidden /> Find os
            </h3>
            <p className="mt-2 text-white/75">{brand.contact.address}</p>
            <ul className="mt-4 space-y-1 text-sm text-white/75">
              {brand.openingHours.map((row) => (
                <li key={row.label} className="flex justify-between gap-6">
                  <span>{row.label}</span>
                  <span>{row.hours}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 overflow-hidden rounded-lg ring-1 ring-white/10">
              <iframe
                title={`Kort over ${brand.name}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(brand.contact.address)}&output=embed`}
                width="100%"
                height="220"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14" aria-labelledby="faq-heading">
        <div className="container max-w-3xl">
          <h2 id="faq-heading" className="mb-6 font-display text-2xl font-bold text-brand-primary lg:text-3xl">
            Ofte stillede spørgsmål
          </h2>
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>
    </>
  );
}
