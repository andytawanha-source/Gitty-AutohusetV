import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { vehicleSlug } from "@/lib/slug";
import { useAdminAuth, type AdminRole } from "./auth";
import {
  demoAddAuditLog,
  demoAuditLog,
  demoDeleteVehicle,
  demoInquiries,
  demoInquiryById,
  demoInviteMember,
  demoLeadById,
  demoLeads,
  demoMembers,
  demoRemoveMember,
  demoSaveVehicle,
  demoUpdateInquiry,
  demoUpdateLead,
  demoUpdateMemberRoles,
  demoVehicles,
} from "./demoStore";
import type { AdminInquiry, AdminInquiryDetail, AdminLead, AdminLeadDetail, AdminLeadStatus, AdminVehicle, AuditLogEntry, OrgMember } from "./types";
import type { RentalAvailability } from "@/features/vehicles/types";

/**
 * Skriver én linje til audit_log. Fejler aldrig hele det kaldende flow –
 * en mislykket log-skrivning må ikke blokere den egentlige handling (samme
 * princip som e-mail-afsendelse i submit-lead Edge Function).
 * RLS kræver at actor_id = auth.uid(), så dette kan kun kaldes for den
 * aktuelt loggede ind bruger, ikke på vegne af andre.
 */
export async function logAudit(entry: {
  organizationId: string;
  actorId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseConfigured) {
    demoAddAuditLog({
      actorName: "Demo Administrator (TESTDATA)",
      action: entry.action,
      entityType: entry.entityType ?? null,
      entityId: entry.entityId ?? null,
      details: entry.details ?? {},
    });
    return;
  }
  try {
    const { error } = await getSupabase().from("audit_log").insert({
      organization_id: entry.organizationId,
      actor_id: entry.actorId,
      action: entry.action,
      entity_type: entry.entityType ?? null,
      entity_id: entry.entityId ?? null,
      details: entry.details ?? {},
    });
    if (error) console.error("Audit-log kunne ikke gemmes:", error);
  } catch (err) {
    console.error("Audit-log kunne ikke gemmes:", err);
  }
}

