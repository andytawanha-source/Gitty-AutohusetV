import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { normalizePlate } from "@/lib/plate";
import { mockProvider } from "./mockProvider";
import type { LookupOutcome } from "./types";

/**
 * Klient-API for nummerpladeopslag.
 *  - Demo-mode: lokal mock-provider (tydeligt markeret i UI via isMock).
 *  - Supabase: Edge Function `plate-lookup` (API-nøgler findes kun server-side).
 * Klient-side begrænsning af gentagne opslag; den autoritative rate limit ligger server-side.
 */

const attempts: number[] = [];
const MAX_ATTEMPTS_PER_MINUTE = 5;

function clientRateLimited(): boolean {
  const cutoff = Date.now() - 60_000;
  while (attempts.length && attempts[0] < cutoff) attempts.shift();
  if (attempts.length >= MAX_ATTEMPTS_PER_MINUTE) return true;
  attempts.push(Date.now());
  return false;
}

export async function lookupPlate(registrationNumber: string): Promise<LookupOutcome> {
  const plate = normalizePlate(registrationNumber);
  if (clientRateLimited()) return { status: "rate_limited" };

  if (!isSupabaseConfigured) {
    try {
      const result = await mockProvider.lookupByRegistration(plate);
      return { status: "success", result };
    } catch (err) {
      if (err instanceof Error && err.name === "NotFoundError") return { status: "not_found" };
      return { status: "error" };
    }
  }

  try {
    const { data, error } = await getSupabase().functions.invoke("plate-lookup", {
      body: { registrationNumber: plate },
    });
    if (error) return { status: "error", message: "Opslaget kunne ikke gennemføres. Prøv igen." };
    return data as LookupOutcome;
  } catch {
    return { status: "error", message: "Opslaget kunne ikke gennemføres. Prøv igen." };
  }
}
