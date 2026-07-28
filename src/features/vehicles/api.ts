import { useQuery } from "@tanstack/react-query";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { brands, resolveBrandKey, type BrandKey } from "@/config/brands";
import { getDemoVehicles } from "./demoData";
import { applyFilters, sortVehicles, type SortKey, type VehicleFilters } from "./filters";
import type { RentalDetails, Vehicle, VehicleImage } from "./types";

/**
 * Dataadgang for biler. To tilstande:
 *  - Demo-mode (Supabase ikke konfigureret): lokale, tydeligt fiktive demodata.
 *  - Supabase: hele det offentlige lager for lager-organisationen (brandets egen,
 *    eller `inventoryBrandKey`s organisation ved delt lager) hentes og caches
 *    via TanStack Query; filtrering/sortering sker klient-side (lagre < ~500 biler).
 *    RLS sikrer, at kun published/reserved/sold rækker kan læses anonymt.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Vehicle {
  const images: VehicleImage[] = (row.vehicle_images ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((img: any) => ({
      id: img.id,
      url: publicImageUrl(img.storage_path),
      altText: img.alt_text ?? `${row.make} ${row.model}`,
      isPrimary: img.is_primary,
      sortOrder: img.sort_order,
    }))
    .sort((a: VehicleImage, b: VehicleImage) => a.sortOrder - b.sortOrder);

  return {
    id: row.id,
    organizationId: row.organization_id,
    make: row.make,
    model: row.model,
    variant: row.variant,
    modelYear: row.model_year,
    firstRegistration: row.first_registration,
    mileageKm: row.mileage_km,
    priceDkk: row.price_dkk,
    monthlyPriceDkk: row.monthly_price_dkk,
    fuelType: row.fuel_type,
    transmission: row.transmission,
    bodyType: row.body_type,
    color: row.color,
    doors: row.doors,
    seats: row.seats,
    powerHp: row.power_hp,
    engine: row.engine,
    batteryKwh: row.battery_kwh,
    rangeKm: row.range_km,
    consumption: row.consumption,
    taxPeriodDkk: row.tax_period_dkk,
    registrationNumber: row.show_registration_number ? row.registration_number : null,
    showRegistrationNumber: row.show_registration_number,
    description: row.description,
    equipment: row.equipment ?? [],
    badges: row.badges ?? [],
    isFeatured: row.is_featured,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    slug: row.slug,
    status: row.status,
    soldAt: row.sold_at,
    createdAt: row.created_at,
    images,
    listingType: row.listing_type ?? "sale",
  };
}

function publicImageUrl(storagePath: string): string {
  if (storagePath.startsWith("/") || storagePath.startsWith("http")) return storagePath;
  return getSupabase().storage.from("vehicle-images").getPublicUrl(storagePath).data.publicUrl;
}

/**
 * Organisationen der ejer LAGERET (biler + lejebiler) for det aktuelle brand.
 * Er `inventoryBrandKey` sat i brandkonfigurationen, læses lageret fra det brands
 * organisation i stedet – så flere brands kan vise samme scrapede lager, mens
 * leads/forespørgsler/bookinger fortsat gemmes på brandets EGEN organisation.
 * MÅ KUN bruges til læsning af biler/lejebiler.
 */
function resolveInventoryBrandKey(): BrandKey {
  const brandKey = resolveBrandKey();
  return brands[brandKey].inventoryBrandKey ?? brandKey;
}

/** Cache pr. brand_key – organisation-id'et ændrer sig ikke i en session. */
const organizationIdCache = new Map<BrandKey, Promise<string>>();

async function resolveInventoryOrganizationId(): Promise<string> {
  const brandKey = resolveInventoryBrandKey();
  const cached = organizationIdCache.get(brandKey);
  if (cached) return cached;

  const pending = (async () => {
    const { data, error } = await getSupabase()
      .from("brands")
      .select("organization_id")
      .eq("brand_key", brandKey)
      .single();
    if (error) throw error;
    return data.organization_id as string;
  })();

  organizationIdCache.set(brandKey, pending);
  pending.catch(() => organizationIdCache.delete(brandKey));
  return pending;
}

