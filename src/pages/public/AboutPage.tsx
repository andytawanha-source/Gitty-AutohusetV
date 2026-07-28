import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Seo } from "@/components/seo/Seo";
import { useBrand } from "@/app/BrandProvider";
import { getBrandMedia } from "@/config/brandMedia";

export default function AboutPage() {
  const brand = useBrand();
  const media = getBrandMedia(brand.key);
  return (
    <div className="container py-10 lg:py-14">
      <Seo title="Om os" description={`Lær ${brand.name} at kende – historie, værdier og team.`} />
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-brand-primary lg:text-4xl">Om {brand.name}</h1>
        <div className="mt-4 space-y-4 leading-relaxed text-brand-ink/75">
          <p>
            {brand.name} blev grundlagt i 2024 med en enkel ambition: at gøre bilhandel til noget, man kan
            være tryg ved. Vi ved, at et bilkøb er en af de største beslutninger i hverdagen – og at alt for
            mange har prøvet at stå med en dårlig mavefornemmelse på en bilplads. Det ville vi lave om på.
            I dag har mere end 100 kunder handlet hos os, og langt de fleste kommer fra anbefalinger.
          </p>
          <p>
            Vores tilgang er ligetil: gennemsigtige priser uden skjulte gebyrer, ærlige svar om bilens stand
            og historik, og et uforpligtende tilbud, du kan tage med dig uden pres. Uanset om du køber,
            sælger eller bytter din bil, får du samme åbenhed – og vi svarer altid hurtigt, så du ikke går
            og venter i uvished.
          </p>
          <p>
            Hver eneste bil på vores plads er gennemgået og klargjort, før den bliver sat til salg. Vi
            kontrollerer teknik, service og stand, så du ved præcis, hvad du køber – og vi hjælper dig hele
            vejen med finansiering, indregistrering og papirarbejde, samlet ét sted på Islevsdalsvej i Rødovre.
          </p>
        </div>
      </div>

      <figure className="mt-8">
        <img
          src={media.showroom.src}
          width={media.showroom.width}
          height={media.showroom.height}
          alt={media.showroom.alt}
          loading="lazy"
          decoding="async"
          className="aspect-[3/2] w-full rounded-2xl object-cover shadow-sm ring-1 ring-brand-ink/5"
        />
        <figcaption className="mt-2 text-xs text-brand-ink/40">Illustrativt foto</figcaption>
      </figure>

      <figure className="mx-auto mt-8 max-w-3xl">
        <img
          src={media.workshop.src}
          width={media.workshop.width}
          height={media.workshop.height}
          alt={media.workshop.alt}
          loading="lazy"
          decoding="async"
          className="aspect-square w-full max-w-sm rounded-2xl object-cover shadow-sm ring-1 ring-brand-ink/5 sm:mx-0"
        />
        <figcaption className="mt-2 text-xs text-brand-ink/40">Illustrativt foto af klargøring</figcaption>
      </figure>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-brand-ink/5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-brand-primary">
            <MapPin className="h-5 w-5 text-brand-accent" aria-hidden /> Her finder du os
          </h2>
          <p className="mt-2 text-brand-ink/75">{brand.contact.address}</p>
          <ul className="mt-4 space-y-1 text-sm text-brand-ink/70">
            {brand.openingHours.map((row) => (
              <li key={row.label} className="flex justify-between gap-6">
                <span>{row.label}</span>
                <span>{row.hours}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col justify-center rounded-xl bg-brand-gradient p-6 text-white">
          <h2 className="font-display text-lg font-bold">Skal vi hjælpe dig videre?</h2>
          <p className="mt-2 text-white/75">Find din næste bil, eller få et uforpligtende tilbud på din nuværende.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/biler" className="rounded-md border border-white/30 px-5 py-2.5 font-medium hover:bg-white/10">Se biler til salg</Link>
            <Link to="/saelg-din-bil" className="rounded-md bg-white ring-1 ring-brand-primary/20 shadow-sm px-5 py-2.5 font-semibold text-brand-primary">Sælg din bil</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
