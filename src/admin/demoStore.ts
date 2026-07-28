import { getDemoVehicles } from "@/features/vehicles/demoData";
import type { Vehicle } from "@/features/vehicles/types";
import type { AdminInquiry, AdminInquiryDetail, AdminLead, AdminLeadDetail, AdminVehicle, AuditLogEntry, OrgMember } from "./types";
import type { AdminRole } from "./auth";

/**
 * In-memory demodatalager til adminpanelet, når Supabase ikke er konfigureret.
 * Ændringer lever kun i browsersessionen og er tydeligt markeret TESTDATA.
 */

let vehicles: AdminVehicle[] | null = null;
let leads: AdminLeadDetail[] | null = null;

function toAdminVehicle(v: Vehicle): AdminVehicle {
  return { ...v, internalNotes: null, vin: null, publishAt: null, updatedAt: v.createdAt, saleDetails: null, rentalDetails: null };
}

export function demoVehicles(): AdminVehicle[] {
  if (!vehicles) {
    vehicles = getDemoVehicles().map(toAdminVehicle);
    // Tilføj en kladde, som kun findes i admin
    vehicles.push({
      ...toAdminVehicle(getDemoVehicles()[0]),
      id: "demo-draft-1",
      make: "Audi",
      model: "A4",
      variant: "Avant 40 TFSI",
      slug: "audi-a4-avant-40-tfsi-2021",
      status: "draft",
      priceDkk: 274900,
      mileageKm: 67000,
      modelYear: 2021,
      badges: [],
      isFeatured: false,
      internalNotes: "TESTDATA: Kladde – afventer billeder.",
      images: [],
    });
    // To lejebiler, så /admin/lejebiler har testdata at vise
    vehicles.push({
      ...toAdminVehicle(getDemoVehicles()[0]),
      id: "demo-rental-1",
      make: "Volkswagen",
      model: "Caddy",
      variant: "Cargo",
      slug: "volkswagen-caddy-cargo-udlejning",
      status: "published",
      listingType: "rental",
      priceDkk: null,
      monthlyPriceDkk: null,
      mileageKm: 38000,
      modelYear: 2022,
      badges: [],
      isFeatured: false,
      internalNotes: "TESTDATA: Lejebil.",
      rentalDetails: {
        pricePerDayDkk: 549,
        pricePerWeekDkk: 2900,
        pricePerMonthDkk: 8900,
        depositDkk: 3000,
        includedKmPerDay: 150,
        extraKmPriceDkk: 2.5,
        minAge: 21,
        licenseRequirement: "Kategori B",
        availabilityStatus: "available",
        pickupLocation: "Islevsdalsvej 200, 2610 Rødovre",
        insuranceInfo: "Fuld kaskoforsikring inkluderet",
        extraFeesText: "Rengøringsgebyr 250 kr. ved aflevering uden rengøring.",
      },
    });
    vehicles.push({
      ...toAdminVehicle(getDemoVehicles()[1]),
      id: "demo-rental-2",
      make: "Skoda",
      model: "Octavia",
      variant: "Combi",
      slug: "skoda-octavia-combi-udlejning",
      status: "published",
      listingType: "rental",
      priceDkk: null,
      monthlyPriceDkk: null,
      mileageKm: 21000,
      modelYear: 2023,
      badges: [],
      isFeatured: false,
      internalNotes: "TESTDATA: Lejebil, aktuelt udlejet.",
      rentalDetails: {
        pricePerDayDkk: 449,
        pricePerWeekDkk: 2400,
        pricePerMonthDkk: 7200,
        depositDkk: 3000,
        includedKmPerDay: 150,
        extraKmPriceDkk: 2,
        minAge: 23,
        licenseRequirement: "Kategori B",
        availabilityStatus: "booked",
        pickupLocation: "Islevsdalsvej 200, 2610 Rødovre",
        insuranceInfo: "Fuld kaskoforsikring inkluderet",
        extraFeesText: null,
      },
    });
  }
  return vehicles;
}

