export const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Begræns til brandets domæner før produktion
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function handleOptions(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  return null;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
// Edge Function: plate-lookup
// Server-side nummerpladeopslag med provider-abstraktion, rate limiting,
// feature flag og logging uden eksponering af API-nøgler (spec pkt. 11).
// Understøttede providers: mock (default) · motorapi (motorapi.dk) · generisk HTTP.
// deno-lint-ignore-file no-explicit-any

import { createClient } from "npm:@supabase/supabase-js@2";


interface NormalizedResult {
  provider: string;
  isMock: boolean;
  registrationNumber: string;
  make?: string;
  model?: string;
  variant?: string;
  modelYear?: number;
  firstRegistrationDate?: string;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  color?: string;
  engineSize?: number;
  powerHp?: number;
  powerKw?: number;
  batteryCapacityKwh?: number;
  electricRangeKm?: number;
  curbWeightKg?: number;
  totalWeightKg?: number;
  registrationStatus?: string;
  inspectionDate?: string;
  nextInspectionDate?: string;
  equipment?: string[];
  rawProviderData?: Record<string, unknown>;
}

const PLATE_RE = /^[A-ZÆØÅ0-9]{2,7}$/;
const MAX_PER_MINUTE_PER_IP = 5;
const MAX_PER_HOUR_PER_IP = 20;
const TIMEOUT_MS = 8000;
const MAX_RETRIES = 1;

async function sha256(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );
}

/** Mock-provider – bruges når VEHICLE_LOOKUP_PROVIDER=mock eller mangler. */
function mockLookup(plate: string): NormalizedResult | null {
  if (plate.startsWith("XX")) return null;
  const templates = [
    { make: "Volkswagen", model: "Golf", variant: "1.5 TSI Style", modelYear: 2019, fuelType: "Benzin", transmission: "Manuel", color: "Grå" },
    { make: "Toyota", model: "Corolla", variant: "1.8 Hybrid Active", modelYear: 2021, fuelType: "Hybrid", transmission: "Automatisk", color: "Sort" },
    { make: "Tesla", model: "Model Y", variant: "Long Range AWD", modelYear: 2022, fuelType: "El", transmission: "Automatisk", color: "Hvid", batteryCapacityKwh: 75, electricRangeKm: 533 },
    { make: "Ford", model: "Focus", variant: "1.0 EcoBoost Titanium", modelYear: 2018, fuelType: "Benzin", transmission: "Manuel", color: "Blå" },
  ];
  let h = 0;
  for (const ch of plate) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { provider: "mock", isMock: true, registrationNumber: plate, ...templates[h % templates.length] };
}

async function fetchWithRetry(url: string, headers: Record<string, string>): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

/**
 * MotorAPI (motorapi.dk) – dansk nummerplade-API. 100 gratis opslag/dag.
 * Endpoint: GET https://v1.motorapi.dk/vehicles/{plade}
 * Auth: X-AUTH-TOKEN-header (nøglen fra velkomstmailen – verificér header-navnet dér).
 * Bemærk: engine_power leveres i kW (fx 200.0 kW ≈ 272 hk), engine_volume i ccm.
 * VIN gemmes kun i rawProviderData og eksponeres aldrig offentligt.
 */
async function motorApiLookup(plate: string): Promise<NormalizedResult | null> {
  const baseUrl = Deno.env.get("VEHICLE_LOOKUP_API_URL") || "https://v1.motorapi.dk/vehicles";
  const apiKey = Deno.env.get("VEHICLE_LOOKUP_API_KEY");
  if (!apiKey) throw new Error("VEHICLE_LOOKUP_API_KEY mangler");

  const res = await fetchWithRetry(`${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(plate)}`, {
    "X-AUTH-TOKEN": apiKey,
    Accept: "application/json",
  });

  if (res.status === 404) return null;
  if (res.status === 429) throw new Error("Leverandørens rate limit er nået");
  if (!res.ok) throw new Error(`MotorAPI svarede HTTP ${res.status}`);
  const data: any = await res.json();
  if (!data || !data.registration_number) return null;

  const powerKw = typeof data.engine_power === "number" ? data.engine_power : undefined;
  return {
    provider: "motorapi",
    isMock: false,
    registrationNumber: plate,
    make: capitalize(data.make),
    model: data.model ?? undefined,
    variant: data.variant ?? undefined,
    modelYear: data.model_year ?? undefined,
    // status_date er datoen for den aktuelle registrering
    firstRegistrationDate: typeof data.status_date === "string" ? data.status_date.slice(0, 10) : undefined,
    fuelType: data.fuel_type ?? undefined,
    transmission: undefined, // ikke et selvstændigt felt hos MotorAPI (fremgår evt. af variant)
    bodyType: data.chassis_type ?? data.type ?? undefined,
    color: data.color ?? undefined,
    engineSize: typeof data.engine_volume === "number" ? Math.round(data.engine_volume / 100) / 10 : undefined,
    powerKw,
    powerHp: powerKw !== undefined ? Math.round(powerKw * 1.359) : undefined,
    curbWeightKg: data.own_weight || undefined,
    totalWeightKg: data.total_weight || undefined,
    registrationStatus: data.status ?? undefined,
    // Gem kun rå data hvis licensvilkårene tillader det – bekræft med MotorAPI (LEGAL-CHECKLIST pkt. 22)
    rawProviderData: data,
  };
}

