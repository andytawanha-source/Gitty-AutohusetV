import type { BrandConfig } from "./brand.types";

/**
 * Autohuset Vest – kongeblå/hvidt tema (kundeønske, juli 2026).
 * Primær: kongeblå #2038B0 · sekundær: mørk kongeblå #16277D ·
 * accent: lys kongeblå #8FB0FF · baggrund: hvid · flade: iskold lyseblå #EEF2FB.
 */
export const autohusetVest: BrandConfig = {
  key: "autohuset-vest",
  name: "Autohuset Vest",
  domain: "[AUTOHUSET VEST DOMÆNE]",
  colors: {
    primary: "32 56 176", // #2038B0 kongeblå
    secondary: "22 39 125", // #16277D mørk kongeblå
    accent: "143 176 255", // #8FB0FF lys kongeblå
    surface: "255 255 255", // #FFFFFF hvid
    surfaceWarm: "238 242 251", // #EEF2FB iskold lyseblå (sektionsflader)
    ink: "14 21 51", // #0E1533 mørk blåsort tekst
  },
  fonts: {
    display: "'Outfit'",
    body: "'Inter'",
  },
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
    facebook: "[AUTOHUSET VEST FACEBOOK]",
    instagram: "[AUTOHUSET VEST INSTAGRAM]",
  },
  seo: {
    defaultTitle: "Autohuset Vest – Kvalitetsbiler og fair bilvurdering",
    titleTemplate: "%s | Autohuset Vest",
    defaultDescription:
      "Se vores udvalg af kvalitetsbiler, eller få et uforpligtende tilbud på din bil med det samme. Autohuset Vest – tryg bilhandel i Vestdanmark.",
  },
  leadResponseTime: "inden for 24 timer på hverdage",
  leadReferencePrefix: "AVEST",
  bilplejeUrl: "https://autohusetvest-bilpleje.planway.com?d=68403&sid=491895",
};
