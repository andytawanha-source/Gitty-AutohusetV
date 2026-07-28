import { ShieldCheck, Wrench, Clock, FileCheck } from "lucide-react";
import { Seo } from "@/components/seo/Seo";
import { useBrand } from "@/app/BrandProvider";
import { ContactForm } from "@/components/shared/ContactForm";

export default function GarantiPage() {
  const brand = useBrand();
  return (
    <div className="container py-10 lg:py-14">
      <Seo
        title="Garanti"
        description={`Bilgaranti hos ${brand.name} gennem vores samarbejdspartner AutoConcept – tryghed efter du har købt bilen.`}
      />
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-brand-primary lg:text-4xl">Garanti</h1>
        <p className="mt-3 leading-relaxed text-brand-ink/70">
          Hos {brand.name} samarbejder vi med AutoConcept om bilgaranti på vores brugte biler, så du står
          bedre stillet, hvis der opstår en mekanisk eller elektrisk fejl efter dit køb.
        </p>
      </div>

      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Wrench, title: "Mekanisk/elektrisk dækning", text: "Garantien dækker centrale komponenter som motor, gearkasse og elektronik." },
          { icon: Clock, title: "Gælder fra overtagelsen", text: "Garantiperioden starter, den dag du overtager bilen." },
          { icon: FileCheck, title: "Nem sagsbehandling", text: "AutoConcept står for sagsbehandlingen, hvis uheldet er ude." },
          { icon: ShieldCheck, title: "Tryghed efter købet", text: "Du får ro i maven, uden at det koster en formue." },
        ].map(({ icon: Icon, title, text }) => (
          <li key={title} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
            <Icon className="h-7 w-7 text-brand-accent" aria-hidden />
            <h2 className="mt-3 font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-brand-ink/70">{text}</p>
          </li>
        ))}
      </ul>

      <a
        href="https://www.autoconcept.dk/home"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 flex items-start gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5 transition-colors hover:ring-brand-primary/30"
      >
        <ShieldCheck className="h-7 w-7 shrink-0 text-brand-accent" aria-hidden />
        <span>
          <span className="block font-semibold text-brand-primary">Garanti via AutoConcept</span>
          <span className="mt-1 block text-sm text-brand-ink/70">
            Læs mere om garantiens præcise omfang, varighed og betingelser på AutoConcepts egen hjemmeside.
          </span>
        </span>
      </a>

      <div className="mt-10 rounded-xl bg-brand-surface-warm/40 p-6 lg:p-8">
        <h2 className="font-display text-xl font-bold text-brand-primary">Sådan fungerer garantien</h2>
        <div className="mt-4 grid gap-6 text-sm leading-relaxed text-brand-ink/70 sm:grid-cols-2">
          <div>
            <h3 className="font-semibold text-brand-ink">Hvad dækker garantien typisk?</h3>
            <p className="mt-1">
              Garantien er en mekanisk/elektronisk garanti, der som udgangspunkt dækker uforudsete fejl på
              centrale komponenter som motor, gearkasse, styretøj og el-system i garantiperioden – forudsat
              at bilen er serviceret efter fabrikkens anvisninger.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-brand-ink">Hvad dækker garantien typisk ikke?</h3>
            <p className="mt-1">
              Sliddele (f.eks. bremser, dæk, kobling), skader fra forkert brug eller manglende
              vedligeholdelse, samt fejl der var kendte eller synlige ved købet, er normalt undtaget. De
              præcise undtagelser fremgår af garantibeviset.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-brand-ink">Varighed og omfang</h3>
            <p className="mt-1">
              Varighed og dækningsgrad varierer efter bilens alder og kilometertal, og aftales konkret ved
              købet. Du får et garantibevis med den præcise periode og dækning for netop din bil.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-brand-ink">Sådan bruger du garantien</h3>
            <p className="mt-1">
              Opstår der en fejl, kontakter du enten os eller AutoConcept direkte, hvorefter sagen
              behandles og et autoriseret værksted udbedrer fejlen i henhold til garantibetingelserne.
            </p>
          </div>
        </div>
        <p className="mt-5 text-xs text-brand-ink/50">
          Ovenstående er en generel beskrivelse af, hvordan denne type garanti typisk fungerer. Det er
          altid de fulde vilkår og betingelser fra AutoConcept, der er gældende – se dem på{" "}
          <a href="https://www.autoconcept.dk/home" target="_blank" rel="noopener noreferrer" className="underline">
            autoconcept.dk
          </a>{" "}
          eller på dit garantibevis.
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-brand-ink/5 lg:p-8">
          <h2 className="mb-5 font-display text-xl font-bold text-brand-primary">Spørgsmål om garanti</h2>
          <ContactForm inquiryType="contact" />
        </div>
        <div className="text-sm leading-relaxed text-brand-ink/60">
          <h2 className="font-display text-lg font-bold text-brand-primary">Vigtigt om garantien</h2>
          <p className="mt-3">
            Garantien stilles af AutoConcept, og de nøjagtige dækningsvilkår, undtagelser og varighed
            fremgår af garantibeviset, du modtager ved købet. Kontakt os, hvis du er i tvivl om, hvad der er
            dækket på en konkret bil.
          </p>
        </div>
      </div>
    </div>
  );
}
