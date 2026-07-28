import type { BrandConfig } from "./brand.types";

/**
 * Autohuset V – eksklusiv og præcis.
 * Farver fra spec: primær #0B1320, sekundær #1C2938, accent #C9823B,
 * baggrund #F6F3EE, tekst #111827.
 */
export const autohusetV: BrandConfig = {
  key: "autohuset-v",
  name: "Autohuset V",
  domain: "[AUTOHUSET V DOMÆNE]",
  colors: {
    primary: "11 19 32", // #0B1320
    secondary: "28 41 56", // #1C2938
    accent: "201 130 59", // #C9823B
    surface: "246 243 238", // #F6F3EE
    surfaceWarm: "234 226 214", // varm neutral afledt af paletten
    ink: "17 24 39", // #111827
  },
  fonts: {
    display: "'Sora'",
    body: "'Inter'",
  },
  contact: {
    legalName: "[AUTOHUSET V JURIDISK NAVN]",
    cvr: "[AUTOHUSET V CVR]",
    address: "[AUTOHUSET V ADRESSE]",
    phone: "[AUTOHUSET V TELEFON]",
    email: "[AUTOHUSET V E-MAIL]",
    leadEmail: "[AUTOHUSET V LEAD-E-MAIL]",
  },
  openingHours: [
    { label: "Mandag–fredag", hours: "10:00–17:30" },
    { label: "Lørdag", hours: "10:00–14:00" },
    { label: "Søndag", hours: "Lukket" },
  ],
  social: {
    facebook: "[AUTOHUSET V FACEBOOK]",
    instagram: "[AUTOHUSET V INSTAGRAM]",
  },
  seo: {
    defaultTitle: "Autohuset V – Udsøgte biler med garanti for kvalitet",
    titleTemplate: "%s | Autohuset V",
    defaultDescription:
      "Udsøgte brugte biler i høj kvalitet. Sælg din bil nemt og trygt, eller find din næste bil hos Autohuset V.",
  },
  leadResponseTime: "inden for 24 timer på hverdage",
  leadReferencePrefix: "AV",
};
