const dkkFormatter = new Intl.NumberFormat("da-DK", {
  style: "currency",
  currency: "DKK",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("da-DK", { maximumFractionDigits: 0 });

/** Formaterer en kontantpris, fx 249900 → "249.900 kr." */
export function formatPrice(priceDkk: number): string {
  return dkkFormatter.format(priceDkk).replace("kr.", "kr.").trim();
}

/** Formaterer kilometerstand, fx 85000 → "85.000 km" */
export function formatMileage(km: number): string {
  return `${numberFormatter.format(km)} km`;
}

/** Månedlig ydelse med tydelig markering, fx "2.495 kr./md." */
export function formatMonthlyPrice(priceDkk: number): string {
  return `${numberFormatter.format(priceDkk)} kr./md.`;
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("da-DK", { dateStyle: "long" }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("da-DK", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso)
  );
}
