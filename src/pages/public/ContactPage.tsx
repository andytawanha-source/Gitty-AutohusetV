import { Mail, MapPin, Phone } from "lucide-react";
import { Seo } from "@/components/seo/Seo";
import { useBrand } from "@/app/BrandProvider";
import { ContactForm } from "@/components/shared/ContactForm";
import { track } from "@/features/tracking/track";

export default function ContactPage() {
  const brand = useBrand();
  return (
    <div className="container py-10 lg:py-14">
      <Seo title="Kontakt" description={`Kontakt ${brand.name} – ring, skriv eller besøg os.`} />
      <h1 className="font-display text-3xl font-bold text-brand-primary lg:text-4xl">Kontakt os</h1>
      <p className="mt-2 max-w-xl text-brand-ink/70">
        Du er altid velkommen til at ringe, skrive eller kigge forbi. Formularen er blot én af mulighederne.
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[400px_1fr]">
        <div className="space-y-4">
          <a href={`tel:${brand.contact.phone}`} onClick={() => track("click_phone")}
            className="flex items-center gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5 transition-colors hover:ring-brand-accent">
            <Phone className="h-6 w-6 shrink-0 text-brand-accent" aria-hidden />
            <div>
              <p className="text-sm text-brand-ink/60">Ring til os</p>
              <p className="font-semibold">{brand.contact.phone}</p>
            </div>
          </a>
          <a href={`mailto:${brand.contact.email}`} onClick={() => track("click_email")}
            className="flex items-center gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5 transition-colors hover:ring-brand-accent">
            <Mail className="h-6 w-6 shrink-0 text-brand-accent" aria-hidden />
            <div>
              <p className="text-sm text-brand-ink/60">Skriv til os</p>
              <p className="font-semibold">{brand.contact.email}</p>
            </div>
          </a>
          <div className="flex items-start gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
            <MapPin className="h-6 w-6 shrink-0 text-brand-accent" aria-hidden />
            <div>
              <p className="text-sm text-brand-ink/60">Besøg os</p>
              <p className="font-semibold">{brand.contact.address}</p>
              <ul className="mt-3 space-y-1 text-sm text-brand-ink/70">
                {brand.openingHours.map((row) => (
                  <li key={row.label} className="flex justify-between gap-6">
                    <span>{row.label}</span>
                    <span>{row.hours}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-sm text-brand-ink/60">
            {brand.contact.legalName} · CVR: {brand.contact.cvr}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-brand-ink/5 lg:p-8">
          <h2 className="mb-5 font-display text-xl font-bold text-brand-primary">Send os en besked</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
