import { Link } from "react-router-dom";
import { BadgeCheck, Banknote, FileText, HandCoins, ShieldCheck, Umbrella } from "lucide-react";
import { Seo } from "@/components/seo/Seo";
import { useBrand } from "@/app/BrandProvider";
import { ContactForm } from "@/components/shared/ContactForm";
import { getBrandMedia } from "@/config/brandMedia";

export default function FinancingPage() {
  const brand = useBrand();
  const media = getBrandMedia(brand.key);
  return (
    <div className="container py-10 lg:py-14">
      <Seo title="Finansiering" description={`Fleksibel bilfinansiering hos ${brand.name}. Få svar på din ansøgning – ofte samme dag.`} />
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-primary lg:text-4xl">Finansiering</h1>
          <p className="mt-3 leading-relaxed text-brand-ink/70">
            Hos {brand.name} hjælper vi dig med at finde en finansieringsløsning, der passer til din økonomi.
            Vi samarbejder med anerkendte finansieringspartnere og klarer papirarbejdet for dig – ofte med svar samme dag.
          </p>
        </div>
        <img
          src={media.financeConsultation.src}
          width={media.financeConsultation.width}
          height={media.financeConsultation.height}
          alt={media.financeConsultation.alt}
          loading="lazy"
          decoding="async"
          className="aspect-[4/3] w-full rounded-2xl object-cover shadow-sm ring-1 ring-brand-ink/5"
        />
      </div>

      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: HandCoins, title: "Lav udbetaling", text: "Kom afsted med en udbetaling, der passer til dig." },
          { icon: BadgeCheck, title: "Hurtigt svar", text: "Vi indhenter tilbud og vender hurtigt tilbage." },
          { icon: Banknote, title: "Byt din bil ind", text: "Brug din nuværende bil som hel eller delvis udbetaling." },
          { icon: FileText, title: "Vi klarer papirerne", text: "Registrering, forsikring og finansiering – ét samlet sted." },
        ].map(({ icon: Icon, title, text }) => (
          <li key={title} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
            <Icon className="h-7 w-7 text-brand-accent" aria-hidden />
            <h2 className="mt-3 font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-brand-ink/70">{text}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <Link
          to="/garanti"
          className="flex items-start gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5 transition-colors hover:ring-brand-primary/30"
        >
          <ShieldCheck className="h-7 w-7 shrink-0 text-brand-accent" aria-hidden />
          <span>
            <span className="block font-semibold text-brand-primary">Bilgaranti via AutoConcept</span>
            <span className="mt-1 block text-sm text-brand-ink/70">
              Vi samarbejder med AutoConcept om garantier på vores brugte biler, så du er dækket mod
              uventede reparationsudgifter efter købet. Læs mere om garantien.
            </span>
          </span>
        </Link>
        <a
          href="https://www.if.dk/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5 transition-colors hover:ring-brand-primary/30"
        >
          <Umbrella className="h-7 w-7 shrink-0 text-brand-accent" aria-hidden />
          <span>
            <span className="block font-semibold text-brand-primary">Bilforsikring via If</span>
            <span className="mt-1 block text-sm text-brand-ink/70">
              Vi hjælper dig med at få din nye bil forsikret gennem If, så den er dækket, allerede når du
              kører den ud fra pladsen.
            </span>
          </span>
        </a>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-brand-ink/5 lg:p-8">
          <h2 className="mb-5 font-display text-xl font-bold text-brand-primary">Forespørg om finansiering</h2>
          <ContactForm inquiryType="finance" />
        </div>
        <div className="text-sm leading-relaxed text-brand-ink/60">
          <h2 className="font-display text-lg font-bold text-brand-primary">Vigtigt om finansiering</h2>
          <p className="mt-3">
            Alle finansieringseksempler på denne hjemmeside er vejledende. Endelige vilkår afhænger af
            kreditgodkendelse hos finansieringsselskabet. [FINANSIERINGSPARTNER OG LOVPLIGTIGE
            KREDITOPLYSNINGER INDSÆTTES HER – kræver aftale med finansieringspartner.]
          </p>
          <p className="mt-3">
            Se de fulde <Link to="/finansieringsforbehold" className="underline">finansieringsforbehold</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