/* ============================ Biler ============================ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function first(x: any): any {
  return Array.isArray(x) ? x[0] ?? null : x ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAdminVehicle(row: any): AdminVehicle {
  const sale = first(row.sale_details);
  const rental = first(row.rental_details);
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
    registrationNumber: row.registration_number,
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
    images: (row.vehicle_images ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((img: any) => ({
        id: img.id,
        url: img.storage_path?.startsWith("http")
          ? img.storage_path
          : getSupabase().storage.from("vehicle-images").getPublicUrl(img.storage_path).data.publicUrl,
        altText: img.alt_text ?? "",
        isPrimary: img.is_primary,
        sortOrder: img.sort_order,
      })),
    internalNotes: row.internal_notes,
    vin: row.vin,
    publishAt: row.publish_at,
    updatedAt: row.updated_at,
    listingType: row.listing_type ?? "sale",
    saleDetails: sale
      ? {
          downPaymentDkk: sale.down_payment_dkk,
          deliveryCostDkk: sale.delivery_cost_dkk,
          warrantyText: sale.warranty_text,
          serviceHistoryText: sale.service_history_text,
          lastServiceDate: sale.last_service_date,
          ownerCount: sale.owner_count,
        }
      : null,
    rentalDetails: rental
      ? {
          pricePerDayDkk: rental.price_per_day_dkk,
          pricePerWeekDkk: rental.price_per_week_dkk,
          pricePerMonthDkk: rental.price_per_month_dkk,
          depositDkk: rental.deposit_dkk,
          includedKmPerDay: rental.included_km_per_day,
          extraKmPriceDkk: rental.extra_km_price_dkk,
          minAge: rental.min_age,
          licenseRequirement: rental.license_requirement,
          availabilityStatus: rental.availability_status ?? "available",
          pickupLocation: rental.pickup_location,
          insuranceInfo: rental.insurance_info,
          extraFeesText: rental.extra_fees_text,
        }
      : null,
  };
}

export function useAdminVehicles(listingType?: "sale" | "rental") {
  const { user } = useAdminAuth();
  return useQuery({
    queryKey: ["admin", "vehicles", listingType ?? "all"],
    enabled: !!user,
    queryFn: async (): Promise<AdminVehicle[]> => {
      if (!isSupabaseConfigured) {
        const all = [...demoVehicles()];
        return listingType ? all.filter((v) => v.listingType === listingType) : all;
      }
      let query = getSupabase()
        .from("vehicles")
        .select("*, vehicle_images(*), sale_details(*), rental_details(*)")
        .eq("organization_id", user!.organizationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (listingType) query = query.eq("listing_type", listingType);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapAdminVehicle);
    },
  });
}

export interface VehicleFormValues {
  id?: string;
  listingType: "sale" | "rental";
  make: string;
  model: string;
  variant: string;
  modelYear: string;
  firstRegistration: string;
  mileageKm: string;
  priceDkk: string;
  monthlyPriceDkk: string;
  fuelType: string;
  transmission: string;
  bodyType: string;
  color: string;
  doors: string;
  seats: string;
  powerHp: string;
  engine: string;
  batteryKwh: string;
  rangeKm: string;
  consumption: string;
  taxPeriodDkk: string;
  registrationNumber: string;
  showRegistrationNumber: boolean;
  vin: string;
  description: string;
  internalNotes: string;
  equipment: string; // linjeadskilt
  badges: string[];
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
  slug: string;
  status: string;
  publishAt: string;
  // Salgsspecifikt
  downPaymentDkk: string;
  deliveryCostDkk: string;
  warrantyText: string;
  serviceHistoryText: string;
  lastServiceDate: string;
  ownerCount: string;
  // Udlejningsspecifikt
  pricePerDayDkk: string;
  pricePerWeekDkk: string;
  pricePerMonthDkk: string;
  depositDkk: string;
  includedKmPerDay: string;
  extraKmPriceDkk: string;
  minAge: string;
  licenseRequirement: string;
  availabilityStatus: string;
  pickupLocation: string;
  insuranceInfo: string;
  extraFeesText: string;
}

const num = (v: string): number | null => (v.trim() === "" ? null : Number(v));
const str = (v: string): string | null => (v.trim() === "" ? null : v.trim());

export function useSaveVehicle() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form: VehicleFormValues): Promise<string> => {
      const slug =
        form.slug.trim() ||
        vehicleSlug({ make: form.make, model: form.model, variant: form.variant, year: num(form.modelYear) ?? undefined });

      if (!isSupabaseConfigured) {
        const existing = form.id ? demoVehicles().find((v) => v.id === form.id) : undefined;
        const saved = demoSaveVehicle({
          ...(existing ?? {
            id: form.id ?? "",
            organizationId: user!.organizationId,
            createdAt: new Date().toISOString(),
            images: [],
            soldAt: null,
          }),
          listingType: form.listingType,
          saleDetails:
            form.listingType === "sale"
              ? {
                  downPaymentDkk: num(form.downPaymentDkk),
                  deliveryCostDkk: num(form.deliveryCostDkk),
                  warrantyText: str(form.warrantyText),
                  serviceHistoryText: str(form.serviceHistoryText),
                  lastServiceDate: str(form.lastServiceDate),
                  ownerCount: num(form.ownerCount),
                }
              : null,
          rentalDetails:
            form.listingType === "rental"
              ? {
                  pricePerDayDkk: num(form.pricePerDayDkk),
                  pricePerWeekDkk: num(form.pricePerWeekDkk),
                  pricePerMonthDkk: num(form.pricePerMonthDkk),
                  depositDkk: num(form.depositDkk),
                  includedKmPerDay: num(form.includedKmPerDay),
                  extraKmPriceDkk: num(form.extraKmPriceDkk),
                  minAge: num(form.minAge),
                  licenseRequirement: str(form.licenseRequirement),
                  availabilityStatus: (form.availabilityStatus || "available") as RentalAvailability,
                  pickupLocation: str(form.pickupLocation),
                  insuranceInfo: str(form.insuranceInfo),
                  extraFeesText: str(form.extraFeesText),
                }
              : null,
          make: form.make,
          model: form.model,
          variant: form.variant || null,
          modelYear: num(form.modelYear),
          firstRegistration: form.firstRegistration || null,
          mileageKm: num(form.mileageKm),
          priceDkk: num(form.priceDkk),
          monthlyPriceDkk: num(form.monthlyPriceDkk),
          fuelType: (form.fuelType || null) as AdminVehicle["fuelType"],
          transmission: (form.transmission || null) as AdminVehicle["transmission"],
          bodyType: form.bodyType || null,
          color: form.color || null,
          doors: num(form.doors),
          seats: num(form.seats),
          powerHp: num(form.powerHp),
          engine: form.engine || null,
          batteryKwh: num(form.batteryKwh),
          rangeKm: num(form.rangeKm),
          consumption: form.consumption || null,
          taxPeriodDkk: num(form.taxPeriodDkk),
          registrationNumber: form.registrationNumber || null,
          showRegistrationNumber: form.showRegistrationNumber,
          vin: form.vin || null,
          description: form.description || null,
          internalNotes: form.internalNotes || null,
          equipment: form.equipment.split("\n").map((s) => s.trim()).filter(Boolean),
          badges: form.badges,
          isFeatured: form.isFeatured,
          seoTitle: form.seoTitle || null,
          seoDescription: form.seoDescription || null,
          slug,
          status: form.status as AdminVehicle["status"],
          publishAt: form.publishAt || null,
          updatedAt: new Date().toISOString(),
        } as AdminVehicle);
        return saved.id;
      }

      const payload = {
        organization_id: user!.organizationId,
        listing_type: form.listingType,
        make: form.make,
        model: form.model,
        variant: form.variant || null,
        model_year: num(form.modelYear),
        first_registration: form.firstRegistration || null,
        mileage_km: num(form.mileageKm),
        price_dkk: num(form.priceDkk),
        monthly_price_dkk: num(form.monthlyPriceDkk),
        fuel_type: form.fuelType || null,
        transmission: form.transmission || null,
        body_type: form.bodyType || null,
        color: form.color || null,
        doors: num(form.doors),
        seats: num(form.seats),
        power_hp: num(form.powerHp),
        engine: form.engine || null,
        battery_kwh: num(form.batteryKwh),
        range_km: num(form.rangeKm),
        consumption: form.consumption || null,
        tax_period_dkk: num(form.taxPeriodDkk),
        registration_number: form.registrationNumber || null,
        show_registration_number: form.showRegistrationNumber,
        vin: form.vin || null,
        description: form.description || null,
        internal_notes: form.internalNotes || null,
        equipment: form.equipment.split("\n").map((s) => s.trim()).filter(Boolean),
        badges: form.badges,
        is_featured: form.isFeatured,
        seo_title: form.seoTitle || null,
        seo_description: form.seoDescription || null,
        slug,
        status: form.status,
        publish_at: form.publishAt || null,
      };

      const supabase = getSupabase();
      const { data: saved, error } = form.id
        ? await supabase.from("vehicles").update(payload).eq("id", form.id).select("id").single()
        : await supabase.from("vehicles").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      const vehicleId = saved.id as string;

      if (form.listingType === "sale") {
        const { error: saleErr } = await supabase.from("sale_details").upsert(
          {
            vehicle_id: vehicleId,
            organization_id: user!.organizationId,
            down_payment_dkk: num(form.downPaymentDkk),
            delivery_cost_dkk: num(form.deliveryCostDkk),
            warranty_text: str(form.warrantyText),
            service_history_text: str(form.serviceHistoryText),
            last_service_date: str(form.lastServiceDate),
            owner_count: num(form.ownerCount),
          },
          { onConflict: "vehicle_id" }
        );
        if (saleErr) throw new Error(saleErr.message);
      } else {
        const { error: rentalErr } = await supabase.from("rental_details").upsert(
          {
            vehicle_id: vehicleId,
            organization_id: user!.organizationId,
            price_per_day_dkk: num(form.pricePerDayDkk),
            price_per_week_dkk: num(form.pricePerWeekDkk),
            price_per_month_dkk: num(form.pricePerMonthDkk),
            deposit_dkk: num(form.depositDkk),
            included_km_per_day: num(form.includedKmPerDay),
            extra_km_price_dkk: num(form.extraKmPriceDkk),
            min_age: num(form.minAge),
            license_requirement: str(form.licenseRequirement),
            availability_status: form.availabilityStatus || "available",
            pickup_location: str(form.pickupLocation),
            insurance_info: str(form.insuranceInfo),
            extra_fees_text: str(form.extraFeesText),
          },
          { onConflict: "vehicle_id" }
        );
        if (rentalErr) throw new Error(rentalErr.message);
      }

      return vehicleId;
    },
    onSuccess: (vehicleId, form) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "vehicles"] });
      void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      if (user) {
        void logAudit({
          organizationId: user.organizationId,
          actorId: user.id,
          action: form.id ? "vehicle.update" : "vehicle.create",
          entityType: "vehicle",
          entityId: vehicleId,
          details: { make: form.make, model: form.model, status: form.status },
        });
      }
    },
  });
}

export function useVehicleStatusMutation() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      if (!isSupabaseConfigured) {
        for (const id of ids) {
          const v = demoVehicles().find((x) => x.id === id);
          if (v) v.status = status as AdminVehicle["status"];
        }
        return;
      }
      const { error } = await getSupabase().from("vehicles").update({ status }).in("id", ids);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "vehicles"] });
      void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      if (user) {
        for (const id of vars.ids) {
          void logAudit({
            organizationId: user.organizationId,
            actorId: user.id,
            action: "vehicle.status_changed",
            entityType: "vehicle",
            entityId: id,
            details: { status: vars.status },
          });
        }
      }
    },
  });
}

export function useDeleteVehicle() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured) {
        demoDeleteVehicle(id);
        return;
      }
      // Soft delete
      const { error } = await getSupabase()
        .from("vehicles")
        .update({ deleted_at: new Date().toISOString(), status: "archived" })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "vehicles"] });
      if (user) {
        void logAudit({ organizationId: user.organizationId, actorId: user.id, action: "vehicle.delete", entityType: "vehicle", entityId: id });
      }
    },
  });
}

/* ============================ Leads ============================ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLead(row: any): AdminLead {
  const contact = row.lead_contacts?.[0] ?? row.lead_contacts ?? null;
  const snapshot = row.lead_vehicle_snapshots?.[0] ?? row.lead_vehicle_snapshots ?? null;
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    registrationNumber: row.registration_number,
    mileageKm: row.mileage_km,
    source: row.source,
    createdAt: row.created_at,
    assignedTo: row.assigned_profile?.full_name ?? null,
    followUpAt: row.follow_up_at,
    lostReason: row.lost_reason,
    contact: contact
      ? {
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          postalCode: contact.postal_code,
          city: contact.city,
          preferredChannel: contact.preferred_channel,
          bestContactTime: contact.best_contact_time,
          message: contact.message,
        }
      : null,
    vehicle: snapshot
      ? {
          make: snapshot.make,
          model: snapshot.model,
          variant: snapshot.variant,
          modelYear: snapshot.model_year,
          fuelType: snapshot.fuel_type,
          transmission: snapshot.transmission,
          color: snapshot.color,
          provider: snapshot.provider,
          isMock: snapshot.is_mock,
        }
      : null,
    interestVehicle: row.interest_vehicle_label
      ? {
          id: row.interest_vehicle_id,
          label: row.interest_vehicle_label,
          slug: row.interest_vehicle_slug,
          priceDkk: row.interest_vehicle_price_dkk,
        }
      : null,
    estimate:
      row.estimate_low_dkk !== null && row.estimate_low_dkk !== undefined
        ? {
            lowDkk: row.estimate_low_dkk,
            midDkk: row.estimate_mid_dkk,
            highDkk: row.estimate_high_dkk,
            sampleSize: row.estimate_sample_size,
          }
        : null,
  };
}

export function useAdminLeads() {
  const { user } = useAdminAuth();
  return useQuery({
    queryKey: ["admin", "leads"],
    enabled: !!user,
    queryFn: async (): Promise<AdminLead[]> => {
      if (!isSupabaseConfigured) return [...demoLeads()];
      const { data, error } = await getSupabase()
        .from("leads")
        .select("*, lead_contacts(*), lead_vehicle_snapshots(*), assigned_profile:profiles!leads_assigned_to_fkey(full_name)")
        .eq("organization_id", user!.organizationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapLead);
    },
  });
}

export function useAdminLeadDetail(id: string | undefined) {
  const { user } = useAdminAuth();
  return useQuery({
    queryKey: ["admin", "lead", id],
    enabled: !!user && !!id,
    queryFn: async (): Promise<AdminLeadDetail | null> => {
      if (!isSupabaseConfigured) return demoLeadById(id!) ?? null;
      const supabase = getSupabase();
      const { data: row, error } = await supabase
        .from("leads")
        .select(
          "*, lead_contacts(*), lead_vehicle_snapshots(*), lead_condition_answers(*), lead_consents(*), lead_attribution(*), lead_images(*), lead_notes(*, author:profiles(full_name)), lead_status_history(*, changed_profile:profiles(full_name)), assigned_profile:profiles!leads_assigned_to_fkey(full_name)"
        )
        .eq("id", id!)
        .single();
      if (error) throw error;

      // Signerede URL'er til de private leadbilleder
      const images = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (row.lead_images ?? []).map(async (img: any) => {
          const { data: signed } = await supabase.storage
            .from("lead-images")
            .createSignedUrl(img.storage_path, 3600);
          return { id: img.id, url: signed?.signedUrl ?? "", category: img.category };
        })
      );

      const base = mapLead(row);
      const conditionRow = row.lead_condition_answers?.[0] ?? null;
      return {
        ...base,
        condition: conditionRow,
        consents: (row.lead_consents ?? []).map((c: Record<string, unknown>) => ({
          type: c.consent_type as string,
          granted: c.granted as boolean,
          version: c.consent_text_version as string,
          channels: (c.channels as string[]) ?? [],
          createdAt: c.created_at as string,
        })),
        attribution: row.lead_attribution?.[0]
          ? {
              landingPage: row.lead_attribution[0].landing_page,
              utmSource: row.lead_attribution[0].utm_source,
              utmMedium: row.lead_attribution[0].utm_medium,
              utmCampaign: row.lead_attribution[0].utm_campaign,
              deviceType: row.lead_attribution[0].device_type,
            }
          : null,
        images: images.filter((i) => i.url),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        notes: (row.lead_notes ?? []).map((n: any) => ({
          id: n.id,
          author: n.author?.full_name ?? "Ukendt",
          body: n.body,
          createdAt: n.created_at,
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        history: (row.lead_status_history ?? []).map((h: any) => ({
          from: h.from_status,
          to: h.to_status,
          at: h.created_at,
          by: h.changed_profile?.full_name ?? "System",
        })),
      };
    },
  });
}

export function useUpdateLead() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      lostReason,
      followUpAt,
      assignToSelf,
    }: {
      id: string;
      status?: AdminLeadStatus;
      lostReason?: string;
      followUpAt?: string | null;
      assignToSelf?: boolean;
    }) => {
      if (!isSupabaseConfigured) {
        demoUpdateLead(id, {
          ...(status ? { status } : {}),
          ...(lostReason !== undefined ? { lostReason } : {}),
          ...(followUpAt !== undefined ? { followUpAt } : {}),
          ...(assignToSelf ? { assignedTo: user!.name } : {}),
        });
        const lead = demoLeadById(id);
        if (lead && status) lead.history.push({ from: lead.history.at(-1)?.to ?? null, to: status, at: new Date().toISOString(), by: user!.name });
        return;
      }
      const patch: Record<string, unknown> = {};
      if (status) patch.status = status;
      if (lostReason !== undefined) patch.lost_reason = lostReason;
      if (followUpAt !== undefined) patch.follow_up_at = followUpAt;
      if (assignToSelf) patch.assigned_to = user!.id;
      const { error } = await getSupabase().from("leads").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
      if (assignToSelf) {
        await getSupabase().from("lead_assignments").insert({
          organization_id: user!.organizationId,
          lead_id: id,
          assigned_to: user!.id,
          assigned_by: user!.id,
        });
      }
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "leads"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "lead", vars.id] });
      if (user && vars.status) {
        void logAudit({
          organizationId: user.organizationId,
          actorId: user.id,
          action: "lead.status_changed",
          entityType: "lead",
          entityId: vars.id,
          details: { status: vars.status },
        });
      }
    },
  });
}

export function useAddLeadNote() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, body }: { leadId: string; body: string }) => {
      if (!isSupabaseConfigured) {
        demoLeadById(leadId)?.notes.push({
          id: `note-${Date.now()}`,
          author: user!.name,
          body,
          createdAt: new Date().toISOString(),
        });
        return;
      }
      const { error } = await getSupabase().from("lead_notes").insert({
        organization_id: user!.organizationId,
        lead_id: leadId,
        author_id: user!.id,
        body,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, vars) => void queryClient.invalidateQueries({ queryKey: ["admin", "lead", vars.leadId] }),
  });
}

/* ============================ Henvendelser (vehicle_inquiries) ============================ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInquiry(row: any): AdminInquiry {
  const snapshot = row.vehicle_snapshot ?? null;
  return {
    id: row.id,
    inquiryType: row.inquiry_type,
    status: row.status,
    createdAt: row.created_at,
    assignedTo: row.assigned_profile?.full_name ?? null,
    followUpAt: row.follow_up_at,
    name: row.name,
    phone: row.phone,
    email: row.email,
    message: row.message,
    vehicle: snapshot
      ? {
          make: snapshot.make ?? null,
          model: snapshot.model ?? null,
          variant: snapshot.variant ?? null,
          slug: snapshot.slug ?? null,
          priceDkk: snapshot.price_dkk ?? null,
        }
      : null,
  };
}

export function useAdminInquiries() {
  const { user } = useAdminAuth();
  return useQuery({
    queryKey: ["admin", "inquiries"],
    enabled: !!user,
    queryFn: async (): Promise<AdminInquiry[]> => {
      if (!isSupabaseConfigured) return [...demoInquiries()];
      const { data, error } = await getSupabase()
        .from("vehicle_inquiries")
        .select("*, assigned_profile:profiles!vehicle_inquiries_assigned_to_fkey(full_name)")
        .eq("organization_id", user!.organizationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapInquiry);
    },
  });
}

export function useAdminInquiryDetail(id: string | undefined) {
  const { user } = useAdminAuth();
  return useQuery({
    queryKey: ["admin", "inquiry", id],
    enabled: !!user && !!id,
    queryFn: async (): Promise<AdminInquiryDetail | null> => {
      if (!isSupabaseConfigured) return demoInquiryById(id!) ?? null;
      const { data: row, error } = await getSupabase()
        .from("vehicle_inquiries")
        .select(
          "*, assigned_profile:profiles!vehicle_inquiries_assigned_to_fkey(full_name), vehicle_inquiry_notes(*, author:profiles(full_name)), vehicle_inquiry_status_history(*, changed_profile:profiles(full_name))"
        )
        .eq("id", id!)
        .single();
      if (error) throw error;
      const base = mapInquiry(row);
      return {
        ...base,
        attribution: row.attribution ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        notes: (row.vehicle_inquiry_notes ?? []).map((n: any) => ({
          id: n.id,
          author: n.author?.full_name ?? "Ukendt",
          body: n.body,
          createdAt: n.created_at,
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        history: (row.vehicle_inquiry_status_history ?? []).map((h: any) => ({
          from: h.from_status,
          to: h.to_status,
          at: h.created_at,
          by: h.changed_profile?.full_name ?? "System",
        })),
      };
    },
  });
}

export function useUpdateInquiry() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      followUpAt,
      assignToSelf,
    }: {
      id: string;
      status?: AdminLeadStatus;
      followUpAt?: string | null;
      assignToSelf?: boolean;
    }) => {
      if (!isSupabaseConfigured) {
        demoUpdateInquiry(id, {
          ...(status ? { status } : {}),
          ...(followUpAt !== undefined ? { followUpAt } : {}),
          ...(assignToSelf ? { assignedTo: user!.name } : {}),
        });
        return;
      }
      const patch: Record<string, unknown> = {};
      if (status) patch.status = status;
      if (followUpAt !== undefined) patch.follow_up_at = followUpAt;
      if (assignToSelf) patch.assigned_to = user!.id;
      const { error } = await getSupabase().from("vehicle_inquiries").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "inquiries"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "inquiry", vars.id] });
      if (user && vars.status) {
        void logAudit({
          organizationId: user.organizationId,
          actorId: user.id,
          action: "inquiry.status_changed",
          entityType: "inquiry",
          entityId: vars.id,
          details: { status: vars.status },
        });
      }
    },
  });
}

export function useAddInquiryNote() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ inquiryId, body }: { inquiryId: string; body: string }) => {
      if (!isSupabaseConfigured) {
        demoInquiryById(inquiryId)?.notes.push({
          id: `note-${Date.now()}`,
          author: user!.name,
          body,
          createdAt: new Date().toISOString(),
        });
        return;
      }
      const { error } = await getSupabase().from("vehicle_inquiry_notes").insert({
        organization_id: user!.organizationId,
        inquiry_id: inquiryId,
        author_id: user!.id,
        body,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, vars) => void queryClient.invalidateQueries({ queryKey: ["admin", "inquiry", vars.inquiryId] }),
  });
}

/* ============================ Brugere ============================ */

