import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { useBrand } from "@/app/BrandProvider";
import { Logo } from "./Logo";

const LEGAL_LINKS = [
  { to: "/privatlivspolitik", label: "Privatlivspolitik" },
  { to: "/cookiepolitik", label: "Cookiepolitik" },
  { to: "/cookieindstillinger", label: "Cookieindstillinger" },
  { to: "/handelsbetingelser", label: "Handelsbetingelser" },
  { to: "/vilkaar-bilvurdering", label: "Vilkår for bilvurdering" },
  { to: "/juridiske-forbehold", label: "Juridiske forbehold" },
  { to: "/finansieringsforbehold", label: "Finansieringsforbehold" },
  { to: "/klagevejledning", label: "Klagevejledning" },
];

const NAV_LINKS = [
  { to: "/biler", label: "Biler" },
  { to: "/saelg-din-bil", label: "Sælg din bil" },
  { to: "/biludlejning", label: "Biludlejning" },
  { to: "/om-os", label: "Om os" },
  { to: "/kontakt", label: "Kontakt" },
];

export function SiteFooter() {
  const brand = useBrand();

  return (
    <footer className="bg-brand-gradient text-white">
      <div className="container grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo className="text-white" />
          <address className="mt-3 space-y-2 text-sm not-italic text-white/80">
            <p>{brand.contact.legalName}</p>
            <p>CVR: {brand.contact.cvr}</p>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {brand.contact.address}
            </p>
            <p>
              <a href={`tel:${brand.contact.phone}`} className="flex items-center gap-2 hover:text-brand-accent" data-track="click_phone">
                <Phone className="h-4 w-4" aria-hidden /> {brand.contact.phone}
              </a>
            </p>
            <p>
              <a href={`mailto:${brand.contact.email}`} className="flex items-center gap-2 hover:text-brand-accent" data-track="click_email">
                <Mail className="h-4 w-4" aria-hidden /> {brand.contact.email}
              </a>
            </p>
          </address>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">Åbningstider</h2>
          <ul className="mt-3 space-y-1 text-sm text-white/80">
            {brand.openingHours.map((row) => (
              <li key={row.label} className="flex justify-between gap-4">
                <span>{row.label}</span>
                <span>{row.hours}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-3">
            {brand.social.facebook && (
              <a href={brand.social.facebook} aria-label="Facebook" className="rounded-md p-2 hover:bg-white/10">
                <Facebook className="h-5 w-5" aria-hidden />
              </a>
            )}
            {brand.social.instagram && (
              <a href={brand.social.instagram} aria-label="Instagram" className="rounded-md p-2 hover:bg-white/10">
                <Instagram className="h-5 w-5" aria-hidden />
              </a>
            )}
          </div>
        </div>

        <nav aria-label="Footer-navigation">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">Genveje</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-white/80 hover:text-brand-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Juridisk navigation">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">Juridisk</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {LEGAL_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-white/80 hover:text-brand-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-2 py-4 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.contact.legalName}. Alle rettigheder forbeholdes.
          </p>
          <p>
            Priser og finansieringseksempler er vejledende og med forbehold for fejl. Se{" "}
            <Link to="/finansieringsforbehold" className="underline hover:text-brand-accent">
              finansieringsforbehold
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
