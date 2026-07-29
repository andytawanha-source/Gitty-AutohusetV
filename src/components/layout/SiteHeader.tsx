import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ExternalLink, Menu, Phone, X } from "lucide-react";
import { useBrand } from "@/app/BrandProvider";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

type NavItem =
  | { kind: "internal"; to: string; label: string; end?: boolean }
  | { kind: "external"; href: string; label: string };

const BASE_NAV_ITEMS: NavItem[] = [
  { kind: "internal", to: "/", label: "Forside", end: true },
  { kind: "internal", to: "/biler", label: "Biler til salg" },
  { kind: "internal", to: "/saelg-din-bil", label: "Sælg din bil" },
  { kind: "internal", to: "/garanti", label: "Garanti" },
  { kind: "internal", to: "/vaerksted", label: "Værksted og Service" },
  { kind: "internal", to: "/biludlejning", label: "Biludlejning" },
  { kind: "internal", to: "/om-os", label: "Om os" },
  { kind: "internal", to: "/kontakt", label: "Kontakt" },
];

export function SiteHeader() {
  const brand = useBrand();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Bilpleje-booking (Planway) er kun relevant for brands, der har en bilplejeUrl
  // sat i deres brandkonfiguration – linket indsættes efter "Værksted og Service".
  const navItems = useMemo<NavItem[]>(() => {
    if (!brand.bilplejeUrl) return BASE_NAV_ITEMS;
    const items = [...BASE_NAV_ITEMS];
    const workshopIndex = items.findIndex((item) => item.kind === "internal" && item.to === "/vaerksted");
    const bilplejeItem: NavItem = { kind: "external", href: brand.bilplejeUrl, label: "Bilpleje" };
    items.splice(workshopIndex + 1, 0, bilplejeItem);
    return items;
  }, [brand.bilplejeUrl]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Luk mobilmenu ved navigation
  useEffect(() => {
    if (!mobileOpen) return;
    const close = () => setMobileOpen(false);
    window.addEventListener("popstate", close);
    return () => window.removeEventListener("popstate", close);
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-brand-gradient text-white transition-shadow",
        scrolled && "shadow-lg"
      )}
    >
      <div className="container flex h-16 flex-nowrap items-center justify-between gap-3">
        <Link to="/" className="shrink-0" aria-label={`${brand.name} – forside`}>
          <Logo />
        </Link>

        <nav aria-label="Hovednavigation" className="hidden min-w-0 items-center gap-0.5 xl:flex">
          {navItems.map((item) =>
            item.kind === "internal" ? (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap rounded-md px-2.5 py-2 text-[0.8125rem] font-medium leading-none transition-colors hover:bg-white/10",
                    isActive && "bg-white/15 text-brand-accent"
                  )
                }
              >
                {item.label}
              </NavLink>
            ) : (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                data-track="click_bilpleje"
                className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-2 text-[0.8125rem] font-medium leading-none transition-colors hover:bg-white/10"
              >
                {item.label}
                <ExternalLink className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              </a>
            )
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={`tel:${brand.contact.phone}`}
            className="hidden items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-2 text-sm font-medium hover:bg-white/10 md:flex"
            data-track="click_phone"
          >
            <Phone className="h-4 w-4 shrink-0" aria-hidden />
            {brand.contact.phone}
          </a>
          <Link
            to="/saelg-din-bil"
            className="hidden whitespace-nowrap rounded-md bg-white ring-1 ring-brand-primary/20 shadow-sm px-4 py-2 text-sm font-semibold text-brand-primary transition-transform hover:scale-[1.03] md:block"
          >
            Sælg din bil
          </Link>
          <button
            type="button"
            className="rounded-md p-2 hover:bg-white/10 xl:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Luk menu" : "Åbn menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id="mobile-menu" aria-label="Mobilnavigation" className="border-t border-white/10 bg-brand-gradient xl:hidden">
          <ul className="container flex flex-col py-2">
            {navItems.map((item) =>
              item.kind === "internal" ? (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "block rounded-md px-3 py-3 text-base font-medium hover:bg-white/10",
                        isActive && "text-brand-accent"
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ) : (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-track="click_bilpleje"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-1.5 rounded-md px-3 py-3 text-base font-medium hover:bg-white/10"
                  >
                    {item.label}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                  </a>
                </li>
              )
            )}
            <li className="mt-2 border-t border-white/10 pt-3">
              <a href={`tel:${brand.contact.phone}`} className="flex items-center gap-2 px-3 py-2" data-track="click_phone">
                <Phone className="h-4 w-4" aria-hidden /> {brand.contact.phone}
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
