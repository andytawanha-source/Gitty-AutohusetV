import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, Phone, X } from "lucide-react";
import { useBrand } from "@/app/BrandProvider";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

const NAV_ITEMS = [
  { to: "/", label: "Forside", end: true },
  { to: "/biler", label: "Biler til salg" },
  { to: "/saelg-din-bil", label: "Sælg din bil" },
  { to: "/garanti", label: "Garanti" },
  { to: "/biludlejning", label: "Biludlejning" },
  { to: "/om-os", label: "Om os" },
  { to: "/kontakt", label: "Kontakt" },
];

export function SiteHeader() {
  const brand = useBrand();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" aria-label={`${brand.name} – forside`}>
          <Logo />
        </Link>

        <nav aria-label="Hovednavigation" className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10",
                  isActive && "bg-white/15 text-brand-accent"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${brand.contact.phone}`}
            className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-white/10 md:flex"
            data-track="click_phone"
          >
            <Phone className="h-4 w-4" aria-hidden />
            {brand.contact.phone}
          </a>
          <Link
            to="/saelg-din-bil"
            className="hidden rounded-md bg-white ring-1 ring-brand-primary/20 shadow-sm px-4 py-2 text-sm font-semibold text-brand-primary transition-transform hover:scale-[1.03] md:block"
          >
            Sælg din bil
          </Link>
          <button
            type="button"
            className="rounded-md p-2 hover:bg-white/10 lg:hidden"
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
        <nav id="mobile-menu" aria-label="Mobilnavigation" className="border-t border-white/10 bg-brand-gradient lg:hidden">
          <ul className="container flex flex-col py-2">
            {NAV_ITEMS.map((item) => (
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
            ))}
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