export function useOrgMembers() {
  const { user } = useAdminAuth();
  return useQuery({
    queryKey: ["admin", "members"],
    enabled: !!user,
    queryFn: async (): Promise<OrgMember[]> => {
      if (!isSupabaseConfigured) return [...demoMembers()];
      const supabase = getSupabase();
      const [{ data: memberRows, error: memberErr }, { data: roleRows, error: roleErr }] = await Promise.all([
        supabase
          .from("organization_members")
          .select("profile_id, profiles(full_name)")
          .eq("organization_id", user!.organizationId),
        supabase.from("user_roles").select("profile_id, role").eq("organization_id", user!.organizationId),
      ]);
      if (memberErr) throw new Error(memberErr.message);
      if (roleErr) throw new Error(roleErr.message);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (memberRows ?? []).map((m: any) => ({
        id: m.profile_id,
        name: m.profiles?.full_name ?? m.profile_id,
        email: null,
        roles: (roleRows ?? []).filter((r) => r.profile_id === m.profile_id).map((r) => r.role as AdminRole),
      }));
    },
  });
}

/** Inviterer en ny bruger via Edge Function admin-invite-user (kræver service-role, kan ikke gøres klient-side). */
export function useInviteMember() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; fullName: string; roles: AdminRole[] }): Promise<void> => {
      if (!isSupabaseConfigured) {
        demoInviteMember(input);
        return;
      }
      const { error } = await getSupabase().functions.invoke("admin-invite-user", {
        body: { organizationId: user!.organizationId, email: input.email, fullName: input.fullName, roles: input.roles },
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "members"] }),
  });
}

