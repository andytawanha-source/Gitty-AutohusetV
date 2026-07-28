import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAdminInquiries, useAdminLeads, useAdminVehicles, useVehicleStatusHistory, useVehicleViewStats } from "../api";

/**
 * Letvægts statistikside – alt beregnes klient-side ud fra data, vi allerede
 * henter andre steder i panelet (leads, henvendelser, biler) plus to nye,
 * simple aggregeringer af eksisterende tabeller (vehicle_views,
 * vehicle_status_history). Ingen ny backend-infrastruktur, jf. Fase 3-planen.
 */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
      <h2 className="mb-4 font-display text-lg font-bold text-brand-primary">{title}</h2>
      {children}
    </div>
  );
}

function Bar({ label, count, max, to }: { label: string; count: number; max: number; to?: string }) {
  const content = (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-44 shrink-0 truncate text-brand-ink/70">{label}</span>
      <span className="h-2 rounded-full bg-brand-accent" style={{ width: `${Math.min(100, (count / Math.max(max, 1)) * 100)}%` }} aria-hidden />
      <span className="font-medium">{count}</span>
    </div>
  );
  return to ? (
    <Link to={to} className="block rounded px-1 py-0.5 hover:bg-brand-ink/[0.03]">
      {content}
    </Link>
  ) : (
    <li>{content}</li>
  );
}

export default function AdminStatsPage() {
  const vehiclesQuery = useAdminVehicles();
  const leadsQuery = useAdminLeads();
  const inquiriesQuery = useAdminInquiries();
  const viewStatsQuery = useVehicleViewStats();
  const statusHistoryQuery = useVehicleStatusHistory();

  const vehicles = vehiclesQuery.data ?? [];
  const leads = leadsQuery.data ?? [];
  const inquiries = inquiriesQuery.data ?? [];
  const viewStats = viewStatsQuery.data ?? [];
  const statusHistory = statusHistoryQuery.data ?? [];

  const isLoading = vehiclesQuery.isLoading || leadsQuery.isLoading || inquiriesQuery.isLoading;

  const leadsBySource = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const l of leads) acc[l.source] = (acc[l.source] ?? 0) + 1;
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  const inquiriesPerVehicle = useMemo(() => {
    const acc = new Map<string, { label: string; slug: string | null; count: number }>();
    for (const i of inquiries) {
      if (!i.vehicle) continue;
      const key = i.vehicle.slug ?? [i.vehicle.make, i.vehicle.model, i.vehicle.variant].filter(Boolean).join(" ");
      const label = [i.vehicle.make, i.vehicle.model, i.vehicle.variant].filter(Boolean).join(" ") || "Ukendt bil";
      const existing = acc.get(key);
      if (existing) existing.count += 1;
      else acc.set(key, { label, slug: i.vehicle.slug, count: 1 });
    }
    return [...acc.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  }, [inquiries]);

  const mostViewed = useMemo(() => {
    const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
    return [...viewStats]
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, 10)
      .map((s) => {
        const v = vehicleById.get(s.vehicleId);
        return { label: v ? [v.make, v.model, v.variant].filter(Boolean).join(" ") : s.vehicleId, slug: v?.slug ?? null, views: s.totalViews };
      });
  }, [viewStats, vehicles]);

  const conversion = useMemo(() => {
    const relevant = leads.filter((l) => ["won", "lost"].includes(l.status));
    const won = leads.filter((l) => l.status === "won").length;
    return relevant.length > 0 ? Math.round((won / relevant.length) * 100) : null;
  }, [leads]);

  const daysOnLot = useMemo(() => {
    const publishedAt = new Map<string, number>();
    const results: number[] = [];
    for (const change of statusHistory) {
      if (change.toStatus === "published" && !publishedAt.has(change.vehicleId)) {
        publishedAt.set(change.vehicleId, new Date(change.createdAt).getTime());
      }
      if (change.toStatus === "sold" && publishedAt.has(change.vehicleId)) {
        const days = (new Date(change.createdAt).getTime() - publishedAt.get(change.vehicleId)!) / 86_400_000;
        results.push(days);
      }
    }
    return results.length > 0 ? Math.round(results.reduce((a, b) => a + b, 0) / results.length) : null;
  }, [statusHistory]);

  const soldCount = vehicles.filter((v) => v.status === "sold").length;
  const activeCount = vehicles.filter((v) => v.status === "published").length;

  if (isLoading) {
    return <p className="text-brand-ink/50">Indlæser statistik…</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-brand-primary">Statistik</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Aktive biler">
          <p className="font-display text-3xl font-bold text-brand-primary">{activeCount}</p>
        </Card>
        <Card title="Solgte biler">
          <p className="font-display text-3xl font-bold text-brand-primary">{soldCount}</p>
        </Card>
        <Card title="Konvertering (vundet/tabt)">
          <p className="font-display text-3xl font-bold text-brand-primary">{conversion === null ? "–" : `${conversion}%`}</p>
          {conversion === null && <p className="mt-1 text-xs text-brand-ink/50">Ingen leads er endnu markeret vundet/tabt.</p>}
        </Card>
        <Card title="Gns. liggetid til salg">
          <p className="font-display text-3xl font-bold text-brand-primary">{daysOnLot === null ? "–" : `${daysOnLot} dage`}</p>
          {daysOnLot === null && <p className="mt-1 text-xs text-brand-ink/50">Kræver mindst én solgt bil med statushistorik.</p>}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Leadkilder">
          {leadsBySource.length === 0 ? (
            <p className="text-sm text-brand-ink/50">Ingen leads endnu.</p>
          ) : (
            <ul className="space-y-2">
              {leadsBySource.map(([source, count]) => (
                <Bar key={source} label={source} count={count} max={leadsBySource[0][1]} />
              ))}
            </ul>
          )}
        </Card>

        <Card title="Mest viste biler">
          {mostViewed.length === 0 ? (
            <p className="text-sm text-brand-ink/50">Ingen visningsdata endnu (eller demo-mode).</p>
          ) : (
            <ul className="space-y-2">
              {mostViewed.map((v) => (
                <Bar key={v.label + v.views} label={v.label} count={v.views} max={mostViewed[0].views} to={v.slug ? `/biler/${v.slug}` : undefined} />
              ))}
            </ul>
          )}
        </Card>

        <Card title="Henvendelser pr. bil">
          {inquiriesPerVehicle.length === 0 ? (
            <p className="text-sm text-brand-ink/50">Ingen bilspecifikke henvendelser endnu.</p>
          ) : (
            <ul className="space-y-2">
              {inquiriesPerVehicle.map((v) => (
                <Bar key={v.label} label={v.label} count={v.count} max={inquiriesPerVehicle[0].count} to={v.slug ? `/biler/${v.slug}` : undefined} />
              ))}
            </ul>
          )}
        </Card>

        <Card title="Leads fordelt på status">
          <ul className="space-y-2">
            {Object.entries(
              leads.reduce<Record<string, number>>((acc, l) => {
                acc[l.status] = (acc[l.status] ?? 0) + 1;
                return acc;
              }, {})
            ).map(([status, count]) => (
              <Bar key={status} label={status} count={count} max={leads.length} />
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
