import type { RentalDetails, SaleDetails, Vehicle } from "@/features/vehicles/types";
import type { AdminRole } from "./auth";

/** Bil med private adminfelter (eksponeres aldrig offentligt). */
export interface AdminVehicle extends Vehicle {
  internalNotes: string | null;
  vin: string | null;
  publishAt: string | null;
  updatedAt: string;
  saleDetails: SaleDetails | null;
  rentalDetails: RentalDetails | null;
}

export type AdminLeadStatus =
  | "new"
  | "in_progress"
  | "contact_attempted"
  | "contacted"
  | "awaiting_info"
  | "assessed"
  | "offer_sent"
  | "accepted"
  | "rejected"
  | "won"
  | "lost"
  | "archived";

export const LEAD_STATUS_LABELS: Record<AdminLeadStatus, string> = {
  new: "Ny",
  in_progress: "Under behandling",
  contact_attempted: "Kontakt forsøgt",
  contacted: "Kontaktet",
  awaiting_info: "Afventer information",
  assessed: "Vurderet",
  offer_sent: "Tilbud sendt",
  accepted: "Accepteret",
  rejected: "Afvist",
  won: "Vundet",
  lost: "Tabt",
  archived: "Arkiveret",
};

export interface AdminLead {
  id: string;
  reference: string;
  status: AdminLeadStatus;
  registrationNumber: string;
  mileageKm: number | null;
  source: string;
  createdAt: string;
  assignedTo: string | null;
  followUpAt: string | null;
  lostReason: string | null;
  contact: {
    name: string;
    phone: string;
    email: string;
    postalCode: string | null;
    city: string | null;
    preferredChannel: string | null;
    bestContactTime: string | null;
    message: string | null;
  } | null;
  vehicle: {
    make: string | null;
    model: string | null;
    variant: string | null;
    modelYear: number | null;
    fuelType: string | null;
    transmission: string | null;
    color: string | null;
    provider: string;
    isMock: boolean;
  } | null;
  /** Udfyldt når leadet er en konkret "byt din bil"-forespørgsel startet fra en bils detaljeside. */
  interestVehicle: { id: string; label: string; slug: string | null; priceDkk: number | null } | null;
  /** Det automatisk beregnede skøn, kunden fik vist, inden leadet blev sendt (ikke bindende). */
  estimate: { lowDkk: number; midDkk: number; highDkk: number; sampleSize: number } | null;
}

export interface AdminLeadDetail extends AdminLead {
  condition: Record<string, unknown> | null;
  consents: Array<{ type: string; granted: boolean; version: string; channels: string[]; createdAt: string }>;
  attribution: {
    landingPage: string | null;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    deviceType: string | null;
  } | null;
  images: Array<{ id: string; url: string; category: string | null }>;
  notes: Array<{ id: string; author: string; body: string; createdAt: string }>;
  history: Array<{ from: string | null; to: string; at: string; by: string }>;
}

/**
 * Henvendelser fra vehicle_inquiries (kontakt/prøvetur/finansiering/leje/
 * byttebil-klik). Holdes bevidst adskilt fra "leads" (sælg-din-bil), som har
 * sit eget GDPR-tilpassede skema – men bruger samme statustaksonomi, så begge
 * kan vises samlet i adminpanelets leadindbakke.
 */
export type InquiryType = "contact" | "test_drive" | "finance" | "trade_in" | "rental";

export const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = {
  contact: "Kontakt",
  test_drive: "Prøvetur",
  finance: "Finansiering",
  trade_in: "Byttebil (klik)",
  rental: "Biludlejning",
};

export interface AdminInquiry {
  id: string;
  inquiryType: InquiryType;
  status: AdminLeadStatus;
  createdAt: string;
  assignedTo: string | null;
  followUpAt: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  vehicle: { make: string | null; model: string | null; variant: string | null; slug: string | null; priceDkk: number | null } | null;
}

export interface AdminInquiryDetail extends AdminInquiry {
  attribution: Record<string, unknown> | null;
  notes: Array<{ id: string; author: string; body: string; createdAt: string }>;
  history: Array<{ from: string | null; to: string; at: string; by: string }>;
}

export interface OrgMember {
  id: string;
  name: string;
  email: string | null;
  roles: AdminRole[];
}

export interface AuditLogEntry {
  id: string;
  actorName: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

/** Fælles rækkeform til den samlede leadindbakke, uanset kilde-tabel. */
export type LeadSourceTable = "lead" | "inquiry";

export interface UnifiedLeadRow {
  sourceTable: LeadSourceTable;
  id: string;
  /** "sell_car" for leads-tabellen, ellers InquiryType for vehicle_inquiries. */
  leadType: "sell_car" | InquiryType;
  typeLabel: string;
  reference: string;
  status: AdminLeadStatus;
  createdAt: string;
  assignedTo: string | null;
  followUpAt: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  vehicleLabel: string | null;
  message: string | null;
}
