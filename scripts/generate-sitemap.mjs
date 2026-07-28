/**
 * Genererer public/sitemap.xml.
 * Kør ved build/deploy: SITE_URL=https://ditdomæne.dk node scripts/generate-sitemap.mjs
 * Med Supabase-adgang (SUPABASE_URL + SUPABASE_ANON_KEY + BRAND_KEY) medtages bilernes detaljesider.
 * Kladder medtages ALDRIG (kun published/reserved/sold kan læses anonymt pga. RLS).
 */
import { writeFileSync, mkdirSync } from "node:fs";

const siteUrl = (process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? "").replace(/\/$/, "");
if (!siteUrl) {
  // Ingen SITE_URL sat (fx lokal dev-build) – spring sitemap-generering over uden at fejle
  // buildet, så "npm run build" altid kan køre trygt, også før domænet er sat op i Vercel.
  console.warn("SITE_URL ikke sat – springer sitemap.xml-generering over (sæt SITE_URL i Vercel for at aktivere).");
  process.exit(0);
}

const staticPaths = [
  "/", "/biler", "/solgte-biler", "/saelg-din-bil", "/finansiering", "/om-os", "/kontakt",
  "/privatlivspolitik", "/cookiepolitik", "/cookieindstillinger", "/handelsbetingelser",
  "/vilkaar-bilvurdering", "/juridiske-forbehold", "/finansieringsforbehold", "/klagevejledning",
];

async function fetchVehicleSlugs() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  const brandKey = process.env.BRAND_KEY ?? process.env.VITE_BRAND_KEY;
  if (!supabaseUrl || !anonKey || !brandKey) return [];
  try {
    const brandRes = await fetch(
      `${supabaseUrl}/rest/v1/brands?brand_key=eq.${brandKey}&select=organization_id`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } }
    );
    const [brand] = await brandRes.json();
    if (!brand) return [];
    const res = await fetch(
      `${supabaseUrl}/rest/v1/vehicles?organization_id=eq.${brand.organization_id}&status=in.(published,reserved)&select=slug,updated_at`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } }
    );
    const rows = await res.json();
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    console.warn("Kunne ikke hente biler til sitemap:", err.message);
    return [];
  }
}

const vehicles = await fetchVehicleSlugs();
const now = new Date().toISOString().slice(0, 10);

const urls = [
  ...staticPaths.map((p) => ({ loc: `${siteUrl}${p}`, lastmod: now })),
  ...vehicles.map((v) => ({
    loc: `${siteUrl}/biler/${v.slug}`,
    lastmod: (v.updated_at ?? now).slice(0, 10),
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join("\n")}
</urlset>
`;

mkdirSync("public", { recursive: true });
writeFileSync("public/sitemap.xml", xml);
console.log(`sitemap.xml genereret med ${urls.length} URL'er (${vehicles.length} biler).`);
