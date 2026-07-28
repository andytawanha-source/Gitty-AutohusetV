import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { getBrand, type BrandConfig } from "@/config/brands";

const BrandContext = createContext<BrandConfig | null>(null);

/** Sætter brandets CSS-variabler på <html> og eksponerer brandkonfigurationen via context. */
export function BrandProvider({ children }: { children: ReactNode }) {
  const brand = useMemo(() => getBrand(), []);

  useEffect(() => {
    const root = document.documentElement;
    const c = brand.colors;
    root.style.setProperty("--brand-primary", c.primary);
    root.style.setProperty("--brand-secondary", c.secondary);
    root.style.setProperty("--brand-accent", c.accent);
    root.style.setProperty("--brand-surface", c.surface);
    root.style.setProperty("--brand-surface-warm", c.surfaceWarm);
    root.style.setProperty("--brand-ink", c.ink);
    root.style.setProperty("--font-display", brand.fonts.display);
    root.style.setProperty("--font-body", brand.fonts.body);
    root.dataset.brand = brand.key;
  }, [brand]);

  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandConfig {
  const brand = useContext(BrandContext);
  if (!brand) throw new Error("useBrand skal bruges inden for <BrandProvider>");
  return brand;
}