export function demoSaveVehicle(vehicle: AdminVehicle): AdminVehicle {
  const list = demoVehicles();
  const idx = list.findIndex((v) => v.id && v.id === vehicle.id);
  const saved: AdminVehicle =
    idx >= 0
      ? { ...vehicle, updatedAt: new Date().toISOString() }
      : { ...vehicle, id: `demo-new-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  if (idx >= 0) list[idx] = saved;
  else list.unshift(saved);
  return saved;
}

export function demoDeleteVehicle(id: string): void {
  const list = demoVehicles();
  const idx = list.findIndex((v) => v.id === id);
  if (idx >= 0) list.splice(idx, 1);
}

const DEMO_LEADS: AdminLeadDetail[] = [
  {
    id: "demo-lead-1",
    reference: "AVEST-2026-0001",
    status: "new",
    registrationNumber: "AB12345",
    mileageKm: 87000,
    source: "website",
    createdAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
    assignedTo: null,
    followUpAt: null,
    lostReason: null,
    contact: { name: "Test Testesen (TESTDATA)", phone: "+45 00 00 00 01", email: "test1@example.invalid", postalCode: "6700", city: "Esbjerg", preferredChannel: "phone", bestContactTime: "Eftermiddag", message: "Vil gerne sælge hurtigt." },
    vehicle: { make: "Volkswagen", model: "Golf", variant: "1.4 TSI", modelYear: 2017, fuelType: "Benzin", transmission: "Manuel", color: "Grå", provider: "mock", isMock: true },
    interestVehicle: { id: "demo-rental-1", label: "Skoda Kamiq (TESTDATA)", slug: "skoda-octavia-combi-udlejning", priceDkk: 249900 },
    estimate: { lowDkk: 65000, midDkk: 76000, highDkk: 87000, sampleSize: 1 },
    condition: { isDrivable: true, hasServiceBook: true, keyCount: 2, knownDamages: "Lille ridse på bagkofanger", smokeFree: true, hasOutstandingFinance: false, saleTimeline: "Hurtigst muligt" },
    consents: [
      { type: "processing", granted: true, version: "v0.1", channels: [], createdAt: new Date().toISOString() },
      { type: "marketing", granted: false, version: "v0.1", channels: [], createdAt: new Date().toISOString() },
    ],
    attribution: { landingPage: "/saelg-din-bil", utmSource: null, utmMedium: null, utmCampaign: null, deviceType: "mobile" },
    images: [],
    notes: [],
    history: [{ from: null, to: "new", at: new Date(Date.now() - 3 * 3600_000).toISOString(), by: "System" }],
  },
  {
    id: "demo-lead-2",
    reference: "AVEST-2026-0002",
    status: "contacted",
    registrationNumber: "CD67890",
    mileageKm: 145000,
    source: "website",
    createdAt: new Date(Date.now() - 26 * 3600_000).toISOString(),
    assignedTo: "Demo Administrator (TESTDATA)",
    followUpAt: new Date(Date.now() + 24 * 3600_000).toISOString(),
    lostReason: null,
    contact: { name: "Demo Demosen (TESTDATA)", phone: "+45 00 00 00 02", email: "test2@example.invalid", postalCode: "7100", city: "Vejle", preferredChannel: "email", bestContactTime: "Formiddag", message: null },
    vehicle: { make: "Ford", model: "Focus", variant: "1.0 EcoBoost", modelYear: 2015, fuelType: "Benzin", transmission: "Manuel", color: "Blå", provider: "mock", isMock: true },
    interestVehicle: null,
    estimate: null,
    condition: { isDrivable: true, hasServiceBook: false, keyCount: 1, knownDamages: null, smokeFree: true, hasOutstandingFinance: true, saleTimeline: "Inden for en måned" },
    consents: [
      { type: "processing", granted: true, version: "v0.1", channels: [], createdAt: new Date().toISOString() },
      { type: "marketing", granted: true, version: "v0.1", channels: ["email"], createdAt: new Date().toISOString() },
    ],
    attribution: { landingPage: "/", utmSource: "google", utmMedium: "cpc", utmCampaign: "saelg-din-bil-demo", deviceType: "desktop" },
    images: [],
    notes: [{ id: "n1", author: "Demo Administrator (TESTDATA)", body: "Ringet – ønsker tilbud på e-mail.", createdAt: new Date(Date.now() - 20 * 3600_000).toISOString() }],
    history: [
      { from: null, to: "new", at: new Date(Date.now() - 26 * 3600_000).toISOString(), by: "System" },
      { from: "new", to: "contacted", at: new Date(Date.now() - 20 * 3600_000).toISOString(), by: "Demo Administrator (TESTDATA)" },
    ],
  },
  {
    id: "demo-lead-3",
    reference: "AVEST-2026-0003",
    status: "offer_sent",
    registrationNumber: "EF11223",
    mileageKm: 62000,
    source: "website",
    createdAt: new Date(Date.now() - 72 * 3600_000).toISOString(),
    assignedTo: "Demo Administrator (TESTDATA)",
    followUpAt: null,
    lostReason: null,
    contact: { name: "Fiktiv Person (TESTDATA)", phone: "+45 00 00 00 03", email: "test3@example.invalid", postalCode: "6000", city: "Kolding", preferredChannel: "sms", bestContactTime: null, message: "Bilen står i carport." },
    vehicle: { make: "Toyota", model: "C-HR", variant: "1.8 Hybrid", modelYear: 2019, fuelType: "Hybrid", transmission: "Automatisk", color: "Sort", provider: "mock", isMock: true },
    interestVehicle: null,
    estimate: null,
    condition: { isDrivable: true, hasServiceBook: true, keyCount: 2, knownDamages: null, smokeFree: true, hasOutstandingFinance: false, saleTimeline: "Undersøger prisen" },
    consents: [{ type: "processing", granted: true, version: "v0.1", channels: [], createdAt: new Date().toISOString() }],
    attribution: { landingPage: "/saelg-din-bil", utmSource: "facebook", utmMedium: "paid_social", utmCampaign: "brand-demo", deviceType: "mobile" },
    images: [],
    notes: [],
    history: [{ from: null, to: "new", at: new Date(Date.now() - 72 * 3600_000).toISOString(), by: "System" }],
  },
];

export function demoLeads(): AdminLeadDetail[] {
  if (!leads) leads = DEMO_LEADS.map((l) => ({ ...l }));
  return leads;
}

export function demoLeadById(id: string): AdminLeadDetail | undefined {
  return demoLeads().find((l) => l.id === id);
}

export function demoUpdateLead(id: string, patch: Partial<AdminLead>): void {
  const lead = demoLeadById(id);
  if (lead) Object.assign(lead, patch);
}

let inquiries: AdminInquiryDetail[] | null = null;

const DEMO_INQUIRIES: AdminInquiryDetail[] = [
  {
    id: "demo-inq-1",
    inquiryType: "contact",
    status: "new",
    createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    assignedTo: null,
    followUpAt: null,
    name: "Anders Andersen (TESTDATA)",
    phone: "+45 00 00 00 11",
    email: "anders@example.invalid",
    message: "Har I åbent på lørdag? Vil gerne se på en bil.",
    vehicle: null,
    attribution: { landing_page: "/kontakt", utm_source: null },
    notes: [],
    history: [{ from: null, to: "new", at: new Date(Date.now() - 2 * 3600_000).toISOString(), by: "System" }],
  },
  {
    id: "demo-inq-2",
    inquiryType: "test_drive",
    status: "contacted",
    createdAt: new Date(Date.now() - 30 * 3600_000).toISOString(),
    assignedTo: "Demo Administrator (TESTDATA)",
    followUpAt: null,
    name: "Bettina Berg (TESTDATA)",
    phone: "+45 00 00 00 12",
    email: "bettina@example.invalid",
    message: "Vil gerne prøvekøre i weekenden.",
    vehicle: { make: "Volkswagen", model: "Golf", variant: "1.4 TSI", slug: "volkswagen-golf-demo", priceDkk: 189900 },
    attribution: { landing_page: "/biler/volkswagen-golf-demo", utm_source: "google" },
    notes: [{ id: "n1", author: "Demo Administrator (TESTDATA)", body: "Ringet – aftalt lørdag kl. 11.", createdAt: new Date(Date.now() - 25 * 3600_000).toISOString() }],
    history: [
      { from: null, to: "new", at: new Date(Date.now() - 30 * 3600_000).toISOString(), by: "System" },
      { from: "new", to: "contacted", at: new Date(Date.now() - 25 * 3600_000).toISOString(), by: "Demo Administrator (TESTDATA)" },
    ],
  },
  {
    id: "demo-inq-3",
    inquiryType: "finance",
    status: "new",
    createdAt: new Date(Date.now() - 5 * 3600_000).toISOString(),
    assignedTo: null,
    followUpAt: null,
    name: "Carsten Carlsen (TESTDATA)",
    phone: "+45 00 00 00 13",
    email: "carsten@example.invalid",
    message: "Hvad koster finansiering over 60 måneder ca.?",
    vehicle: null,
    attribution: { landing_page: "/finansiering", utm_source: null },
    notes: [],
    history: [{ from: null, to: "new", at: new Date(Date.now() - 5 * 3600_000).toISOString(), by: "System" }],
  },
  {
    id: "demo-inq-4",
    inquiryType: "rental",
    status: "new",
    createdAt: new Date(Date.now() - 1 * 3600_000).toISOString(),
    assignedTo: null,
    followUpAt: null,
    name: "Ditte Dam (TESTDATA)",
    phone: "+45 00 00 00 14",
    email: "ditte@example.invalid",
    message: "Jeg er interesseret i at leje: Volkswagen Caddy Cargo",
    vehicle: null,
    attribution: { landing_page: "/biludlejning/volkswagen-caddy-cargo-udlejning", utm_source: null },
    notes: [],
    history: [{ from: null, to: "new", at: new Date(Date.now() - 1 * 3600_000).toISOString(), by: "System" }],
  },
  {
    id: "demo-inq-5",
    inquiryType: "trade_in",
    status: "won",
    createdAt: new Date(Date.now() - 100 * 3600_000).toISOString(),
    assignedTo: "Demo Administrator (TESTDATA)",
    followUpAt: null,
    name: "Erik Eriksen (TESTDATA)",
    phone: "+45 00 00 00 15",
    email: "erik@example.invalid",
    message: null,
    vehicle: { make: "Skoda", model: "Octavia", variant: "Combi", slug: "skoda-octavia-combi-udlejning", priceDkk: null },
    attribution: { landing_page: "/biler/skoda-octavia-demo", utm_source: "facebook" },
    notes: [],
    history: [
      { from: null, to: "new", at: new Date(Date.now() - 100 * 3600_000).toISOString(), by: "System" },
      { from: "new", to: "won", at: new Date(Date.now() - 90 * 3600_000).toISOString(), by: "Demo Administrator (TESTDATA)" },
    ],
  },
];

export function demoInquiries(): AdminInquiryDetail[] {
  if (!inquiries) inquiries = DEMO_INQUIRIES.map((i) => ({ ...i }));
  return inquiries;
}

export function demoInquiryById(id: string): AdminInquiryDetail | undefined {
  return demoInquiries().find((i) => i.id === id);
}

export function demoUpdateInquiry(id: string, patch: Partial<AdminInquiry>): void {
  const inquiry = demoInquiryById(id);
  if (inquiry) Object.assign(inquiry, patch);
}

/* ============================ Brugere ============================ */

let members: OrgMember[] | null = null;

function demoMembersInit(): OrgMember[] {
  return [
    { id: "demo-admin", name: "Demo Administrator (TESTDATA)", email: "demo-admin@example.invalid", roles: ["dealer_admin"] },
    { id: "demo-sales-1", name: "Sanne Sælger (TESTDATA)", email: "sanne@example.invalid", roles: ["sales_agent"] },
    { id: "demo-lead-agent-1", name: "Lasse Leadmedarbejder (TESTDATA)", email: "lasse@example.invalid", roles: ["lead_agent"] },
  ];
}

export function demoMembers(): OrgMember[] {
  if (!members) members = demoMembersInit();
  return members;
}

export function demoInviteMember(input: { email: string; fullName: string; roles: AdminRole[] }): OrgMember {
  const list = demoMembers();
  const existing = list.find((m) => m.email === input.email);
  if (existing) {
    existing.roles = input.roles;
    existing.name = input.fullName;
    return existing;
  }
  const member: OrgMember = { id: `demo-member-${Date.now()}`, name: input.fullName, email: input.email, roles: input.roles };
  list.push(member);
  return member;
}

export function demoUpdateMemberRoles(id: string, roles: AdminRole[]): void {
  const member = demoMembers().find((m) => m.id === id);
  if (member) member.roles = roles;
}

export function demoRemoveMember(id: string): void {
  const list = demoMembers();
  const idx = list.findIndex((m) => m.id === id);
  if (idx >= 0) list.splice(idx, 1);
}

/* ============================ Aktivitetslog ============================ */

let auditLog: AuditLogEntry[] | null = null;

function demoAuditLogInit(): AuditLogEntry[] {
  return [
    {
      id: "demo-audit-1",
      actorName: "Demo Administrator (TESTDATA)",
      action: "vehicle.publish",
      entityType: "vehicle",
      entityId: "demo-draft-1",
      details: { make: "Audi", model: "A4" },
      createdAt: new Date(Date.now() - 5 * 3600_000).toISOString(),
    },
    {
      id: "demo-audit-2",
      actorName: "Demo Administrator (TESTDATA)",
      action: "lead.status_changed",
      entityType: "lead",
      entityId: "demo-lead-2",
      details: { from: "new", to: "contacted" },
      createdAt: new Date(Date.now() - 20 * 3600_000).toISOString(),
    },
  ];
}

export function demoAuditLog(): AuditLogEntry[] {
  if (!auditLog) auditLog = demoAuditLogInit();
  return auditLog;
}

export function demoAddAuditLog(entry: Omit<AuditLogEntry, "id" | "createdAt">): void {
  demoAuditLog().unshift({ ...entry, id: `demo-audit-${Date.now()}`, createdAt: new Date().toISOString() });
}