function capitalize(value: unknown): string | undefined {
  if (typeof value !== "string" || !value) return undefined;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/** Generisk HTTP-provider til andre leverandører (feltmapping tilpasses pr. leverandør). */
async function httpProviderLookup(plate: string, provider: string): Promise<NormalizedResult | null> {
  const baseUrl = Deno.env.get("VEHICLE_LOOKUP_API_URL");
  const apiKey = Deno.env.get("VEHICLE_LOOKUP_API_KEY");
  if (!baseUrl || !apiKey) throw new Error("Provider er ikke konfigureret");

  const res = await fetchWithRetry(`${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(plate)}`, {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Provider svarede HTTP ${res.status}`);
  const data: any = await res.json();

  return {
    provider,
    isMock: false,
    registrationNumber: plate,
    make: data.make ?? data.maerke,
    model: data.model,
    variant: data.variant,
    modelYear: data.modelYear ?? data.model_year,
    firstRegistrationDate: data.firstRegistrationDate ?? data.first_registration,
    fuelType: data.fuelType ?? data.fuel_type ?? data.fuel,
    transmission: data.transmission,
    bodyType: data.bodyType ?? data.body_type,
    color: data.color,
    engineSize: data.engineSize,
    powerHp: data.powerHp ?? data.hp,
    powerKw: data.powerKw ?? data.kw,
    batteryCapacityKwh: data.batteryCapacityKwh,
    electricRangeKm: data.electricRangeKm,
    curbWeightKg: data.curbWeightKg,
    totalWeightKg: data.totalWeightKg,
    registrationStatus: data.registrationStatus ?? data.status,
    inspectionDate: data.inspectionDate,
    nextInspectionDate: data.nextInspectionDate,
    equipment: data.equipment,
    rawProviderData: data,
  };
}

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "POST") return jsonResponse({ status: "error" }, 405);

  const started = Date.now();
  const supabase = adminClient();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = await sha256(ip);

  let plate = "";
  try {
    const body = await req.json();
    plate = String(body?.registrationNumber ?? "").replace(/[\s\-.]/g, "").toUpperCase();
  } catch {
    return jsonResponse({ status: "error" }, 400);
  }
  if (!PLATE_RE.test(plate)) return jsonResponse({ status: "error", message: "Ugyldig nummerplade" }, 400);

  const plateHash = await sha256(plate);
  const provider = Deno.env.get("VEHICLE_LOOKUP_PROVIDER") ?? "mock";

  const log = async (status: string, errorCode?: string) => {
    try {
      await supabase.from("vehicle_lookup_logs").insert({
        plate_hash: plateHash,
        provider,
        status,
        duration_ms: Date.now() - started,
        error_code: errorCode ?? null,
        ip_hash: ipHash,
      });
    } catch (err) {
      console.error("lookup-log fejlede:", err);
    }
  };

  // Feature flag
  if ((Deno.env.get("VEHICLE_LOOKUP_ENABLED") ?? "true") === "false") {
    await log("disabled");
    return jsonResponse({ status: "disabled" });
  }

  // Rate limiting pr. IP (autoritativ, baseret på logtabellen).
  // Beskytter samtidig MotorAPI's gratis-kvote (100 opslag/dag) mod misbrug.
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count: minuteCount } = await supabase
    .from("vehicle_lookup_logs")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", oneMinuteAgo);
  const { count: hourCount } = await supabase
    .from("vehicle_lookup_logs")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", oneHourAgo);
  if ((minuteCount ?? 0) >= MAX_PER_MINUTE_PER_IP || (hourCount ?? 0) >= MAX_PER_HOUR_PER_IP) {
    await log("rate_limited");
    return jsonResponse({ status: "rate_limited" }, 429);
  }

  try {
    let result: NormalizedResult | null;
    switch (provider) {
      case "mock":
        result = mockLookup(plate);
        break;
      case "motorapi":
        result = await motorApiLookup(plate);
        break;
      default:
        result = await httpProviderLookup(plate, provider);
    }
    if (!result) {
      await log("not_found");
      return jsonResponse({ status: "not_found" });
    }
    await log("success");
    return jsonResponse({ status: "success", result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Opslag fejlede:", message);
    await log("error", message.slice(0, 100));
    return jsonResponse({ status: "error" }, 502);
  }
});