/** Rolleændring er en almindelig klient-side tabelskrivning – RLS tillader det for org-admins (dealer_admin/superadmin). */
export function useUpdateMemberRoles() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ profileId, roles }: { profileId: string; roles: AdminRole[] }): Promise<void> => {
      if (!isSupabaseConfigured) {
        demoUpdateMemberRoles(profileId, roles);
        return;
      }
      const supabase = getSupabase();
      const { error: delErr } = await supabase
        .from("user_roles")
        .delete()
        .eq("organization_id", user!.organizationId)
        .eq("profile_id", profileId);
      if (delErr) throw new Error(delErr.message);
      if (roles.length > 0) {
        const { error: insErr } = await supabase
          .from("user_roles")
          .insert(roles.map((role) => ({ organization_id: user!.organizationId, profile_id: profileId, role })));
        if (insErr) throw new Error(insErr.message);
      }
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
      if (user) {
        void logAudit({
          organizationId: user.organizationId,
          actorId: user.id,
          action: "user.roles_changed",
          entityType: "profile",
          entityId: vars.profileId,
          details: { roles: vars.roles },
        });
      }
    },
  });
}

export function useRemoveMember() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profileId: string): Promise<void> => {
      if (!isSupabaseConfigured) {
        demoRemoveMember(profileId);
        return;
      }
      const supabase = getSupabase();
      await supabase.from("user_roles").delete().eq("organization_id", user!.organizationId).eq("profile_id", profileId);
      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("organization_id", user!.organizationId)
        .eq("profile_id", profileId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, profileId) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
      if (user) {
        void logAudit({ organizationId: user.organizationId, actorId: user.id, action: "user.removed", entityType: "profile", entityId: profileId });
      }
    },
  });
}

