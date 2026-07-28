import { useState } from "react";
import {
  Award,
  CalendarClock,
  CalendarCheck,
  Car,
  Clock,
  Gauge,
  Handshake,
  Info,
  Mail,
  Settings,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Seo } from "@/components/seo/Seo";
import { useBrand } from "@/app/BrandProvider";
import { BookingForm } from "@/components/workshop/BookingForm";
import { getBrandMedia } from "@/config/brandMedia";

const SERVICES = [
  {
    icon: Gauge,
    title: "Serviceeftersyn",
    text: "Periodisk serviceeftersyn efter fabrikkens anvisninger, så bilen holder længere og bevarer sin værdi.",
    serviceType: "Serviceeftersyn",
    serviceKey: "serviceeftersyn" as const,
  },
  {
    icon: Sparkles,
    title: "Olieskift",
    text: "Skift af olie og filter med de rigtige produkter til netop din bilmodel.",
    serviceType: "Serviceeftersyn",
    serviceKey: "olieskift" as const,
  },
  {
    icon: Wrench,
    title: "Dækskift og dækhotel",
    text: "Sæson-dækskift, montering og opbevaring, så du altid kører på det rigtige sæt.",
    serviceType: "Dækskift",
    serviceKey: "daekskift" as const,
  },
  {
    icon: ShieldCheck,
    title: "Bremser",
    text: "Kontrol og udskiftning af bremseklodser og -skiver – en af de vigtigste sikkerhedskomponenter i bilen.",
    serviceType: "Bremser",
    serviceKey: "bremser" as const,
  },
  {
    icon: CalendarClock,
    title: "Klargøring til syn",
    text: "Gennemgang og udbedring af de typiske synsfejl, så du kommer sikkert igennem synet første gang.",
    serviceType: "Klargøring til syn",
    serviceKey: "klargoeringTilSyn" as const,
  },
  {
    icon: Clock,
    title: "Reparation og garantiarbejde",
    text: "Fejlfinding og reparation af mekaniske og elektriske problemer, herunder garantisager i samarbejde med AutoConcept.",
    serviceType: "Reparation",
    serviceKey: "reparation" as const,
  },
];

const WHY_US = [
  {
    icon: ShieldCheck,
    title: "Erfarne mekanikere",
    text: "Specialister med stor erfaring og løbende efteruddannelse.",
  },
  {
    icon: Award,
    title: "Gennemsigtig pris",
    text: "Du får altid et estimat, før vi går i gang – ingen overraskelser.",
  },
  {
    icon: Handshake,
    title: "Garanti på arbejdet",
    text: "Vi bruger kvalitetsdele og giver garanti på vores arbejde.",
  },
  {
    icon: Clock,
    title: "Hurtig og fleksibel service",
    text: "Vi tilpasser os din hverdag og hjælper dig hurtigt videre.",
  },
];

const TRUST_STRIP = [
  {
    icon: Settings,
    title: "Moderne udstyr",
    text: "Vi investerer i den nyeste teknologi til din bil.",
  },
  {
    icon: Sparkles,
    title: "Originale eller OEM-dele",
    text: "Kvalitetsdele der matcher fabrikstandarder.",
  },
  {
    icon: Car,
    title: "Alle bilmærker",
    text: "Vi servicerer alle mærker og modeller.",
  },
  {
    icon: ShieldCheck,
    title: "Kundetilfredshed i fokus",
    text: "Din tilfredshed er vores største drivkraft.",
  },
];

const PRACTICAL_INFO = [
  { icon: CalendarCheck, text: "Vi booker tider mandag–fredag i tidsrummet 09:00–17:30." },
  { icon: Clock, text: "Du kan booke op til 14 dage frem – vi holder lukket i weekenden." },
  { icon: Mail, text: "Du får en bekræftelse på e-mail, når vi har godkendt tiden." },
  { icon: Info, text: "Aflever gerne nøglerne dagen før, hvis du ikke selv kan møde op." },
];

