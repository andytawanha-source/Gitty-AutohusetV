/** Central brandkonfiguration – alt brandspecifikt indhold skal komme herfra eller fra site_settings i databasen. */

export type BrandKey = "autohuset-vest" | "autohuset-v";

export interface BrandColors {
  /** rgb-kanaler som "13 59 69" – bruges i CSS-variabler med alpha-støtte */
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  surfaceWarm: string;
  ink: string;
}

export interface BrandContact {
  legalName: string;
  cvr: string;
  address: string;
  phone: string;
  email: string;
  leadEmail: string;
}

export interface OpeningHours {
  label: string; // fx "Mandag–fredag"
  hours: string; // fx "09:00–17:30" eller "Lukket"
}

export interface BrandSeo {
  defaultTitle: string;
  titleTemplate: string; // fx "%s | Autohuset Vest"
  defaultDescription: string;
}

export interface BrandConfig {
  key: BrandKey;
  name: string;
  domain: string;
  colors: BrandColors;
  fonts: { display: string; body: string };
  contact: BrandContact;
  openingHours: OpeningHours[];
  social: { facebook?: string; instagram?: string; linkedin?: string };
  seo: BrandSeo;
  /** Forventet responstid på leads – vises på bekræftelsessiden */
  leadResponseTime: string;
  /** Præfiks til leadreferencer, fx "AVEST" */
  leadReferencePrefix: string;
  /** Booking-URL til bilpleje/bilvask (Planway el. lign.). Udeladt = ingen "Bilpleje"-link i header. */
  bilplejeUrl?: string;
  /**
   * Læs bil-/lejebillager fra DETTE brands organisation i stedet for sit eget.
   * Gør det muligt for flere brands at dele ét scrapet lager (biler scrapes kun
   * én gang), mens hvert brand fortsat har sine EGNE leads, forespørgsler og
   * værkstedsbookinger i sin egen organisation. Udeladt = brug egen organisation.
   */
  inventoryBrandKey?: BrandKey;
}
