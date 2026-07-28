export type VehicleStatus = "draft" | "scheduled" | "published" | "reserved" | "sold" | "archived";
export type FuelType = "benzin" | "diesel" | "el" | "hybrid" | "plugin_hybrid" | "andet";
export type Transmission = "manuel" | "automatisk";
export type ListingType = "sale" | "rental";

/** Salgsspecifikke felter (kun relevante når listingType === "sale"). */
export interface SaleDetails {
  downPaymentDkk: number | null;
  deliveryCostDkk: number | null;
  warrantyText: string | null;
  serviceHistoryText: string | null;
  lastServiceDate: string | null;
  ownerCount: number | null;
}

export type RentalAvailability = "available" | "booked" | "maintenance";

/** Udlejningsspecifikke felter (kun relevante når listingType === "rental"). */
export interface RentalDetails {
  pricePerDayDkk: number | null;
  pricePerWeekDkk: number | null;
  pricePerMonthDkk: number | null;
  depositDkk: number | null;
  includedKmPerDay: number | null;
  extraKmPriceDkk: number | null;
  minAge: number | null;
  licenseRequirement: string | null;
  availabilityStatus: RentalAvailability;
  pickupLocation: string | null;
  insuranceInfo: string | null;
  extraFeesText: string | null;
}

export interface VehicleImage {
  id: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Vehicle {
  id: string;
  organizationId: string;
  make: string;
  model: string;
  variant: string | null;
  modelYear: number | null;
  firstRegistration: string | null;
  mileageKm: number | null;
  priceDkk: number | null;
  monthlyPriceDkk: number | null;
  fuelType: FuelType | null;
  transmission: Transmission | null;
  bodyType: string | null;
  color: string | null;
  doors: number | null;
  seats: number | null;
  powerHp: number | null;
  engine: string | null;
  batteryKwh: number | null;
  rangeKm: number | null;
  consumption: string | null;
  taxPeriodDkk: number | null;
  registrationNumber: string | null;
  showRegistrationNumber: boolean;
  description: string | null;
  equipment: string[];
  badges: string[];
  isFeatured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  slug: string;
  status: VehicleStatus;
  soldAt: string | null;
  createdAt: string;
  images: VehicleImage[];
  listingType: ListingType;
}

export const FUEL_LABELS: Record<FuelType, string> = {
  benzin: "Benzin",
  diesel: "Diesel",
  el: "El",
  hybrid: "Hybrid",
  plugin_hybrid: "Plugin-hybrid",
  andet: "Andet",
};

export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  manuel: "Manuel",
  automatisk: "Automatisk",
};
