// Edge Function: sync-one2move-rental
//
// Henter Autohuset Vests One2move-afdelingsside (biludlejning) og synkroniserer
// lejebilerne ind i vehicles-tabellen (listing_type = 'rental') + rental_details,
// så "Biludlejning" på hjemmesiden altid afspejler det aktuelle One2move-udvalg uden
// manuel indtastning to steder. One2move er allerede en samarbejdspartner (se
// PartnerLogos.tsx), så dette er blot den automatiske del af den relation.
//
// Kaldes periodisk – se DEPLOYMENT.md / API-INTEGRATION.md for cron-opsætning.
//
// VIGTIGT (se LEGAL-CHECKLIST.md): Der hentes udelukkende offentligt tilgængelige
// data fra Autohuset Vests EGEN afdelingsside hos One2move. One2moves vilkår bør
// alligevel afklares før produktion i stor skala.
// deno-lint-ignore-file no-explicit-any

import { createClient } from "npm:@supabase/supabase-js@2";
import { parse as parseHtml } from "npm:node-html-parser@6";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";

const DEPARTMENT_URL = Deno.env.get("ONE2MOVE_DEPARTMENT_URL") ??
  "https://one2movebiludlejning.dk/afdelinger/biludlejning-roedovre-n";
const ORGANIZATION_ID = Deno.env.get("BILBASEN_ORGANIZATION_ID") ?? Deno.env.get("ONE2MOVE_ORGANIZATION_ID") ?? "";

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

type ParsedCar = {
  title: string;
  category: string | null;
  modelYear: number | null;
  pricePerDayDkk: number | null;
  doors: number | null;
  seats: number | null;
  fuelType: string | null;
  transmission: string | null;
};

/**
 * One2moves afdelingsside er server-renderet HTML uden stabile id'er pr. biltype (kun
 * navn + kategori + årgang), så det bruges som nøgle ved synkronisering (se
 * externalId nedenfor). Struktur verificeret direkte i browserens DOM (juli 2026):
 *   .item.car-box                          → ét bilkort
 *     .top-info                            → titel (fx "VW Up")
 *     .lower-info .col-6 (2 stk.)          → [kategori, "Årgang <år>"]
 *     .car-price-top                       → "fra <pris> kr. pr. dag"
 *     .car-feature .col-9 (flere stk.)     → "N Døre", "N Sæder", drivmiddel, gearkasse, ...
 * Justér selectorerne her (markeret TODO), hvis One2move ændrer sidens opbygning –
 * check nemmest ved at inspicere DOM'en på afdelingssiden i browserens devtools.
 */
function parseDepartmentPage(html: string): ParsedCar[] {
  const root = parseHtml(html);
  const cars: ParsedCar[] = [];

  const cardEls = root.querySelectorAll(".item.car-box");
  for (const card of cardEls) {
    const title = card.querySelector(".top-info")?.textContent.trim();
    if (!title) continue;

    const infoCells = card.querySelectorAll(".lower-info .col-6").map((c) => c.textContent.trim());
    const yearCell = infoCells.find((c) => /Årgang/i.test(c));
    const category = infoCells.find((c) => c !== yearCell) ?? null;
    const yearMatch = yearCell?.match(/(\d{4})/);

    const priceText = card.querySelector(".car-price-top")?.textContent ?? "";
    const priceMatch = priceText.replace(/\s+/g, " ").match(/([\d.,]+)\s*kr/);

    const featureTexts = card.querySelectorAll(".car-feature .col-9").map((c) => c.textContent.replace(/\s+/g, " ").trim());
    const doorsText = featureTexts.find((t) => /Døre/i.test(t));
    const seatsText = featureTexts.find((t) => /Sæder/i.test(t));
    const fuelText = featureTexts.find((t) => /^(Benzin|Diesel|El|Hybrid)$/i.test(t));
    const gearText = featureTexts.find((t) => /^(Manuel|Automatgear)$/i.test(t));

    cars.push({
      title,
      category,
      modelYear: yearMatch ? Number(yearMatch[1]) : null,
      pricePerDayDkk: priceMatch ? Number(priceMatch[1].replace(/\./g, "").replace(",", ".")) : null,
      doors: doorsText?.match(/\d+/) ? Number(doorsText.match(/\d+/)![0]) : null,
      seats: seatsText?.match(/\d+/) ? Number(seatsText.match(/\d+/)![0]) : null,
      fuelType: fuelText ?? null,
      transmission: gearText ?? null,
    });
  }

  return cars;
}

