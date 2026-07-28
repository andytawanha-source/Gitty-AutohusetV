import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeftRight, Download } from "lucide-react";
import { downloadCsv, leadsToCsv, useAdminInquiries, useAdminLeads } from "../api";
import { INQUIRY_TYPE_LABELS, LEAD_STATUS_LABELS, type AdminLeadStatus, type UnifiedLeadRow } from "../types";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Partial<Record<AdminLeadStatus, string>> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-emerald-100 text-emerald-800",
  offer_sent: "bg-amber-100 text-amber-800",
  won: "bg-emerald-200 text-emerald-900",
  lost: "bg-red-100 text-red-800",
};

const UNCONTACTED_SLA_HOURS = 24;

type SortKey = "newest" | "oldest" | "status";
type TypeFilter = "" | "sell_car" | "contact" | "test_drive" | "finance" | "trade_in" | "rental";

const TYPE_LABELS: Record<Exclude<TypeFilter, "">, string> = {
  sell_car: "Sælg din bil",
  ...INQUIRY_TYPE_LABELS,
};

function isUncontacted(row: UnifiedLeadRow): boolean {
  if (row.status !== "new") return false;
  const ageHours = (Date.now() - new Date(row.createdAt).getTime()) / 3_600_000;
  return ageHours >= UNCONTACTED_SLA_HOURS;
}

