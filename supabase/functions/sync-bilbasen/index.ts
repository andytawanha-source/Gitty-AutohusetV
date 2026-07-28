// Edge Function: sync-bilbasen
//
// Henter Autohuset Vests forhandlerside på Bilbasen og synkroniserer bilerne ind i
// vehicles-tabellen (listing_type = 'sale'), så "Biler til salg" på hjemmesiden altid
// afspejler det aktuelle Bilbasen-lager uden manuel indtastning to steder.
//
// Kaldes periodisk (se DEPLOYMENT.md / API-INTEGRATION.md for opsætning af et cron-kald,
// fx via Supabase Scheduled Functions eller pg_cron + pg_net). Kan også kaldes manuelt
// fra adminpanelet ("Synkroniser fra Bilbasen"-knap, når den er koblet på).
//
// VIGTIGT (se LEGAL-CHECKLIST.md): Der hentes udelukkende offentligt tilgængelige
// annoncedata fra forhandlerens EGEN side på Bilbasen (annoncer Autohuset selv har
// oprettet) – ikke data om andre forhandlere. Bilbasens vilkår bør alligevel
// gennemgås/afklares med Bilbasen, før dette køres i produktion i stor skala, og
// scraperen bør høfligt begrænse hyppigheden (se SYNC_MIN_INTERVAL_MINUTES).
// deno-lint-ignore-file no-explicit-any

import { createClient } from "npm:@supabase/supabase-js@2";
import { parse as parseHtml } from "npm:node-html-parser@6";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";

const DEALER_URL = Deno.env.get("BILBASEN_DEALER_URL") ??
  "https://www.bilbasen.dk/find-en-forhandler/bilforhandler-autohuset-v-aps-id22288";
const ORGANIZATION_ID = Deno.env.get("BILBASEN_ORGANIZATION_ID") ?? "";

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type ParsedListing = {
  externalId: string;
  externalUrl: string;
  title: string;
  make: string;
  model: string;
  variant: string | null;
  modelYear: number | null;
  mileageKm: number | null;
  priceDkk: number | null;
  description: string | null;
  imageUrls: string[];
  fuelType: string | null;
  transmission: string | null;
  color: string | null;
  bodyType: string | null;
  doors: number | null;
  powerHp: number | null;
  taxPeriodDkk: number | null;
};

// Værdierne skal matche public.fuel_type / public.transmission_type-enummene.
const FUEL_MAP: Record<string, string> = {
  benzin: "benzin",
  diesel: "diesel",
  el: "el",
  elektrisk: "el",
  hybrid: "hybrid",
  "plug-in hybrid": "plugin_hybrid",
  "plug-in hybrid benzin": "plugin_hybrid",
  "plug-in hybrid diesel": "plugin_hybrid",
};
const TRANSMISSION_MAP: Record<string, string> = {
  manuel: "manuel",
  automatisk: "automatisk",
  automatgear: "automatisk",
};

const SCRAPERAPI_KEY = Deno.env.get("SCRAPERAPI_KEY") ?? "";

/**
 * Drivmiddel/geartype/farve/karrosseri findes IKKE på forhandler-listesiden – kun på
 * den enkelte bils egen side, som er en React-app beskyttet af Cloudflare (Turnstile).
 * Et almindeligt server-til-server fetch() bliver mødt med en JS-udfordring i stedet
 * for indholdet. Vi ruter derfor opslaget gennem ScraperAPI (render=true løser
 * udfordringen og JS-renderer siden), hvis SCRAPERAPI_KEY-secret er sat – ellers
 * springes det stille over (resten af synkroniseringen fungerer uden det).
 *
 * Struktur verificeret i browserens DOM (juli 2026):
 *   table.bas-MuiTable-root (flere stk. på siden) → hver <tr> er [label, værdi]
 *   Vi slår kun de mærker op, vi kender ("Drivmiddel", "Geartype", osv.) – de øvrige
 *   tabeller (fx udstyrslisten) har label-tekster, der ikke matcher noget i KNOWN_SPECS,
 *   og bliver derfor automatisk ignoreret.
 */