/* ============================ Aktivitetslog ============================ */

export function useAuditLog() {
  const { user } = useAdminAuth();
  return useQuery({
    queryKey: ["admin", "audit-log"],
    enabled: !!user,
    queryFn: async (): Promise<AuditLogEntry[]> => {
      if (!isSupabaseConfigured) return [...demoAuditLog()];
      const { data, error } = await getSupabase()
        .from("audit_log")
        .select("*, actor:profiles(full_name)")
        .eq("organization_id", user!.organizationId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw new Error(error.message);
      return (data ?? []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (row: any): AuditLogEntry => ({
          id: row.id,
          actorName: row.actor?.full_name ?? "Ukendt bruger",
          action: row.action,
          entityType: row.entity_type,
          entityId: row.entity_id,
          details: row.details ?? {},
          createdAt: row.created_at,
        })
      );
    },
  });
}

/* ============================ Statistik ============================ */

export interface VehicleViewStat {
  vehicleId: string;
  totalViews: number;
}

/** Samlede sidevisninger pr. bil (vehicle_views), aggregeret klient-side. */
export function useVehicleViewStats() {
  const { user } = useAdminAuth();
  return useQuery({
    queryKey: ["admin", "vehicle-view-stats"],
    enabled: !!user,
    queryFn: async (): Promise<VehicleViewStat[]> => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await getSupabase()
        .from("vehicle_views")
        .select("vehicle_id, view_count")
        .eq("organization_id", user!.organizationId);
      if (error) throw new Error(error.message);
      const totals = new Map<string, number>();
      for (const row of data ?? []) {
        totals.set(row.vehicle_id, (totals.get(row.vehicle_id) ?? 0) + row.view_count);
      }
      return [...totals.entries()].map(([vehicleId, totalViews]) => ({ vehicleId, totalViews }));
    },
  });
}

