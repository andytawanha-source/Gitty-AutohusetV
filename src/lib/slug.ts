/** Genererer SEO-venlige slugs med korrekt håndtering af æ/ø/å. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Slug for en bil, fx "vw-id4-pro-performance-2022". Tilføj uniqueSuffix ved kollision. */
export function vehicleSlug(parts: {
  make: string;
  model: string;
  variant?: string | null;
  year?: number | null;
  uniqueSuffix?: string;
}): string {
  const segments = [
    parts.make,
    parts.model,
    parts.variant ?? "",
    String(parts.year ?? ""),
    parts.uniqueSuffix ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return slugify(segments);
}
