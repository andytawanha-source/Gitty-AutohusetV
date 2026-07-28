import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Plus } from "lucide-react";
import { useAdminVehicles, useDeleteVehicle } from "../api";
import { cn } from "@/lib/utils";
import { checkVehicleQuality, findDuplicateVehicle } from "../vehicleQuality";

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

const AVAILABILITY_LABELS: Record<string, string> = {
  available: "Ledig",
  booked: "Optaget",
  maintenance: "Ikke tilgængelig",
};

const AVAILABILITY_STYLES: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-800",
  booked: "bg-amber-100 text-amber-800",
  maintenance: "bg-gray-100 text-gray-600",
};

export default function AdminRentalVehiclesPage() {
  const { data: allVehicles, isLoading } = useAdminVehicles("rental");
  const deleteMutation = useDeleteVehicle();
  const [search, setSearch] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const vehicles = allVehicles ?? [];

  const filtered = useMemo(() => {
    let list = vehicles;
    if (availabilityFilter) list = list.filter((v) => v.rentalDetails?.availabilityStatus === availabilityFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) => [v.make, v.model, v.variant, v.registrationNumber].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    return list;
  }, [vehicles, search, availabilityFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-brand-primary">Lejebiler</h1>
        <Link to="/admin/lejebiler/ny"
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <Plus className="h-4 w-4" aria-hidden /> Opret lejebil
        </Link>
      </div>

      <p className="text-sm text-brand-ink/60">
        Udlejning sker gennem samarbejdspartneren One2Move. Disse biler vises på den offentlige side under "Biludlejning".
      </p>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Søg mærke, model, reg.nr.…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm"
          aria-label="Søg i lejebiler"
        />
        <select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)}
          className="rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm" aria-label="Filtrér på ledighed">
          <option value="">Alle</option>
          {Object.entries(AVAILABILITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-brand-ink/5">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-brand-ink/10 text-left text-xs uppercase tracking-wide text-brand-ink/50">
              <th className="p-3"><span className="sr-only">Billede</span></th>
              <th className="p-3">Bil</th>
              <th className="p-3">Pris/dag</th>
              <th className="p-3">Afhentning</th>
              <th className="p-3">Status</th>
              <th className="p-3">Ledighed</th>
              <th className="p-3">Kvalitet</th>
              <th className="p-3"><span className="sr-only">Handlinger</span></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} className="p-6 text-center text-brand-ink/50">Indlæser…</td></tr>
            )}
            {filtered.map((v) => {
              const quality = checkVehicleQuality(v);
              const dup = findDuplicateVehicle(vehicles, v);
              const availability = v.rentalDetails?.availabilityStatus ?? "available";
              return (
                <tr key={v.id} className="border-b border-brand-ink/5 hover:bg-brand-ink/[0.02]">
                  <td className="p-3">
                    {v.images[0] ? (
                      <img src={v.images[0].url} alt="" className="h-10 w-14 rounded object-cover ring-1 ring-brand-ink/10" />
                    ) : (
                      <div className="h-10 w-14 rounded bg-brand-ink/5" />
                    )}
                  </td>
                  <td className="p-3">
                    <Link to={`/admin/lejebiler/${v.id}`} className="font-medium text-brand-primary hover:underline">
                      {v.make} {v.model} {v.variant}
                    </Link>
                    {dup && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-700" title="Muligt duplikat">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Dublet?
                      </span>
                    )}
                  </td>
                  <td className="p-3">{v.rentalDetails?.pricePerDayDkk != null ? `${v.rentalDetails.pricePerDayDkk.toLocaleString("da-DK")} kr.` : "–"}</td>
                  <td className="p-3">{v.rentalDetails?.pickupLocation ?? "–"}</td>
                  <td className="p-3">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_STYLES[v.status])}>
                      {STATUS_LABELS[v.status]}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", AVAILABILITY_STYLES[availability])}>
                      {AVAILABILITY_LABELS[availability]}
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
              <tr><td colSpan={8} className="p-6 text-center text-brand-ink/50">Ingen lejebiler matcher.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
