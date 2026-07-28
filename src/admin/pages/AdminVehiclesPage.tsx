import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Download, Plus, Upload } from "lucide-react";
import {
  downloadCsv,
  parseVehicleCsv,
  useAdminVehicles,
  useDeleteVehicle,
  useSaveVehicle,
  useVehicleStatusMutation,
  vehiclesToCsv,
  type VehicleFormValues,
} from "../api";
import { formatMileage, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { checkVehicleQuality, findDuplicateVehicle } from "../vehicleQuality";
import type { AdminVehicle } from "../types";

const STATUS_LABELS: Record<string, string> = {
  draft: "Kladde",
  scheduled: "Planlagt",
  published: "Publiceret",
  reserved: "Reserveret",
  sold: "Solgt",
  archived: "Arkiveret",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-800",
  published: "bg-emerald-100 text-emerald-800",
  reserved: "bg-amber-100 text-amber-800",
  sold: "bg-brand-ink/10 text-brand-ink",
  archived: "bg-gray-100 text-gray-500",
};

function emptyVehicleForm(): VehicleFormValues {
  return {
    listingType: "sale",
    make: "", model: "", variant: "", modelYear: "", firstRegistration: "", mileageKm: "",
    priceDkk: "", monthlyPriceDkk: "", fuelType: "", transmission: "", bodyType: "", color: "",
    doors: "", seats: "", powerHp: "", engine: "", batteryKwh: "", rangeKm: "", consumption: "",
    taxPeriodDkk: "", registrationNumber: "", showRegistrationNumber: false, vin: "",
    description: "", internalNotes: "", equipment: "", badges: [], isFeatured: false,
    seoTitle: "", seoDescription: "", slug: "", status: "draft", publishAt: "",
    downPaymentDkk: "", deliveryCostDkk: "", warrantyText: "", serviceHistoryText: "", lastServiceDate: "", ownerCount: "",
    pricePerDayDkk: "", pricePerWeekDkk: "", pricePerMonthDkk: "", depositDkk: "", includedKmPerDay: "",
    extraKmPriceDkk: "", minAge: "", licenseRequirement: "", availabilityStatus: "available",
    pickupLocation: "", insuranceInfo: "", extraFeesText: "",
  };
}

export default function AdminVehiclesPage() {
  const { data: allVehicles, isLoading } = useAdminVehicles("sale");
  const statusMutation = useVehicleStatusMutation();
  const deleteMutation = useDeleteVehicle();
  const saveMutation = useSaveVehicle();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [importInfo, setImportInfo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const vehicles = allVehicles ?? [];

  const filtered = useMemo(() => {
    let list = vehicles;
    if (statusFilter) list = list.filter((v) => v.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) => [v.make, v.model, v.variant, v.registrationNumber].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    return list;
  }, [vehicles, search, statusFilter]);

  const toggleAll = (checked: boolean) => setSelected(checked ? filtered.map((v) => v.id) : []);

  const importCsv = async (file: File) => {
    const rows = parseVehicleCsv(await file.text());
    let imported = 0;
    for (const row of rows) {
      if (!row.make || !row.model) continue;
      await saveMutation.mutateAsync({
        ...emptyVehicleForm(),
        make: row.make, model: row.model, variant: row.variant ?? "", modelYear: row.modelYear ?? "",
        mileageKm: row.mileageKm ?? "", priceDkk: row.priceDkk ?? "",
        monthlyPriceDkk: row.monthlyPriceDkk ?? "", fuelType: row.fuelType ?? "", transmission: row.transmission ?? "",
        bodyType: row.bodyType ?? "", color: row.color ?? "",
        internalNotes: "Importeret via CSV",
        slug: row.slug ?? "", status: row.status ?? "draft",
      });
      imported++;
    }
    setImportInfo(`${imported} biler importeret som angivet status (ukendte rækker sprunget over).`);
  };

  const duplicateOf = (v: AdminVehicle) => findDuplicateVehicle(vehicles, v);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-brand-primary">Biler til salg</h1>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm hover:bg-brand-ink/5">
            <Upload className="h-4 w-4" aria-hidden /> Importér CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="sr-only"
            onChange={(e) => e.target.files?.[0] && void importCsv(e.target.files[0])} />
          <button type="button" onClick={() => downloadCsv("biler.csv", vehiclesToCsv(filtered))}
            className="inline-flex items-center gap-1.5 rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm hover:bg-brand-ink/5">
            <Download className="h-4 w-4" aria-hidden /> Eksportér CSV
          </button>
          <Link to="/admin/biler/ny"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            <Plus className="h-4 w-4" aria-hidden /> Opret bil
          </Link>
        </div>
      </div>

      {importInfo && <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{importInfo}</p>}

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Søg mærke, model, reg.nr.…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm"
          aria-label="Søg i biler"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm" aria-label="Filtrér på status">
          <option value="">Alle statusser</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {selected.length > 0 && (
          <div className="flex items-center gap-2 rounded-md bg-brand-primary/5 px-3 py-1.5 text-sm">
            <span className="font-medium">{selected.length} valgt:</span>
            {["published", "reserved", "sold", "archived"].map((status) => (
              <button key={status} type="button"
                onClick={() => { statusMutation.mutate({ ids: selected, status }); setSelected([]); }}
                className="rounded bg-white px-2 py-1 text-xs font-medium ring-1 ring-brand-ink/10 hover:bg-brand-ink/5">
                → {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-brand-ink/5">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-brand-ink/10 text-left text-xs uppercase tracking-wide text-brand-ink/50">
              <th className="p-3">
                <input type="checkbox" aria-label="Vælg alle" checked={selected.length === filtered.length && filtered.length > 0}
                  onChange={(e) => toggleAll(e.target.checked)} />
              </th>
              <th className="p-3"><span className="sr-only">Billede</span></th>
              <th className="p-3">Bil</th>
              <th className="p-3">Pris</th>
              <th className="p-3">Km</th>
              <th className="p-3">Årgang</th>
              <th className="p-3">Status</th>
              <th className="p-3">Kvalitet</th>
              <th className="p-3"><span className="sr-only">Handlinger</span></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={9} className="p-6 text-center text-brand-ink/50">Indlæser…</td></tr>
            )}
            {filtered.map((v) => {
              const quality = checkVehicleQuality(v);
              const dup = duplicateOf(v);
              return (
                <tr key={v.id} className="border-b border-brand-ink/5 hover:bg-brand-ink/[0.02]">
                  <td className="p-3">
                    <input type="checkbox" aria-label={`Vælg ${v.make} ${v.model}`} checked={selected.includes(v.id)}
                      onChange={(e) => setSelected((prev) => e.target.checked ? [...prev, v.id] : prev.filter((id) => id !== v.id))} />
                  </td>
                  <td className="p-3">
                    {v.images[0] ? (
                      <img src={v.images[0].url} alt="" className="h-10 w-14 rounded object-cover ring-1 ring-brand-ink/10" />
                    ) : (
                      <div className="h-10 w-14 rounded bg-brand-ink/5" />
                    )}
                  </td>
                  <td className="p-3">
                    <Link to={`/admin/biler/${v.id}`} className="font-medium text-brand-primary hover:underline">
                      {v.make} {v.model} {v.variant}
                    </Link>
                    {v.isFeatured && <span className="ml-2 rounded bg-brand-accent/20 px-1.5 py-0.5 text-xs text-brand-primary">Fremhævet</span>}
                    {dup && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-700" title="Muligt duplikat">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Dublet?
                      </span>
                    )}
                  </td>
                  <td className="p-3">{v.priceDkk !== null ? formatPrice(v.priceDkk) : "–"}</td>
                  <td className="p-3">{v.mileageKm !== null ? formatMileage(v.mileageKm) : "–"}</td>
                  <td className="p-3">{v.modelYear ?? "–"}</td>
                  <td className="p-3">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_STYLES[v.status])}>
                      {STATUS_LABELS[v.status]}
                    </span>
                  </td>
                  <td className="p-3">
                    {quality.ready ? (
                      <span className="text-xs text-emerald-700">Klar</span>
                    ) : (
                      <span className="text-xs text-amber-700" title={quality.missing.join(", ")}>Mangler {quality.missing.length}</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {confirmDelete === v.id ? (
                      <span className="inline-flex items-center gap-2 text-xs">
                        Sikker?
                        <button type="button" className="font-semibold text-red-700 hover:underline"
                          onClick={() => { deleteMutation.mutate(v.id); setConfirmDelete(null); }}>
                          Slet
                        </button>
                        <button type="button" className="hover:underline" onClick={() => setConfirmDelete(null)}>Fortryd</button>
                      </span>
                    ) : (
                      <button type="button" className="text-xs text-red-700 hover:underline" onClick={() => setConfirmDelete(v.id)}>
                        Slet
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={9} className="p-6 text-center text-brand-ink/50">Ingen biler matcher.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
