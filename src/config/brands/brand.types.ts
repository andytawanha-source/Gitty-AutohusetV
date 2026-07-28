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
}