export default function AdminLeadsPage() {
  const { data: leads, isLoading: leadsLoading } = useAdminLeads();
  const { data: inquiries, isLoading: inquiriesLoading } = useAdminInquiries();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const [sort, setSort] = useState<SortKey>("newest");

  const isLoading = leadsLoading || inquiriesLoading;

  // Til at vise et tydeligt "Byttebil"-badge i listen uden at ændre den delte
  // UnifiedLeadRow-type – kun sell_car-rækker (kilde: leads-tabellen) kan have en
  // interesse-bil, så et opslag på id er tilstrækkeligt.
  const interestVehicleByLeadId = useMemo(() => {
    const map = new Map<string, { label: string }>();
    for (const l of leads ?? []) {
      if (l.interestVehicle) map.set(l.id, { label: l.interestVehicle.label });
    }
    return map;
  }, [leads]);

  const rows: UnifiedLeadRow[] = useMemo(() => {
    const leadRows: UnifiedLeadRow[] = (leads ?? []).map((l) => ({
      sourceTable: "lead",
      id: l.id,
      leadType: "sell_car",
      typeLabel: "Sælg din bil",
      reference: l.reference,
      status: l.status,
      createdAt: l.createdAt,
      assignedTo: l.assignedTo,
      followUpAt: l.followUpAt,
      contactName: l.contact?.name ?? null,
      contactPhone: l.contact?.phone ?? null,
      contactEmail: l.contact?.email ?? null,
      vehicleLabel: [l.vehicle?.make, l.vehicle?.model].filter(Boolean).join(" ") || null,
      message: l.contact?.message ?? null,
    }));
    const inquiryRows: UnifiedLeadRow[] = (inquiries ?? []).map((i) => ({
      sourceTable: "inquiry",
      id: i.id,
      leadType: i.inquiryType,
      typeLabel: INQUIRY_TYPE_LABELS[i.inquiryType],
      reference: `HENV-${i.id.slice(0, 8).toUpperCase()}`,
      status: i.status,
      createdAt: i.createdAt,
      assignedTo: i.assignedTo,
      followUpAt: i.followUpAt,
      contactName: i.name,
      contactPhone: i.phone,
      contactEmail: i.email,
      vehicleLabel: [i.vehicle?.make, i.vehicle?.model].filter(Boolean).join(" ") || null,
      message: i.message,
    }));
    return [...leadRows, ...inquiryRows];
  }, [leads, inquiries]);

  const filtered = useMemo(() => {
    let list = [...rows];
    if (typeFilter) {
      list = list.filter((r) => r.leadType === typeFilter);
    }
    if (statusFilter) list = list.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        [r.reference, r.contactName, r.contactEmail, r.contactPhone, r.vehicleLabel].filter(Boolean).join(" ").toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case "oldest": list.sort((a, b) => a.createdAt.localeCompare(b.createdAt)); break;
      case "status": list.sort((a, b) => a.status.localeCompare(b.status)); break;
      default: list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return list;
  }, [rows, search, statusFilter, typeFilter, sort]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-brand-primary">Leads</h1>
        <button
          type="button"
          onClick={() =>
            downloadCsv(
              "leads.csv",
              leadsToCsv(
                (leads ?? []).filter((l) => filtered.some((r) => r.sourceTable === "lead" && r.id === l.id))
              )
            )
          }
          className="inline-flex items-center gap-1.5 rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm hover:bg-brand-ink/5">
          <Download className="h-4 w-4" aria-hidden /> Eksportér CSV (sælg din bil)
        </button>
      </div>

      <p className="text-sm text-brand-ink/60">
        Samlet indbakke for alle henvendelser: sælg din bil / byttebil, kontaktformular, prøvetur, finansiering og biludlejning.
      </p>

      <div className="flex flex-wrap gap-3">
        <input type="search" placeholder="Søg reference, navn, bil…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm" aria-label="Søg i leads" />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm" aria-label="Filtrér på type">
          <option value="">Alle typer</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm" aria-label="Filtrér på status">
          <option value="">Alle statusser</option>
          {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm" aria-label="Sortering">
          <option value="newest">Nyeste først</option>
          <option value="oldest">Ældste først</option>
          <option value="status">Status</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-brand-ink/5">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-brand-ink/10 text-left text-xs uppercase tracking-wide text-brand-ink/50">
              <th className="p-3">Reference</th>
              <th className="p-3">Type</th>
              <th className="p-3">Bil</th>
              <th className="p-3">Kontakt</th>
              <th className="p-3">Modtaget</th>
              <th className="p-3">Tildelt</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="p-6 text-center text-brand-ink/50">Indlæser…</td></tr>}
            {filtered.map((row) => (
              <tr key={`${row.sourceTable}-${row.id}`} className="border-b border-brand-ink/5 hover:bg-brand-ink/[0.02]">
                <td className="p-3">
                  <Link
                    to={`/admin/leads/${row.sourceTable === "lead" ? "salg" : "henvendelse"}/${row.id}`}
                    className="font-medium text-brand-primary hover:underline"
                  >
                    {row.reference}
                  </Link>
                  {isUncontacted(row) && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-700" title={`Ikke kontaktet inden for ${UNCONTACTED_SLA_HOURS} timer`}>
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Haster
                    </span>
                  )}
                </td>
                <td className="p-3 text-brand-ink/70">
                  {row.typeLabel}
                  {interestVehicleByLeadId.has(row.id) && (
                    <span
                      className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900"
                      title={`Ønsker at bytte til: ${interestVehicleByLeadId.get(row.id)!.label}`}
                    >
                      <ArrowLeftRight className="h-3 w-3" aria-hidden /> Byttebil
                    </span>
                  )}
                </td>
                <td className="p-3">
                  {row.vehicleLabel ?? "–"}
                  {interestVehicleByLeadId.has(row.id) && (
                    <span className="block text-xs text-emerald-700">
                      → {interestVehicleByLeadId.get(row.id)!.label}
                    </span>
                  )}
                </td>
                <td className="p-3">
                  {row.contactName}
                  <span className="block text-xs text-brand-ink/50">{row.contactPhone}</span>
                </td>
                <td className="p-3 text-brand-ink/70">{formatDateTime(row.createdAt)}</td>
                <td className="p-3 text-brand-ink/70">{row.assignedTo ?? "–"}</td>
                <td className="p-3">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_STYLES[row.status] ?? "bg-brand-ink/10 text-brand-ink")}>
                    {LEAD_STATUS_LABELS[row.status]}
                  </span>
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-brand-ink/50">Ingen leads matcher.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
