import { Clock, Lock, ShieldCheck } from "lucide-react";
import { Seo } from "@/components/seo/Seo";
import { SellCarWizard } from "@/components/sell/SellCarWizard";
import { useBrand } from "@/app/BrandProvider";
import { getBrandMedia } from "@/config/brandMedia";

export default function SellCarPage() {
  const brand = useBrand();
  const media = getBrandMedia(brand.key);
  return (
    <div className="container py-10 lg:py-14">
      <Seo
        title="Sælg din bil"
        description={`Få et uforpligtende tilbud på din bil hos ${brand.name}. Indtast din nummerplade og modtag svar ${brand.leadResponseTime}.`}
      />
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <h1 className="font-display text-3xl font-bold text-brand-primary lg:text-4xl">Sælg din bil</h1>
        <p className="mt-2 text-brand-ink/70">
          Få et uforpligtende tilbud på under 2 minutter – uden annoncer, fremvisninger og usikre købere.
        </p>
        <img
          src={media.sellCarInspection.src}
          width={media.sellCarInspection.width}
          height={media.sellCarInspection.height}
          alt={media.sellCarInspection.alt}
          loading="lazy"
          decoding="async"
          className="mx-auto mt-6 aspect-[4/3] w-full max-w-sm rounded-xl object-cover shadow-sm ring-1 ring-brand-ink/5"
        />
      </div>

      <SellCarWizard />

      <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-brand-ink/60">
        <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-accent" aria-hidden /> 100 % uforpligtende</li>
        <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-brand-accent" aria-hidden /> Svar {brand.leadResponseTime}</li>
        <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-brand-accent" aria-hidden /> Dine oplysninger behandles fortroligt</li>
      </ul>

      <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-brand-ink/50">
        Mangler du en bil, mens handlen falder på plads? Vi samarbejder med{" "}
        <a href="https://one2movebiludlejning.dk/" target="_blank" rel="noopener noreferrer" className="underline">
          One2move Biludlejning
        </a>{" "}
        om erstatningsbiler til fair priser.
      </p>
    </div>
  );
}
