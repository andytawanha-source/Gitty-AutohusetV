/**
 * First-touch-attribution: UTM-parametre og klik-ID'er gemmes i sessionStorage
 * ved første sidevisning og vedhæftes leads/forespørgsler (jf. spec pkt. 12/17).
 * Ingen rå kontaktoplysninger gemmes.
 */

export interface Attribution {
  landing_page: string;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  gclid: string | null;
  fbclid: string | null;
  device_type: "mobile" | "tablet" | "desktop";
  campaign_code: string | null;
}

const KEY = "autohuset:attribution";

function detectDevice(): Attribution["device_type"] {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export function captureAttribution(): void {
  try {
    if (sessionStorage.getItem(KEY)) return; // first touch vinder
    const params = new URLSearchParams(window.location.search);
    const attribution: Attribution = {
      landing_page: window.location.pathname,
      referrer: document.referrer || null,
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_content: params.get("utm_content"),
      utm_term: params.get("utm_term"),
      gclid: params.get("gclid"),
      fbclid: params.get("fbclid"),
      device_type: detectDevice(),
      campaign_code: params.get("kampagne"),
    };
    sessionStorage.setItem(KEY, JSON.stringify(attribution));
  } catch {
    // sessionStorage utilgængelig – attribution er ikke kritisk
  }
}

export function getAttribution(): Attribution | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    return null;
  }
}