export interface VehicleStatusChange {
  vehicleId: string;
  toStatus: string;
  createdAt: string;
}

/** Statushistorik pr. bil (vehicle_status_history), bruges til at udregne liggetid. */
export function useVehicleStatusHistory() {
  const { user } = useAdminAuth();
  return useQuery({
    queryKey: ["admin", "vehicle-status-history"],
    enabled: !!user,
    queryFn: async (): Promise<VehicleStatusChange[]> => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await getSupabase()
        .from("vehicle_status_history")
        .select("vehicle_id, to_status, created_at")
        .eq("organization_id", user!.organizationId)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({ vehicleId: row.vehicle_id, toStatus: row.to_status, createdAt: row.created_at }));
    },
  });
}

/* ============================ CSV ============================ */

export function vehiclesToCsv(vehicles: AdminVehicle[]): string {
  const headers = ["make", "model", "variant", "model_year", "mileage_km", "price_dkk", "monthly_price_dkk", "fuel_type", "transmission", "body_type", "color", "status", "slug"];
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = vehicles.map((v) =>
    [v.make, v.model, v.variant, v.modelYear, v.mileageKm, v.priceDkk, v.monthlyPriceDkk, v.fuelType, v.transmission, v.bodyType, v.color, v.status, v.slug].map(escape).join(";")
  );
  return [headers.join(";"), ...rows].join("\n");
}