async function fetchAllPublicVehicles(): Promise<Vehicle[]> {
  if (!isSupabaseConfigured) return getDemoVehicles();
  const orgId = await resolveInventoryOrganizationId();
  // Eksplicit kolonneliste: anonyme har IKKE adgang til vin/internal_notes,
  // og "*" ville derfor få hele forespørgslen afvist af Postgres' kolonnerettigheder.
  const PUBLIC_COLUMNS =
    "id, organization_id, make, model, variant, model_year, first_registration, mileage_km, " +
    "price_dkk, monthly_price_dkk, fuel_type, transmission, body_type, color, doors, seats, " +
    "power_hp, engine, battery_kwh, range_km, consumption, tax_period_dkk, registration_number, " +
    "show_registration_number, description, equipment, badges, is_featured, seo_title, " +
    "seo_description, slug, status, publish_at, sold_at, created_at, listing_type";
  const { data, error } = await getSupabase()
    .from("vehicles")
    .select(`${PUBLIC_COLUMNS}, vehicle_images(*)`)
    .eq("organization_id", orgId)
    .eq("listing_type", "sale")
    .in("status", ["published", "reserved", "sold"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

const INVENTORY_KEY = ["vehicles", "public-inventory"];

export function useInventory() {
  return useQuery({ queryKey: INVENTORY_KEY, queryFn: fetchAllPublicVehicles });
}

export type RentalVehicle = Vehicle & { rentalDetails: RentalDetails | null };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRentalDetails(row: any): RentalDetails {
  return {
    pricePerDayDkk: row.price_per_day_dkk,
    pricePerWeekDkk: row.price_per_week_dkk,
    pricePerMonthDkk: row.price_per_month_dkk,
    depositDkk: row.deposit_dkk,
    includedKmPerDay: row.included_km_per_day,
    extraKmPriceDkk: row.extra_km_price_dkk,
    minAge: row.min_age,
    licenseRequirement: row.license_requirement,
    availabilityStatus: row.availability_status,
    pickupLocation: row.pickup_location,
    insuranceInfo: row.insurance_info,
    extraFeesText: row.extra_fees_text,
  };
}

/**
 * Lejebiler (listing_type = 'rental'), fx synkroniseret automatisk fra One2move (se
 * supabase/functions/sync-one2move-rental). I demo-mode (Supabase ikke konfigureret)
 * returneres en tom liste – der er ikke separate lejebil-demodata.
 */
async function fetchAllPublicRentalVehicles(): Promise<RentalVehicle[]> {
  if (!isSupabaseConfigured) return [];
  const orgId = await resolveInventoryOrganizationId();
  const PUBLIC_COLUMNS =
    "id, organization_id, make, model, variant, model_year, first_registration, mileage_km, " +
    "price_dkk, monthly_price_dkk, fuel_type, transmission, body_type, color, doors, seats, " +
    "power_hp, engine, battery_kwh, range_km, consumption, tax_period_dkk, registration_number, " +
    "show_registration_number, description, equipment, badges, is_featured, seo_title, " +
    "seo_description, slug, status, publish_at, sold_at, created_at, listing_type";
  const { data, error } = await getSupabase()
    .from("vehicles")
    .select(
      `${PUBLIC_COLUMNS}, vehicle_images(*), rental_details(price_per_day_dkk, price_per_week_dkk, price_per_month_dkk, deposit_dkk, included_km_per_day, extra_km_price_dkk, min_age, license_requirement, availability_status, pickup_location, insurance_info, extra_fees_text)`,
    )
    .eq("organization_id", orgId)
    .eq("listing_type", "rental")
    .in("status", ["published", "reserved"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rentalRow: any = Array.isArray(row.rental_details) ? row.rental_details[0] : row.rental_details;
    return { ...mapRow(row), rentalDetails: rentalRow ? mapRentalDetails(rentalRow) : null };
  });
}

const RENTAL_INVENTORY_KEY = ["vehicles", "public-rental-inventory"];

export function useRentalInventory() {
  return useQuery({ queryKey: RENTAL_INVENTORY_KEY, queryFn: fetchAllPublicRentalVehicles });
}

export function useRentalVehicle(slug: string | undefined) {
  const inventory = useRentalInventory();
  const vehicle = slug && inventory.data ? inventory.data.find((v) => v.slug === slug) : undefined;
  return { ...inventory, vehicle };
}

export function useVehicles(filters: VehicleFilters, sort: SortKey = "newest") {
  const inventory = useInventory();
  const vehicles = inventory.data ? sortVehicles(applyFilters(inventory.data, filters), sort) : undefined;
  return { ...inventory, vehicles };
}

export function useVehicle(slug: string | undefined) {
  const inventory = useInventory();
  const vehicle = slug && inventory.data ? inventory.data.find((v) => v.slug === slug) : undefined;
  return { ...inventory, vehicle };
}

/** Registrerer en (anonym, aggregeret) visning – no-op i demo-mode. */
export async function registerVehicleView(vehicleId: string): Promise<void> {
  if (!isSupabaseConfigured || vehicleId.startsWith("demo-")) return;
  try {
    await getSupabase().rpc("increment_vehicle_view", { p_vehicle_id: vehicleId });
  } catch {
    // Visningsstatistik må aldrig påvirke brugeroplevelsen
  }
}

/** Unikke værdier til filterdropdowns baseret på det aktuelle lager. */
export function getFilterOptions(vehicles: Vehicle[]) {
  const uniq = (values: (string | null)[]) =>
    [...new Set(values.filter((v): v is string => Boolean(v)))].sort((a, b) => a.localeCompare(b, "da"));
  return {
    makes: uniq(vehicles.map((v) => v.make)),
    modelsByMake: (make: string) => uniq(vehicles.filter((v) => v.make === make).map((v) => v.model)),
    bodyTypes: uniq(vehicles.map((v) => v.bodyType)),
    colors: uniq(vehicles.map((v) => v.color)),
  };
}
