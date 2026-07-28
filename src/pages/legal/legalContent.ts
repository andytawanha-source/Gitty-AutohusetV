import type { BrandConfig } from "@/config/brands/brand.types";

/**
 * Juridiske sider – generisk, branchestandard indhold for bilforhandlere.
 * Teksterne udfyldes dynamisk med det aktive brands virksomhedsoplysninger
 * (navn, CVR, adresse, telefon, e-mail), så begge brands (Autohuset Vest og
 * Autohuset V) automatisk får korrekte oplysninger.
 *
 * Indholdet er generisk branchestandard og ikke en specifik juridisk
 * rådgivning – gennemgå det gerne med en advokat, hvis I ønsker
 * virksomhedsspecifikke tilføjelser.
 */

export interface LegalDoc {
  title: string;
  version: string;
  sections: Array<{ heading?: string; body: string }>;
}

export function getLegalDocs(brand: BrandConfig): Record<string, LegalDoc> {
  const { legalName, cvr, address, phone, email } = brand.contact;
  const company = `${legalName}, ${address}, CVR ${cvr}`;

  return {
    privatlivspolitik: {
      title: "Privatlivspolitik",
      version: "1.0",
      sections: [
        { heading: "Dataansvarlig", body: `${company} er dataansvarlig for behandlingen af dine personoplysninger. Kontakt: ${phone} / ${email}.` },
        { heading: "Formål med behandlingen", body: "Vi behandler dine oplysninger for at (1) besvare henvendelser og forespørgsler om biler, (2) vurdere din bil og give dig et tilbud, når du bruger salgsvurderingen, (3) gennemføre bilhandler og opfylde aftaler, (4) sende markedsføring, hvis du har givet særskilt samtykke, og (5) forbedre hjemmesiden via statistik, hvis du har accepteret statistikcookies." },
        { heading: "Kategorier af personoplysninger", body: "Kontaktoplysninger (navn, telefon, e-mail, postnummer), oplysninger om din bil (nummerplade, kilometerstand, stand, billeder), tekniske køretøjsdata hentet via vores nummerplade-opslag, kommunikationshistorik samt tekniske data (enhedstype, henvisningskilde og kampagneparametre)." },
        { heading: "Behandlingsgrundlag", body: "Behandlingen sker på grundlag af dit samtykke (databeskyttelsesforordningens art. 6, stk. 1, litra a) for markedsføring, opfyldelse af aftale eller skridt forud for aftale (litra b) for bilvurdering og handel, samt vores legitime interesse (litra f) i at besvare henvendelser og drive forretningen." },
        { heading: "Modtagere og databehandlere", body: "Vi bruger databehandlere til drift af hjemmesiden og behandling af henvendelser, herunder leverandører af webhosting, database og filopbevaring, nummerplade-opslag og udsendelse af e-mails. Der er indgået databehandleraftaler med alle databehandlere i overensstemmelse med databeskyttelsesforordningens art. 28." },
        { heading: "Overførsel til tredjelande", body: "Nogle af vores leverandører kan behandle data i lande uden for EU/EØS. Sker det, sker overførslen på grundlag af EU-Kommissionens standardkontraktbestemmelser eller et andet gyldigt overførselsgrundlag." },
        { heading: "Opbevaringsperioder", body: "Salgshenvendelser og tilhørende oplysninger opbevares, så længe det er nødvendigt for at håndtere din henvendelse og i en periode derefter til dokumentation og eventuel opfølgning. Bogføringsmateriale opbevares i 5 år i henhold til bogføringsloven. Markedsføringssamtykker opbevares, så længe samtykket er aktivt, og dokumentation herfor i 2 år efter tilbagetrækning." },
        { heading: "Dine rettigheder", body: `Du har ret til indsigt, berigtigelse, sletning, begrænsning af behandling, dataportabilitet og indsigelse. Har du givet samtykke, kan du til enhver tid trække det tilbage med virkning for fremtiden ved at kontakte os på ${email}.` },
        { heading: "Klage", body: "Du kan klage over vores behandling af dine personoplysninger til Datatilsynet, Carl Jacobsens Vej 35, 2500 Valby, www.datatilsynet.dk." },
        { heading: "Version", body: "Version 1.0." },
      ],
    },
    cookiepolitik: {
      title: "Cookiepolitik",
      version: "1.0",
      sections: [
        { heading: "Hvad er cookies?", body: "Cookies er små tekstfiler, der gemmes på din enhed, når du besøger en hjemmeside. Vi bruger dem til at få siden til at fungere og – kun med dit samtykke – til statistik og marketing." },
        { heading: "Kategorier", body: "Nødvendige: kræves for basale funktioner, herunder dit cookievalg. Funktionelle: husker dine præferencer (fx kortvisning). Statistik: anonymiseret måling af brugen af siden. Marketing: måling og målretning af annoncer. Ikke-nødvendige cookies sættes først, når du har givet samtykke." },
        { heading: "Ændr dit valg", body: "Du kan til enhver tid ændre eller trække dit samtykke tilbage via \"Cookieindstillinger\" i bunden af siden." },
        { heading: "Version", body: "Version 1.0." },
      ],
    },
    handelsbetingelser: {
      title: "Handelsbetingelser",
      version: "1.0",
      sections: [
        { heading: "Virksomhedsoplysninger", body: `${legalName}, ${address}, CVR ${cvr}, telefon ${phone}, e-mail ${email}.` },
        { heading: "Anvendelse", body: `Disse betingelser gælder for køb og salg af biler hos ${legalName}. Hjemmesidens annoncer er en opfordring til at gøre tilbud – en bindende aftale indgås først ved underskrevet slutseddel/købsaftale.` },
        { heading: "Priser og betaling", body: "Alle priser er i danske kroner inkl. moms/afgifter, medmindre andet fremgår (fx biler uden afgift eller engrospriser). Der tages forbehold for tastefejl, mellemsalg og prisændringer. Betaling sker ved kontant afregning, bankoverførsel eller finansiering gennem en af vores finansieringspartnere, medmindre andet er aftalt." },
        { heading: "Reklamation og garanti", body: "Ved forbrugerkøb gælder købelovens reklamationsregler (24 måneder for oprindelige mangler). Herudover tilbyder vi garantier på udvalgte biler i samarbejde med AutoConcept – se de konkrete vilkår for den enkelte bil eller kontakt os for detaljer." },
        { heading: "Køb af din bil", body: "Tilbud afgivet via salgsvurderingen er vejledende og uforpligtende for begge parter, indtil bilen er besigtiget og en skriftlig aftale er indgået. Tilbud forudsætter, at bilens stand svarer til de afgivne oplysninger." },
        { heading: "Fortrydelsesret", body: "Da bilhandler som udgangspunkt indgås ved fysisk fremmøde og besigtigelse, gælder forbrugeraftalelovens fortrydelsesret for aftaler om køb af bil normalt ikke. Er en aftale indgået udelukkende ved fjernsalg (uden fysisk besigtigelse forud for aftalens indgåelse), henvises til de til enhver tid gældende regler i forbrugeraftaleloven." },
        { heading: "Lovvalg og værneting", body: "Aftaler indgået med os er underlagt dansk ret, og eventuelle tvister afgøres ved danske domstole." },
        { heading: "Version", body: "Version 1.0." },
      ],
    },
    "vilkaar-bilvurdering": {
      title: "Vilkår for bilvurdering",
      version: "1.0",
      sections: [
        { heading: "Uforpligtende vurdering", body: "Bilvurderingen er gratis og uforpligtende. Et afgivet skøn er vejledende, indtil bilen er fysisk besigtiget, og forudsætter, at de afgivne oplysninger om bilen er korrekte og fyldestgørende." },
        { heading: "Sådan beregnes skønnet", body: "Skønnet beregnes ud fra bilens mærke, model og alder sammenholdt med kilometerstand og oplyst stand, samt et generelt markedsbillede for tilsvarende biler. Det endelige, bindende bud gives altid af os personligt – telefonisk eller på mail – efter en gennemgang af bilens faktiske stand." },
        { heading: "Dine oplysninger", body: "Nummerplade, kilometerstand, oplysninger om bilens stand og uploadede billeder bruges udelukkende til at vurdere bilen og kontakte dig om din henvendelse. Se privatlivspolitikken for detaljer om behandlingen." },
        { heading: "Køretøjsdata", body: "Tekniske køretøjsdata hentes fra et offentligt tilgængeligt køretøjsregister på baggrund af nummerpladen. Vi henter ikke oplysninger om ejerforhold." },
        { heading: "Version", body: "Version 1.0." },
      ],
    },
    "juridiske-forbehold": {
      title: "Juridiske forbehold",
      version: "1.0",
      sections: [
        { body: "Der tages forbehold for tastefejl, prisændringer, mellemsalg, ændrede afgifter samt fejl i bilernes angivne specifikationer og udstyr. Billeder kan vise ekstraudstyr, der ikke indgår i prisen. Oplysninger fra eksterne registre leveres uden garanti for fuldstændighed." },
      ],
    },
    finansieringsforbehold: {
      title: "Finansieringsforbehold",
      version: "1.0",
      sections: [
        { body: "Alle finansieringseksempler på hjemmesiden er vejledende og udgør ikke et bindende tilbud. Endelige vilkår, herunder ÅOP, samlede kreditomkostninger og løbetid, fastsættes af finansieringsselskabet efter en individuel kreditvurdering af dig som kunde." },
      ],
    },
    klagevejledning: {
      title: "Klagevejledning",
      version: "1.0",
      sections: [
        { heading: "Klag først til os", body: `Er du utilfreds, så kontakt os på ${phone} eller ${email} – vi finder som regel en løsning.` },
        { heading: "Klageinstanser", body: "Fører dialogen ikke til en løsning, kan du som forbruger klage til Center for Klageløsning / Forbrugerklagenævnet via naevneneshus.dk. Du kan også bruge EU-Kommissionens onlineklageportal: ec.europa.eu/odr." },
      ],
    },
  };
}