function splitMakeModel(title: string): { make: string; model: string } {
  const [make, ...rest] = title.trim().split(/\s+/);
  return { make: make ?? title, model: rest.join(" ") || title };
}

// Værdierne skal matche public.fuel_type / public.transmission_type-enummene
// (0001-migrationen) – begge er på dansk.
const FUEL_MAP: Record<string, string> = {
  benzin: "benzin",
  diesel: "diesel",
  el: "el",
  hybrid: "hybrid",
};

const TRANSMISSION_MAP: Record<string, string> = {
  manuel: "manuel",
  automatgear: "automatisk",
};

Deno.serve(async (req) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  if (!ORGANIZATION_ID) {
    return jsonResponse({ error: "ONE2MOVE_ORGANIZATION_ID (eller BILBASEN_ORGANIZATION_ID) secret er ikke sat." }, 500);
  }

  try {
    const res = await fetch(DEPARTMENT_URL, {
      headers: { "User-Agent": "AutohusetVestSync/1.0 (+https://autohusetvest.dk)" },
    });
    if (!res.ok) {
      return jsonResponse({ error: `Kunne ikke hente One2move-siden (status ${res.status}).` }, 502);
    }
    const html = await res.text();
    const cars = parseDepartmentPage(html);

    const supabase = getServiceClient();
    let created = 0;
    let updated = 0;
    const currentExternalIds: string[] = [];

    for (const car of cars) {
      const { make, model } = splitMakeModel(car.title);
      // One2move har ikke annonce-id'er – nøglen sammensættes derfor af titel +
      // årgang, så samme biltype på siden genkendes ved næste synkronisering.
      const externalId = slugify(`${car.title}-${car.modelYear ?? "ukendt"}`);
      currentExternalIds.push(externalId);
      const slug = `${externalId}-udlejning`;

      const { data: existing } = await supabase
        .from("vehicles")
        .select("id")
        .eq("organization_id", ORGANIZATION_ID)
        .eq("external_source", "one2move")
        .eq("external_id", externalId)
        .maybeSingle();

      const vehicleRow = {
        organization_id: ORGANIZATION_ID,
        listing_type: "rental",
        make,
        model,
        body_type: car.category,
        model_year: car.modelYear,
        doors: car.doors,
        seats: car.seats,
        fuel_type: car.fuelType ? FUEL_MAP[car.fuelType.toLowerCase()] ?? null : null,
        transmission: car.transmission ? TRANSMISSION_MAP[car.transmission.toLowerCase()] ?? null : null,
        slug,
        // vehicle_status-enum har ikke "available" – "published" er den offentligt
        // synlige status (se 0001-migrationen). Ledig/optaget for selve udlejningen
        // styres separat via rental_details.availability_status.
        status: "published",
        external_source: "one2move",
        external_id: externalId,
        external_url: DEPARTMENT_URL,
        last_synced_at: new Date().toISOString(),
      };

      let vehicleId = existing?.id as string | undefined;
      if (existing) {
        await supabase.from("vehicles").update(vehicleRow).eq("id", existing.id);
        updated++;
      } else {
        const { data: inserted } = await supabase.from("vehicles").insert(vehicleRow).select("id").single();
        vehicleId = inserted?.id;
        created++;
      }

      if (vehicleId) {
        await supabase.from("rental_details").upsert({
          vehicle_id: vehicleId,
          organization_id: ORGANIZATION_ID,
          price_per_day_dkk: car.pricePerDayDkk,
          availability_status: "available",
        });
      }
    }

    // Lejebiltyper der ikke længere findes på afdelingssiden markeres som ikke
    // tilgængelige, i stedet for at blive slettet.
    const { data: staleRows } = await supabase
      .from("vehicles")
      .select("id")
      .eq("organization_id", ORGANIZATION_ID)
      .eq("external_source", "one2move")
      .eq("status", "published")
      .not("external_id", "in", `(${currentExternalIds.map((id) => `"${id}"`).join(",") || '""'})`);

    let markedUnavailable = 0;
    if (staleRows?.length) {
      const ids = staleRows.map((r) => r.id);
      await supabase.from("vehicles").update({ status: "archived" }).in("id", ids);
      await supabase.from("rental_details").update({ availability_status: "maintenance" }).in("vehicle_id", ids);
      markedUnavailable = staleRows.length;
    }

    return jsonResponse({ ok: true, found: cars.length, created, updated, markedUnavailable });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Ukendt fejl" }, 500);
  }
});
