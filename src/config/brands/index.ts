import type { BrandConfig, BrandKey } from "./brand.types";
import { autohusetVest } from "./autohuset-vest";
import { autohusetV } from "./autohuset-v";

export const brands: Record<BrandKey, BrandConfig> = {
  "autohuset-vest": autohusetVest,
  "autohuset-v": autohusetV,
};

const DOMAIN_MAP: Record<string, BrandKey> = {
  "autohusetvest.dk": "autohuset-vest",
  "localhost": "autohuset-vest",
};

function isBrandKey(value: string | undefined): value is BrandKey {
  return value === "autohuset-vest" || value === "autohuset-v";
}

/**
 * Brand bestemmes i prioriteret rækkefølge:
 * 1. VITE_BRAND_KEY (deployment-environmentvariabel – anbefalet)
 * 2. Domænematch
 * 3. Fallback: autohuset-vest (primært demo-brand)
 */
export function resolveBrandKey(hostname?: string): BrandKey {
  const envKey = import.meta.env.VITE_BRAND_KEY as string | undefined;
  if (isBrandKey(envKey)) return envKey;

  const host = hostname ?? (typeof window !== "undefined" ? window.location.hostname : "");
  const domainKey = DOMAIN_MAP[host.replace(/^www\./, "")];
  if (domainKey) return domainKey;

  return "autohuset-vest";
}

export function getBrand(hostname?: string): BrandConfig {
  return brands[resolveBrandKey(hostname)];
}

export type { BrandConfig, BrandKey };
