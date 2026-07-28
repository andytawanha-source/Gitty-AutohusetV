import { Link } from "react-router-dom";
import { AlertTriangle, BellRing, Car, CheckCircle2, Clock, FileEdit, KeyRound, MessageSquare, Plus, Tag } from "lucide-react";
import { useAdminInquiries, useAdminLeads, useAdminVehicles } from "../api";
import { INQUIRY_TYPE_LABELS, LEAD_STATUS_LABELS, type AdminLeadStatus } from "../types";
import { formatDateTime } from "@/lib/format";
import { checkVehicleQuality } from "../vehicleQuality";

const UNCONTACTED_SLA_HOURS = 24;

function StatCard({ label, value, icon: Icon, to }: { label: string; value: number | string; icon: React.ElementType; to?: string }) {
  const content = (
    <div className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5 transition-shadow hover:shadow-md">
      <span className="rounded-lg bg-brand-primary/10 p-3 text-brand-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <p className="font-display text-2xl font-bold text-brand-primary">{value}</p>
        <p className="text-sm text-brand-ink/60">{label}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function AdminDashboardPage() {
  const vehiclesQuery = useAdminVehicles();
  const leadsQuery = useAdminLeads();
  const inquiriesQuery = useAdminInquiries();
  const vehicles = vehiclesQuery.data ?? [];
  const leads = leadsQuery.data ?? [];
  const inquiries = inquiriesQuery.data ?? [];

  const saleVehicles = vehicles.filter((v) => v.listingType === "sale");
  const rentalVehicles = vehicles.filter((v) => v.listingType === "rental");
  const byStatus = (status: string) => saleVehicles.filter((v) => v.status === status).length;
  const openLeads = leads.filter((l) => !["won", "lost", "archived", "rejected"].includes(l.status));
  const isUncontacted = (createdAt: string, status: string) =>
    status === "new" && (Date.now() - new Date(createdAt).getTime()) / 3_600_000 >= UNCONTACTED_SLA_HOURS;
  const uncontactedLeads = leads.filter((l) => isUncontacted(l.createdAt, l.status));
  const uncontactedInquiries = inquiries.filter((i) => isUncontacted(i.createdAt, i.status));
  const totalUncontacted = uncontactedLeads.length + uncontactedInquiries.length;
  const incompleteDrafts = [...saleVehicles, ...rentalVehicles].filter(
    (v) => v.status === "draft" && !checkVehicleQuality(v).ready
  );
  const leadsByStatus = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});
  const leadsBySource = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.source] = (acc[l.source] ?? 0) + 1;
    return acc;
  }, {});
  const newInquiriesCount = inquiries.filter((i) => i.status === "new").length;

  const now = Date.now();
  const dueLeads = leads.filter((l) => l.followUpAt && new Date(l.followUpAt).getTime() <= now);
  const dueInquiries = inquiries.filter((i) => i.followUpAt && new Date(i.followUpAt).getTime() <= now);
  const overdueFollowUps = [
    ...dueLeads.map((l) => ({ href: `/admin/leads/salg/${l.id}`, label: `${l.vehicle?.make ?? ""} ${l.vehicle?.model ?? ""} · ${l.contact?.name ?? "Ukendt"}`, at: l.followUpAt! })),
    ...dueInquiries.map((i) => ({ href: `/admin/leads/henvendelse/${i.id}`, label: `${INQUIRY_TYPE_LABELS[i.inquiryType]} · ${i.name}`, at: i.followUpAt! })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-brand-primary">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/biler/ny"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            <Plus className="h-4 w-4" aria-hidden /> Opret bil til salg
          </Link>
          <Link to="/admin/lejebiler/ny"
            className="inline-flex items-center gap-1.5 rounded-md border border-brand-primary/30 bg-brand-primary/5 px-4 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primary/10">
            <Plus className="h-4 w-4" aria-hidden /> Opret lejebil
          </Link>
        </div>
      </div>

      {(totalUncontacted > 0 || incompleteDrafts.length > 0) && (
        <section aria-label="Handlinger der venter" className="space-y-2 rounded-xl bg-amber-50 p-4">
          {totalUncontacted > 0 && (
            <Link to="/admin/leads" className="flex items-center gap-2 text-sm font-medium text-amber-900 hover:underline">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              {totalUncontacted} {totalUncontacted === 1 ? "lead er" : "leads er"} ikke kontaktet inden for {UNCONTACTED_SLA_HOURS} timer
            </Link>
          )}
          {incompleteDrafts.length > 0 && (
            <Link to="/admin/biler" className="flex items-center gap-2 text-sm font-medium text-amber-900 hover:underline">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              {incompleteDrafts.length} {incompleteDrafts.length === 1 ? "kladde mangler" : "kladder mangler"} oplysninger før publicering
            </Link>
          )}
          {overdueFollowUps.length > 0 && (
            <Link to="/admin/leads" className="flex items-center gap-2 text-sm font-medium text-amber-900 hover:underline">
              <BellRing className="h-4 w-4 shrink-0" aria-hidden />
              {overdueFollowUps.length} {overdueFollowUps.length === 1 ? "opfølgning venter" : "opfølgninger venter"} – dato for opfølgning er overskredet
            </Link>
          )}
        </section>
      )}

      {overdueFollowUps.length > 0 && (
        <section aria-labelledby="dash-followups" className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
          <h2 id="dash-followups" className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-brand-primary">
            <BellRing className="h-5 w-5" aria-hidden /> Opfølgninger der venter
          </h2>
          <ul className="divide-y divide-brand-ink/5">
            {overdueFollowUps.slice(0, 8).map((item, i) => (
              <li key={i}>
                <Link to={item.href} className="flex items-center justify-between gap-3 py-2.5 hover:bg-brand-ink/[0.02]">
                  <span className="truncate text-sm font-medium">{item.label}</span>
                  <span className="shrink-0 text-xs text-amber-700">{formatDateTime(item.at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Nøgletal" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Aktive biler til salg" value={byStatus("published")} icon={Car} to="/admin/biler" />
        <StatCard label="Kladder" value={byStatus("draft")} icon={FileEdit} to="/admin/biler" />
        <StatCard label="Reserverede" value={byStatus("reserved")} icon={Clock} to="/admin/biler" />
        <StatCard label="Solgte" value={byStatus("sold")} icon={Tag} to="/admin/biler" />
        <StatCard label="Lejebiler" value={rentalVehicles.length} icon={KeyRound} to="/admin/lejebiler" />
        <StatCard label="Nye leads" value={(leadsByStatus["new"] ?? 0) + newInquiriesCount} icon={MessageSquare} to="/admin/leads" />
        <StatCard label="Åbne leads" value={openLeads.length} icon={CheckCircle2} to="/admin/leads" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="dash-leads" className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
          <h2 id="dash-leads" className="mb-4 font-display text-lg font-bold text-brand-primary">Seneste "sælg din bil"-leads</h2>
          <ul className="divide-y divide-brand-ink/5">
            {leads.slice(0, 6).map((lead) => (
              <li key={lead.id}>
                <Link to={`/admin/leads/salg/${lead.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-brand-ink/[0.02]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {lead.vehicle?.make} {lead.vehicle?.model} · {lead.contact?.name}
                    </p>
                    <p className="text-xs text-brand-ink/50">{lead.reference} · {formatDateTime(lead.createdAt)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-brand-primary/10 px-2.5 py-1 text-xs font-medium text-brand-primary">
                    {LEAD_STATUS_LABELS[lead.status as AdminLeadStatus] ?? lead.status}
                  </span>
                </Link>
              </li>
            ))}
            {leads.length === 0 && <li className="py-4 text-sm text-brand-ink/50">Ingen leads endnu.</li>}
          </ul>
        </section>

        <section aria-labelledby="dash-inquiries" className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
          <h2 id="dash-inquiries" className="mb-4 font-display text-lg font-bold text-brand-primary">Seneste henvendelser</h2>
          <ul className="divide-y divide-brand-ink/5">
            {inquiries.slice(0, 6).map((inquiry) => (
              <li key={inquiry.id}>
                <Link to={`/admin/leads/henvendelse/${inquiry.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-brand-ink/[0.02]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {INQUIRY_TYPE_LABELS[inquiry.inquiryType]} · {inquiry.name}
                    </p>
                    <p className="text-xs text-brand-ink/50">{formatDateTime(inquiry.createdAt)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-brand-primary/10 px-2.5 py-1 text-xs font-medium text-brand-primary">
                    {LEAD_STATUS_LABELS[inquiry.status]}
                  </span>
                </Link>
              </li>
            ))}
            {inquiries.length === 0 && <li className="py-4 text-sm text-brand-ink/50">Ingen henvendelser endnu.</li>}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="dash-status" className="space-y-6">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
            <h2 id="dash-status" className="mb-4 font-display text-lg font-bold text-brand-primary">Leads fordelt på status</h2>
            <ul className="space-y-2">
              {Object.entries(leadsByStatus).map(([status, count]) => (
                <li key={status} className="flex items-center gap-3 text-sm">
                  <span className="w-40 shrink-0 text-brand-ink/70">{LEAD_STATUS_LABELS[status as AdminLeadStatus] ?? status}</span>
                  <span className="h-2 rounded-full bg-brand-accent" style={{ width: `${Math.min(100, (count / Math.max(leads.length, 1)) * 100)}%` }} aria-hidden />
                  <span className="font-medium">{count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
            <h2 className="mb-4 font-display text-lg font-bold text-brand-primary">Leads pr. kilde</h2>
            <ul className="space-y-1 text-sm">
              {Object.entries(leadsBySource).map(([source, count]) => (
                <li key={source} className="flex justify-between">
                  <span className="text-brand-ink/70">{source}</span>
                  <span className="font-medium">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