export default function WorkshopPage() {
  const brand = useBrand();
  const media = getBrandMedia(brand.key);
  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);

  function startBooking(serviceType?: string) {
    if (serviceType) setSelectedService(serviceType);
    document.getElementById("book-nu")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="pb-10 lg:pb-14">
      <Seo
        title="Værksted og Service"
        description={`Book en tid i værkstedet hos ${brand.name}. Serviceeftersyn, dækskift, bremser, klargøring til syn og reparationer – udført af fagfolk.`}
      />

      {/* Hero */}
      <section className="bg-brand-surface-warm/30">
        <div className="container grid items-center gap-8 py-10 lg:grid-cols-[1.1fr_1fr] lg:py-14">
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-primary lg:text-4xl">Værksted og Service</h1>
            <p className="mt-3 text-lg font-medium text-brand-ink/80">
              Kvalitet, tryghed og personlig service – så din bil kører sikkert i mange år.
            </p>
            <p className="mt-3 leading-relaxed text-brand-ink/70">
              Vores mekanikere klarer alt fra almindeligt serviceeftersyn og dækskift til bremser, klargøring
              til syn og større reparationer. Book en tid herunder, så finder vi et tidspunkt der passer dig.
            </p>
            <button
              type="button"
              onClick={() => startBooking()}
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-accent px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90"
            >
              Book tid nu <ArrowIcon />
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl shadow-sm">
            <img
              src={media.workshop.src}
              alt={media.workshop.alt}
              width={media.workshop.width}
              height={media.workshop.height}
              className="aspect-[4/3] w-full object-cover lg:aspect-[5/4]"
              loading="eager"
            />
          </div>
        </div>
      </section>

      <div className="container">
        {/* Vælg ydelse */}
        <section className="mt-10 lg:mt-14">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-brand-accent">
            <Sparkles className="h-4 w-4" aria-hidden /> Vælg en ydelse for at starte booking
          </p>
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map(({ icon: Icon, title, text, serviceType, serviceKey }) => {
              const cardImage = media.workshopServices[serviceKey];
              return (
                <li key={title} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-brand-ink/5">
                  <button
                    type="button"
                    onClick={() => startBooking(serviceType)}
                    className="group flex w-full items-stretch text-left transition-colors hover:bg-brand-surface-warm/20"
                  >
                    <div className="flex flex-1 flex-col p-5">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-accent/10">
                        <Icon className="h-5 w-5 text-brand-accent" aria-hidden />
                      </span>
                      <h2 className="mt-3 font-semibold text-brand-ink">{title}</h2>
                      <p className="mt-1 flex-1 text-sm text-brand-ink/70">{text}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 border-t border-brand-ink/10 pt-3 text-sm font-semibold text-brand-primary group-hover:text-brand-accent">
                        Start booking <ArrowIcon />
                      </span>
                    </div>
                    <div className="w-2/5 shrink-0">
                      <img
                        src={cardImage.src}
                        alt={cardImage.alt}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Hvorfor vælge os */}
        <section className="mt-10 rounded-xl bg-brand-surface-warm/40 p-6 lg:mt-14 lg:p-8">
          <h2 className="font-display text-xl font-bold text-brand-primary">Hvorfor vælge vores værksted?</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_US.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <Icon className="h-6 w-6 text-brand-accent" aria-hidden />
                <h3 className="mt-2.5 font-semibold text-brand-ink">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-brand-ink/70">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Booking + praktisk info */}
        <section id="book-nu" className="mt-10 grid scroll-mt-20 gap-8 lg:mt-14 lg:grid-cols-[1.2fr_1fr]">
          <BookingForm initialServiceType={selectedService} />
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-brand-ink/5 lg:p-8">
            <h2 className="font-display text-lg font-bold text-brand-primary">Praktisk information</h2>
            <ul className="mt-4 space-y-3 text-sm text-brand-ink/70">
              {PRACTICAL_INFO.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" aria-hidden />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-brand-ink/10 pt-4 text-sm text-brand-ink/60">
              <p className="font-semibold text-brand-ink">Åbningstider</p>
              <ul className="mt-2 space-y-1">
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

        {/* Trust strip */}
        <section className="mt-10 grid gap-6 border-t border-brand-ink/10 pt-8 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
          {TRUST_STRIP.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-accent/10">
                <Icon className="h-4 w-4 text-brand-accent" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold text-brand-ink">{title}</h3>
                <p className="mt-0.5 text-sm text-brand-ink/70">{text}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
