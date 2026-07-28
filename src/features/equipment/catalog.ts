/**
 * Kuraterede, kategoriserede ekstraudstyrspunkter, så admin kan vælge fra en
 * liste i stedet for at skrive den samme formulering igen og igen. Gemmes
 * stadig som almindelig tekst på vehicles.equipment (string[]) – katalogets
 * eneste opgave er at gøre UI'et hurtigt at bruge (søgning, kategorisering).
 */
export interface EquipmentCategory {
  key: string;
  label: string;
  items: string[];
}

export const EQUIPMENT_CATALOG: EquipmentCategory[] = [
  {
    key: "komfort",
    label: "Komfort",
    items: ["Klimaanlæg", "2-zoners klimaanlæg", "Sædevarme foran", "Sædevarme bagi", "Ratvarme", "El-sæder", "Sæder m. memory", "Nøglefri betjening", "Fartpilot", "Adaptiv fartpilot", "Trådløs opladning"],
  },
  {
    key: "sikkerhed",
    label: "Sikkerhed",
    items: ["ABS", "ESP", "Airbags (fuld pakke)", "Isofix", "Nødbremseassistent", "Vognbaneassistent", "Blindvinkelassistent", "Bakkamera", "360-graders kamera", "Parkeringssensorer for", "Parkeringssensorer bag"],
  },
  {
    key: "infotainment",
    label: "Infotainment",
    items: ["Apple CarPlay", "Android Auto", "Navigation", "DAB-radio", "Bluetooth", "Premium lydanlæg", "Digitalt kombiinstrument", "Head-up display"],
  },
  {
    key: "assistance",
    label: "Assistance",
    items: ["Automatisk fjernlys", "Trafikskiltgenkendelse", "Træthedsadvarsel", "Parkeringsassistent", "360-graders assistance"],
  },
  {
    key: "eksterior",
    label: "Eksteriør",
    items: ["LED-forlygter", "Xenon-forlygter", "Metallak", "Alufælge", "Panoramatag", "Elektrisk bagklap", "Anhængertræk"],
  },
  {
    key: "interior",
    label: "Interiør",
    items: ["Læderindtræk", "Delelæder", "Automatgear", "Manuelt gear", "Armlæn", "Multifunktionsrat"],
  },
  {
    key: "anhaenger",
    label: "Anhænger og transport",
    items: ["Anhængertræk (aftagelig)", "Anhængertræk (fast)", "Tagbøjler", "Tagbox"],
  },
  {
    key: "elektrisk",
    label: "Elektrisk udstyr",
    items: ["Type 2-ladekabel", "Hurtiglader (CCS)", "Varmepumpe", "Forvarmning af kabine", "V2L (strøm ud af bilen)"],
  },
];

export const ALL_EQUIPMENT_ITEMS: string[] = EQUIPMENT_CATALOG.flatMap((c) => c.items);
