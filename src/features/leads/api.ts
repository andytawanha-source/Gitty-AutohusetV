import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { getAttribution } from "@/lib/attribution";
import { resolveBrandKey } from "@/config/brands";
import { normalizePlate } from "@/lib/plate";
import {
  CONSENT_TEXT_VERSION,
  PRIVACY_POLICY_VERSION,
  type ConsentStepInput,
  type SellCarState,
} from "./schema";

export interface SubmitLeadResult {
  reference: string;
  isDemo: boolean;
}

/**
 * Indsender et salgslead.
 *  - Demo-mode: simulerer indsendelse og genererer en demo-reference.
 *  - Supabase: Edge Function `submit-lead` opretter leadet transaktionelt og
 *    returnerer signerede upload-URL'er til den PRIVATE lead-images bucket.
 *    E-mail-fejl server-side sletter aldrig leadet (spec pkt. 25).
 */
export async function submitSellCarLead(
  state: SellCarState,
  consent: ConsentStepInput
): Promise<SubmitLeadResult> {
  if (!state.plate || !state.condition || !state.contact) {
    throw new Error("Udfyld venligst alle trin, før du sender.");
  }
  if (state.contact.website) {
    // Honeypot udfyldt → lad som om alt gik godt uden at gemme noget
    return { reference: "TAK", isDemo: true };
  }

  const payload = {
    brandKey: resolveBrandKey(),
    registrationNumber: normalizePlate(state.plate.registrationNumber),
    mileageKm: state.plate.mileageKm,
    lookup: state.lookup ?? null,
    manualVehicle: state.manualVehicle ?? null,
    condition: state.condition,
    contact: {
      name: state.contact.name,
      phone: state.contact.phone,
      email: state.contact.email,
      postalCode: state.contact.postalCode,
      preferredChannel: state.contact.preferredChannel,
      bestContactTime: state.contact.bestContactTime ?? null,
      message: state.contact.message ?? null,
    },
    consents: {
      processing: true,
      marketing: consent.marketingConsent ?? false,
      marketingChannels: consent.marketingChannels ?? [],
      consentTextVersion: CONSENT_TEXT_VERSION,
      privacyPolicyVersion: PRIVACY_POLICY_VERSION,
    },
    attribution: getAttribution() ?? {},
    photos: state.photos.map((p) => ({ category: p.category, fileName: p.file.name, contentType: p.file.type })),
    // "Byt din bil"-kontekst: hvilken bil på lageret henvendelsen udspringer fra, og det
    // automatisk beregnede skøn, der blev vist for brugeren (IKKE et bindende tilbud).
    interestVehicle: state.interestVehicle ?? null,
    estimate: state.estimate ?? null,
  };

  if (!isSupabaseConfigured) {
    await new Promise((r) => setTimeout(r, 900));
    const reference = `DEMO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    // eslint-disable-next-line no-console
    console.info("[DEMO-MODE] Salgslead modtaget (ikke gemt):", payload);
    return { reference, isDemo: true };
  }

  const { data, error } = await getSupabase().functions.invoke("submit-lead", { body: payload });
  if (error || !data?.reference) {
    throw new Error("Din henvendelse kunne ikke sendes. Prøv igen, eller ring til os.");
  }

  // Upload billeder til privat bucket via signerede upload-URL'er
  const uploads: Array<{ path: string; token: string }> = data.uploads ?? [];
  await Promise.allSettled(
    uploads.map((upload, i) => {
      const photo = state.photos[i];
      if (!photo) return Promise.resolve();
      return getSupabase()
        .storage.from("lead-images")
        .uploadToSignedUrl(upload.path, upload.token, photo.file, { contentType: photo.file.type });
    })
  );

  return { reference: data.reference as string, isDemo: false };
}