async function fetchListingSpecs(url: string): Promise<Partial<ParsedListing>> {
  if (!SCRAPERAPI_KEY) return {};
  const proxied =
    `https://api.scraperapi.com/?api_key=${SCRAPERAPI_KEY}&url=${encodeURIComponent(url)}&render=true&country_code=dk`;
  const res = await fetch(proxied);
  if (!res.ok) return {};
  const root = parseHtml(await res.text());

  const specs = new Map<string, string>();
  for (const table of root.querySelectorAll("table")) {
    for (const row of table.querySelectorAll("tr")) {
      const cells = row.querySelectorAll("th, td").map((c) => c.textContent.trim());
      if (cells.length === 2) specs.set(cells[0], cells[1]);
    }
  }

  const fuelRaw = specs.get("Drivmiddel")?.toLowerCase().trim();
  const gearRaw = specs.get("Geartype")?.toLowerCase().trim();
  const doorsRaw = specs.get("Døre");
  const powerMatch = specs.get("Ydelse")?.match(/(\d+)\s*hk/i);
  const taxMatch = specs.get("Periodisk afgift")?.match(/([\d.]+)\s*kr/);

  return {
    fuelType: fuelRaw ? FUEL_MAP[fuelRaw] ?? null : null,
    transmission: gearRaw ? TRANSMISSION_MAP[gearRaw] ?? null : null,
    color: specs.get("Farve") ?? null,
    bodyType: specs.get("Type") ?? specs.get("Kategori") ?? null,
    doors: doorsRaw ? Number(doorsRaw) : null,
    powerHp: powerMatch ? Number(powerMatch[1]) : null,
    taxPeriodDkk: taxMatch ? Number(taxMatch[1].replace(/\./g, "")) : null,
  };
}

/** Bilbasens billed-CDN understøtter en størrelses-parameter i URL'en – vi beder om
 * en større udgave end den lille thumbnail-størrelse siden selv linker til. */
function upsizeImageUrl(url: string): string {
  return url.replace(/class=RS\d+X\d+/, "class=RS960X720");
}

/**
 * Bilbasens forhandlerside er server-renderet HTML (ingen offentligt API). Struktur
 * verificeret direkte i browserens DOM (juli 2026):
 *   a.listing-heading                     → titel + href ".../<make>/<model>/<variant>/<id>"
 *   (nærmeste) .bb-listing-clickable       → hele annonce-kortet
 *     .col-xs-6 .listing-data (4 stk.)     → [by, forbrug ("xx km/l"), km, årgang]
 *     .listing-price                       → "57.499 kr."
 *     .listing-description                 → fuld annoncetekst
 *     img[src*="billeder.bilbasen.dk"]      → hovedbillede + små thumbnails
 * Justér selectorerne her (markeret TODO), hvis Bilbasen ændrer sidens opbygning –
 * check nemmest ved at inspicere DOM'en på forhandlersiden i browserens devtools.
 */
