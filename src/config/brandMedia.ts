import type { BrandKey } from "./brands/brand.types";

/**
 * Brand-bevidst mediekonfiguration. Hvert brand (autohuset-vest, autohuset-v) har sit
 * eget billedsæt under public/media/[brand-key]/. Intet globalt billedsæt hardcodes –
 * komponenter slår altid billeder op via `getBrandMedia(brandKey)`.
 *
 * Autohuset Vest har fået sit fulde, dedikerede billedsæt (se docs/ASSET-SOURCES.md for
 * kilder). Autohuset V bruger indtil videre de samme, neutrale filer som midlertidigt
 * fallback – konfigurationen er allerede separat, så et rigtigt Autohuset V-sæt blot
 * kan lægges i public/media/autohuset-v/ og pege dertil uden kodeændringer andre steder.
 */

export interface HeroImage {
  desktop: string;
  mobile: string;
  /** Dansk alt-tekst til heroen (indholdsbærende, ikke dekorativ). */
  alt: string;
}

export interface EditorialImage {
  src: string;
  width: number;
  height: number;
  /** Dansk alt-tekst. Sæt til "" hvis billedet bruges rent dekorativt et givent sted. */
  alt: string;
}

export interface BrandMedia {
  heroDesktop: HeroImage["desktop"];
  heroMobile: HeroImage["mobile"];
  heroAlt: string;
  sellCarInspection: EditorialImage;
  financeConsultation: EditorialImage;
  showroom: EditorialImage;
  workshop: EditorialImage;
}

const autohusetVestMedia: BrandMedia = {
  heroDesktop: "/media/autohuset-vest/home-hero-desktop.webp",
  heroMobile: "/media/autohuset-vest/home-hero-mobile.webp",
  heroAlt: "Udvalg af moderne kvalitetsbiler opstillet på en bilforhandlers plads i dagslys",
  sellCarInspection: {
    src: "/media/autohuset-vest/sell-car-inspection.webp",
    width: 1600,
    height: 1200,
    alt: "En bilsælger gennemgår en brugt bils dæk sammen med bilens ejer",
  },
  financeConsultation: {
    src: "/media/autohuset-vest/finance-consultation.webp",
    width: 1600,
    height: 1200,
    alt: "Kunde og finansieringsrådgiver gennemgår papirer ved et bord i et bilhus",
  },
  showroom: {
    src: "/media/autohuset-vest/showroom.webp",
    width: 1800,
    height: 1200,
    alt: "Moderne skandinavisk bilforhandler udefra i dagslys",
  },
  workshop: {
    src: "/media/autohuset-vest/workshop.webp",
    width: 1400,
    height: 1400,
    alt: "Klargøring af en bil i et lyst værkstedsmiljø",
  },
};

/**
 * MIDLERTIDIGT fallback for Autohuset V – neutrale, brandneutrale billeder genbruges,
 * indtil Autohuset V får sit eget dedikerede sæt. Skift blot stierne herunder ud
 * (og læg filerne i public/media/autohuset-v/), når det sæt er klar.
 */
const autohusetVMedia: BrandMedia = {
  ...autohusetVestMedia,
};

const BRAND_MEDIA: Record<BrandKey, BrandMedia> = {
  "autohuset-vest": autohusetVestMedia,
  "autohuset-v": autohusetVMedia,
};

export function getBrandMedia(brandKey: BrandKey): BrandMedia {
  return BRAND_MEDIA[brandKey];
}
