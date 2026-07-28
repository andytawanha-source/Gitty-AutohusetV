/**
 * Provider-uafhængig trackingadapter (fuld implementering med consent-gating i Fase 5).
 * Alle events pushes til en ensartet dataLayer. INGEN persondata i events.
 */

export type TrackingEvent =
  | "page_view"
  | "view_vehicle"
  | "search_inventory"
  | "apply_vehicle_filter"
  | "favorite_vehicle"
  | "click_phone"
  | "click_email"
  | "start_vehicle_inquiry"
  | "submit_vehicle_inquiry"
  | "start_sell_car"
  | "start_sell_car_cta"
  | "plate_lookup_started"
  | "plate_lookup_success"
  | "plate_lookup_failed"
  | "sell_car_step_completed"
  | "submit_sell_car_lead"
  | "book_test_drive"
  | "finance_inquiry"
  | "lead_confirmed";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(event: TrackingEvent, params: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...params });
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[track]", event, params);
  }
}