export function leadsToCsv(leads: AdminLead[]): string {
  const headers = ["reference", "status", "created_at", "registration_number", "mileage_km", "name", "phone", "email", "make", "model", "utm_source"];
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = leads.map((l) =>
    [l.reference, l.status, l.createdAt, l.registrationNumber, l.mileageKm, l.contact?.name, l.contact?.phone, l.contact?.email, l.vehicle?.make, l.vehicle?.model, ""].map(escape).join(";")
  );
  return [headers.join(";"), ...rows].join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Simpel CSV-import (semikolonsepareret, samme kolonner som eksporten). */
export function parseVehicleCsv(text: string): Array<Partial<VehicleFormValues>> {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(";").map((h) => h.replace(/^"|"$/g, "").trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(";").map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"'));
    const get = (key: string) => cells[headers.indexOf(key)] ?? "";
    return {
      make: get("make"),
      model: get("model"),
      variant: get("variant"),
      modelYear: get("model_year"),
      mileageKm: get("mileage_km"),
      priceDkk: get("price_dkk"),
      monthlyPriceDkk: get("monthly_price_dkk"),
      fuelType: get("fuel_type"),
      transmission: get("transmission"),
      bodyType: get("body_type"),
      color: get("color"),
      status: get("status") || "draft",
      slug: get("slug"),
    };
  });
}
