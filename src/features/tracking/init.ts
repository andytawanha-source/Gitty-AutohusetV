/**
 * Trackinginitialisering med Google Consent Mode v2 (spec pkt. 17).
 * INGEN ikke-nødvendige scripts indlæses, før brugeren har givet samtykke.
 * Platforme konfigureres udelukkende via env-ID'er og kan tilsluttes senere.
 */

import type { ConsentState } from "@/features/consent/ConsentProvider";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean };
    _fbq?: unknown;
  }
}

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer ?? [];
  // Google kræver arguments-objektet – push af arrays er ikke nok for consent-kommandoer
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments as unknown as Record<string, unknown>);
  void args;
}

/** Kaldes ved app-start FØR noget andet: alt ikke-nødvendigt denied som default. */
export function initConsentMode(): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = window.gtag ?? (gtag as Window["gtag"]);
  window.gtag!("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
    security_storage: "granted",
    wait_for_update: 500,
  });
}

let scriptsLoaded = { gtm: false, ga4: false, meta: false };

function loadScript(src: string, id: string): void {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  s.id = id;
  document.head.appendChild(s);
}

/** Opdaterer Consent Mode og indlæser scripts svarende til samtykket. */
export function applyConsentToTracking(consent: ConsentState): void {
  if (typeof window === "undefined") return;

  window.gtag?.("consent", "update", {
    analytics_storage: consent.statistics ? "granted" : "denied",
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
    functionality_storage: consent.functional ? "granted" : "denied",
    personalization_storage: consent.functional ? "granted" : "denied",
  });

  const gtmId = import.meta.env.VITE_GTM_ID;
  const ga4Id = import.meta.env.VITE_GA4_ID;
  const metaPixelId = import.meta.env.VITE_META_PIXEL_ID;

  // GTM indlæses ved statistik ELLER marketing (tags styres derefter af Consent Mode i GTM)
  if (gtmId && !scriptsLoaded.gtm && (consent.statistics || consent.marketing)) {
    scriptsLoaded.gtm = true;
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    loadScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`, "gtm-script");
  }

  // GA4 direkte (uden GTM), kun ved statistiksamtykke
  if (ga4Id && !gtmId && !scriptsLoaded.ga4 && consent.statistics) {
    scriptsLoaded.ga4 = true;
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`, "ga4-script");
    window.gtag?.("js", new Date());
    window.gtag?.("config", ga4Id, { anonymize_ip: true });
  }

  // Meta Pixel – kun ved marketingsamtykke
  if (metaPixelId && !scriptsLoaded.meta && consent.marketing) {
    scriptsLoaded.meta = true;
    const fbq: Window["fbq"] = function (...args: unknown[]) {
      (fbq!.queue = fbq!.queue ?? []).push(args);
    } as Window["fbq"];
    window.fbq = window.fbq ?? fbq;
    window._fbq = window._fbq ?? fbq;
    loadScript("https://connect.facebook.net/en_US/fbevents.js", "meta-pixel-script");
    window.fbq?.("init", metaPixelId);
    window.fbq?.("track", "PageView");
  }
}

/** Kun til test */
export function resetTrackingForTest(): void {
  scriptsLoaded = { gtm: false, ga4: false, meta: false };
}
