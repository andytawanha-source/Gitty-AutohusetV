import { CalendarClock, Gauge, ShieldCheck, Sparkles, Wrench, Clock } from "lucide-react";
import { Seo } from "@/components/seo/Seo";
import { useBrand } from "@/app/BrandProvider";
import { BookingForm } from "@/components/workshop/BookingForm";

const SERVICES = [
  {
    icon: Gauge,
    title: "Serviceeftersyn",
    text: "Periodisk serviceeftersyn efter fabrikkens anvisninger, så bilen holder længere og bevarer sin værdi.",
  },
  {
    icon: Sparkles,
    title: "Olieskift",
    text: "Skift af olie og filter med de rigtige produkter til netop din bilmodel.",
  },
  {
    icon: Wrench,
    title: "Dækskift og dækhotel",
    text: "Sæson-dækskift, montering og opbevaring, så du altid kører på det rigtige sæt.",
  },
  {
    icon: ShieldCheck,
    title: "Bremser",
    text: "Kontrol og udskiftning af bremseklodser og -skiver – en af de vigtigste sikkerhedskomponenter i bilen.",
  },
  {
    icon: CalendarClock,
    title: "Klargøring til syn",
    text: "Gennemgang og udbedring af de typiske synsfejl, så du kommer sikkert igennem synet første gang.",
  },
  {
    icon: Clock,
    title: "Reparation og garantiarbejde",
    text: "Fejlfinding og reparation af mekaniske og elektriske problemer, herunder garantisager i samarbejde med AutoConcept.",
  },
];

export default function WorkshopPage() {
  const brand = useBrand();
  return (
    <div className="container py-10 lg:py-14">
      <Seo
        title="Værksted og Service"
        description={`Book en tid i værkstedet hos ${brand.name}. Serviceeftersyn, dækskift, bremser, klargøring til syn og reparationer – udført af fagfolk.`}
      />

      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-brand-primary lg:text-4xl">Værksted og Service</h1>
        <p className="mt-3 leading-relaxed text-brand-ink/70">
          Hos {brand.name} er værkstedet en naturlig del af at eje bil – ikke kun når du køber den hos os.
          Vores mekanikere klarer alt fra almindeligt serviceeftersyn og dækskift til bremser, klargøring til
          syn og større reparationer. Book en tid herunder, så finder vi et tidspunkt der passer dig.
        </p>
      </div>

      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
            <Icon className="h-7 w-7 text-brand-accent" aria-hidden />
            <h2 className="mt-3 font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-brand-ink/70">{text}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 rounded-xl bg-brand-surface-warm/40 p-6 lg:p-8">
        <h2 className="font-display text-xl font-bold text-brand-primary">Hvorfor servicere bilen hos os?</h2>
        <div className="mt-4 grid gap-6 text-sm leading-relaxed text-brand-ink/70 sm:grid-cols-2">
          <div>
            <h3 className="font-semibold text-brand-ink">Erfarne mekanikere</h3>
            <p className="mt-1">
              Vores værksted udfører service og reparationer efter fabrikkens forskrifter, uanset bilens
              mærke, så du kan køre trygt videre – og bevare bilens historik og garanti.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-brand-ink">Gennemsigtig pris</h3>
            <p className="mt-1">
              Du får altid et estimat, før vi går i gang, og vi kontakter dig, hvis der undervejs viser sig
              behov for yderligere arbejde.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-brand-ink">Klar til syn</h3>
            <p className="mt-1">
              Vi tjekker de typiske synspunkter – lygter, bremser, undervogn og dæk – og udbedrer fejl, så du
              kommer sikkert igennem synet.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-brand-ink">Garantiarbejde</h3>
            <p className="mt-1">
              Har du garanti gennem AutoConcept på en bil købt hos os, hjælper vi med sagsbehandlingen og
              udfører det godkendte reparationsarbejde direkte i vores værksted.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="mb-5 font-display text-xl font-bold text-brand-primary">Book en tid</h2>
          <BookingForm />
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-brand-ink/5 lg:p-8">
          <h2 className="font-display text-lg font-bold text-brand-primary">Praktisk information</h2>
          <ul className="mt-4 space-y-3 text-sm text-brand-ink/70">
            <li>Vi booker tider mandag–fredag i tidsrummet 09:00–17:30.</li>
            <li>Du kan booke op til 14 dage frem – vi holder lukket i weekenden.</li>
            <li>Du får en bekræftelse på e-mail, når vi har godkendt tiden.</li>
            <li>Aflever gerne nøglerne dagen før, hvis du ikke selv kan møde op.</li>
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
      </div>
    </div>
  );
}