function parseDealerPage(html: string): ParsedListing[] {
  const root = parseHtml(html);
  const listings: ParsedListing[] = [];

  const headings = root.querySelectorAll("a.listing-heading");
  for (const heading of headings) {
    const href = heading.getAttribute("href");
    const title = heading.textContent.trim();
    if (!href || !title) continue;

    const linkMatch = href.match(/^\/brugt\/bil\/([a-z0-9-]+)\/([a-z0-9-]+)\/[a-z0-9-]+\/(\d+)/i);
    if (!linkMatch) continue;
    const [, makeSlug, modelSlug, externalId] = linkMatch;
    if (listings.some((l) => l.externalId === externalId)) continue;

    const card = heading.closest(".bb-listing-clickable") ?? heading.closest(".listing") ?? root;

    const dataCells = card.querySelectorAll(".listing-data").map((c) => c.textContent.trim());
    // Rækkefølge på Bilbasen: [by, forbrug ("xx km/l"), km, årgang] – vi matcher på
    // indhold frem for fast position, så det er robust over for en manglende celle.
    const yearCell = dataCells.find((c) => /^(19|20)\d{2}$/.test(c));
    const kmCell = dataCells.find((c) => /^[\d.]+$/.test(c) && c !== yearCell);

    const priceText = card.querySelector(".listing-price")?.textContent ?? "";
    const priceMatch = priceText.match(/([\d.]{4,10})\s*kr/);

    const description = card.querySelector(".listing-description")?.textContent.trim().replace(/\n{3,}/g, "\n\n") ?? null;

    // Bilbasen lazy-loader (echo.js): "src" er en placeholder-ikon-SVG indtil billedet
    // scroller i view – den rigtige URL ligger i "data-echo" (evt. "data-img" som
    // fallback). Vi tjekker alle tre, i den rækkefølge.
    const imageUrls = card
      .querySelectorAll("img")
      .map((img) => img.getAttribute("data-echo") ?? img.getAttribute("data-img") ?? img.getAttribute("src"))
      .filter((src): src is string => Boolean(src) && src!.includes("billeder.bilbasen.dk"))
      .map(upsizeImageUrl)
      // Første billede går igen som både stort billede og lille thumbnail i DOM'en –
      // fjern dubletter (samme fil-id, uanset størrelsesparameter).
      .filter((src, i, arr) => arr.findIndex((s) => s.split("?")[0] === src.split("?")[0]) === i);

    const make = titleCase(makeSlug.replace(/-/g, " "));
    const model = titleCase(modelSlug.replace(/-/g, " "));
    // Bilbasens titel er "<Mærke> <Model> <variant...>" – vi fjerner mærke+model fra
    // starten (case-insensitivt) for at undgå at de gentages i variant-feltet.
    const variant =
      title.replace(new RegExp(`^${escapeRe(make)}\\s+${escapeRe(model)}\\s*`, "i"), "").trim() || null;

    listings.push({
      externalId,
      externalUrl: `https://www.bilbasen.dk${href}`,
      title,
      make,
      model,
      variant,
      modelYear: yearCell ? Number(yearCell) : null,
      mileageKm: kmCell ? Number(kmCell.replace(/\./g, "")) : null,
      priceDkk: priceMatch ? Number(priceMatch[1].replace(/\./g, "")) : null,
      description,
      imageUrls,
      fuelType: null,
      transmission: null,
      color: null,
      bodyType: null,
      doors: null,
      powerHp: null,
      taxPeriodDkk: null,
    });
  }

  return listings;
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

Deno.serve(async (req) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  if (!ORGANIZATION_ID) {
    return jsonResponse({ error: "BILBASEN_ORGANIZATION_ID secret er ikke sat." }, 500);
  }

  try {
    const res = await fetch(DEALER_URL, {
      headers: { "User-Agent": "AutohusetVestSync/1.0 (+https://autohusetvest.dk)" },
    });
    if (!res.ok) {
      return jsonResponse({ error: `Kunne ikke hente Bilbasen-siden (status ${res.status}).` }, 502);
    }
    const html = await res.text();
    const listings = parseDealerPage(html);

    const supabase = getServiceClient();
    let created = 0;
    let updated = 0;

    for (const listing of listings) {
      const slug = `${slugify(listing.title)}-${listing.externalId}`;
      const { data: existing } = await supabase
        .from("vehicles")
        .select("id, fuel_type, transmission, color, body_type, doors, power_hp, tax_period_dkk")
        .eq("organization_id", ORGANIZATION_ID)
        .eq("external_source", "bilbasen")
        .eq("external_id", listing.externalId)
        .maybeSingle();

      // Ekstra (kreditforbrugende) opslag pr. bil for drivmiddel/gearkasse/farve/
      // karrosseri – kun for biler der endnu ikke har det, så vi ikke bruger
      // ScraperAPI-kreditter på biler, der allerede er beriget. Fejler roligt
      // (specs forbliver tomme) frem for at vælte hele synkroniseringen.
      if (!existing?.fuel_type) {
        try {
          Object.assign(listing, await fetchListingSpecs(listing.externalUrl));
        } catch {
          // ignoreres bevidst
        }
      }

      // Når specs IKKE hentes på ny (bilen har dem allerede), skal de allerede
      // gemte værdier bevares i stedet for at blive overskrevet med null – ellers
      // sletter en almindelig sync (uden ScraperAPI-opslag) tidligere hentede data.
      const row = {
        organization_id: ORGANIZATION_ID,
        listing_type: "sale",
        make: listing.make,
        model: listing.model,
        variant: listing.variant,
        model_year: listing.modelYear,
        mileage_km: listing.mileageKm,
        price_dkk: listing.priceDkk,
        description: listing.description,
        fuel_type: listing.fuelType ?? existing?.fuel_type ?? null,
        transmission: listing.transmission ?? existing?.transmission ?? null,
        color: listing.color ?? existing?.color ?? null,
        body_type: listing.bodyType ?? existing?.body_type ?? null,
        doors: listing.doors ?? existing?.doors ?? null,
        power_hp: listing.powerHp ?? existing?.power_hp ?? null,
        tax_period_dkk: listing.taxPeriodDkk ?? existing?.tax_period_dkk ?? null,
        slug,
        // vehicle_status-enum har ikke "available" – "published" er den offentligt
        // synlige status (se 0001-migrationen).
        status: "published",
        external_source: "bilbasen",
        external_id: listing.externalId,
        external_url: listing.externalUrl,
        last_synced_at: new Date().toISOString(),
      };

      let vehicleId = existing?.id as string | undefined;
      if (existing) {
        await supabase.from("vehicles").update(row).eq("id", existing.id);
        updated++;
      } else {
        const { data: inserted } = await supabase.from("vehicles").insert(row).select("id").single();
        vehicleId = inserted?.id;
        created++;
      }

      if (vehicleId && listing.imageUrls.length) {
        // Simplest robuste tilgang: fjern gamle billeder for denne bil og indsæt de
        // aktuelle igen – billed-URL'erne peger direkte på Bilbasens CDN, så der
        // uploades intet til vores egen storage.
        await supabase.from("vehicle_images").delete().eq("vehicle_id", vehicleId);
        await supabase.from("vehicle_images").insert(
          listing.imageUrls.map((url, i) => ({
            organization_id: ORGANIZATION_ID,
            vehicle_id: vehicleId,
            storage_path: url,
            alt_text: `${listing.make} ${listing.model}`,
            sort_order: i,
            is_primary: i === 0,
          })),
        );
      }
    }

    // Biler der ikke længere findes i Bilbasen-opslaget (solgt/fjernet) markeres som
    // solgte i stedet for at blive slettet, så historik/leads der peger på dem bevares.
    const currentIds = listings.map((l) => l.externalId);
    const { data: staleRows } = await supabase
      .from("vehicles")
      .select("id")
      .eq("organization_id", ORGANIZATION_ID)
      .eq("external_source", "bilbasen")
      .eq("status", "published")
      .not("external_id", "in", `(${currentIds.map((id) => `"${id}"`).join(",") || '""'})`);

    let markedSold = 0;
    if (staleRows?.length) {
      await supabase
        .from("vehicles")
        .update({ status: "sold", sold_at: new Date().toISOString() })
        .in("id", staleRows.map((r) => r.id));
      markedSold = staleRows.length;
    }

    return jsonResponse({ ok: true, found: listings.length, created, updated, markedSold });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Ukendt fejl" }, 500);
  }
});
