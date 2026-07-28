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
  // Samme juridiske enhed og kontaktoplysninger som Autohuset Vest (samme selskab, to brands).
  contact: {
    legalName: "Autohuset Vest ApS",
    cvr: "44769247",
    address: "Islevsdalsvej 200, 2610 Rødovre",
    phone: "+45 31 54 20 45",
    email: "info@autohusetvest.dk",
    leadEmail: "info@autohusetvest.dk",
  },
  openingHours: [
    { label: "Mandag–fredag", hours: "09:00–17:30" },
    { label: "Lørdag", hours: "Efter aftale" },
    { label: "Søndag", hours: "Efter aftale" },
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
  // Deler det scrapede lager (Bilbasen-salgsbiler + One2move-lejebiler) med Autohuset Vest.
  // Leads, forespørgsler og værkstedsbookinger forbliver i Autohuset V's egen organisation.
  inventoryBrandKey: "autohuset-vest",
};
