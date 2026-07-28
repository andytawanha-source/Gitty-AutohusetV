import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowLeftRight, FlaskConical, Loader2, Send, UserCheck } from "lucide-react";
import { useAddLeadNote, useAdminLeadDetail, useUpdateLead } from "../api";
import { LEAD_STATUS_LABELS, type AdminLeadStatus } from "../types";
import { formatDateTime, formatMileage, formatPrice } from "@/lib/format";

function Row({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === undefined || value === null || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "Ja" : "Nej") : String(value);
  return (
    <div className="flex justify-between gap-4 border-b border-brand-ink/5 py-1.5 text-sm">
      <dt className="text-brand-ink/60">{label}</dt>
      <dd className="text-right font-medium">{display}</dd>
    </div>
  );
}

export default function AdminLeadDetailPage() {
  const { id } = useParams();
  const { data: lead, isLoading } = useAdminLeadDetail(id);
  const updateLead = useUpdateLead();
  const addNote = useAddLeadNote();
  const [note, setNote] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [followUp, setFollowUp] = useState("");

  if (isLoading) return <p className="p-6 text-brand-ink/50">Indlæser…</p>;
  if (!lead) return <p className="p-6">Leadet blev ikke fundet.</p>;

  const changeStatus = (status: AdminLeadStatus) => {
    if (status === "lost") {
      const reason = lostReason || window.prompt("Årsag til tab?") || "";
      updateLead.mutate({ id: lead.id, status, lostReason: reason });
    } else {
      updateLead.mutate({ id: lead.id, status });
    }
  };

  const c = lead.condition as Record<string, unknown> | null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/admin/leads" className="rounded-md p-2 hover:bg-brand-ink/5" aria-label="Tilbage til leads">
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
        <h1 className="font-display text-2xl font-bold text-brand-primary">{lead.reference}</h1>
        <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-sm font-medium text-brand-primary">
          {LEAD_STATUS_LABELS[lead.status]}
        </span>
        {lead.interestVehicle && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
            <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden /> Byttebil
          </span>
        )}
        {lead.vehicle?.isMock && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden /> Mock-opslag
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
            <h2 className="mb-3 font-display text-lg font-bold text-brand-primary">Bilen</h2>
            <dl>
              <Row label="Bil" value={[lead.vehicle?.make, lead.vehicle?.model, lead.vehicle?.variant].filter(Boolean).join(" ")} />
              <Row label="Nummerplade" value={lead.registrationNumber} />
              <Row label="Kilometerstand" value={lead.mileageKm !== null ? formatMileage(lead.mileageKm) : null} />
              <Row label="Årgang" value={lead.vehicle?.modelYear} />
              <Row label="Drivmiddel" value={lead.vehicle?.fuelType} />
              <Row label="Gearkasse" value={lead.vehicle?.transmission} />
              <Row label="Farve" value={lead.vehicle?.color} />
              <Row label="Datakilde" value={lead.vehicle?.provider} />
            </dl>
          </section>

          {lead.interestVehicle && (
            <section className="rounded-xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
              <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-emerald-900">
                <ArrowLeftRight className="h-5 w-5" aria-hidden /> Ønsker at bytte til
              </h2>
              <dl>
                <div className="flex justify-between gap-4 border-b border-emerald-200/60 py-1.5 text-sm">
                  <dt className="text-emerald-900/70">Bil</dt>
                  <dd className="text-right font-medium">
                    {lead.interestVehicle.slug ? (
                      <Link to={`/biler/${lead.interestVehicle.slug}`} target="_blank" className="text-emerald-900 underline hover:no-underline">
                        {lead.interestVehicle.label}
                      </Link>
                    ) : (
                      lead.interestVehicle.label
                    )}
                  </dd>
                </div>
                <Row label="Pris" value={lead.interestVehicle.priceDkk !== null ? formatPrice(lead.interestVehicle.priceDkk) : null} />
              </dl>
              {lead.estimate && (
                <p className="mt-3 text-sm text-emerald-900">
                  Kunden fik vist et automatisk skøn på byttebilen på{" "}
                  <strong>
                    {formatPrice(lead.estimate.lowDkk)} – {formatPrice(lead.estimate.highDkk)}
                  </strong>{" "}
                  (baseret på {lead.estimate.sampleSize} sammenlignelig{lead.estimate.sampleSize === 1 ? "" : "e"} bil
                  {lead.estimate.sampleSize === 1 ? "" : "er"} på lager). Dette er ikke det bindende bud.
                </p>
              )}
            </section>
          )}

          {c && (
            <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
              <h2 className="mb-3 font-display text-lg font-bold text-brand-primary">Bilens stand</h2>
              <dl>
                <Row label="Kørende" value={(c.isDrivable ?? c.is_drivable) as boolean | null} />
                <Row label="Servicebog" value={(c.hasServiceBook ?? c.has_service_book) as boolean | null} />
                <Row label="Seneste service" value={(c.lastService ?? c.last_service) as string | null} />
                <Row label="Antal nøgler" value={(c.keyCount ?? c.key_count) as number | null} />
                <Row label="Skader" value={(c.knownDamages ?? c.known_damages) as string | null} />
                <Row label="Advarselslamper" value={(c.warningLights ?? c.warning_lights) as string | null} />
                <Row label="Mekaniske problemer" value={(c.mechanicalIssues ?? c.mechanical_issues) as string | null} />
                <Row label="Dæk" value={(c.tireCondition ?? c.tire_condition) as string | null} />
                <Row label="Kabine" value={(c.interiorCondition ?? c.interior_condition) as string | null} />
                <Row label="Røgfri" value={(c.smokeFree ?? c.smoke_free) as boolean | null} />
                <Row label="Importeret" value={(c.isImported ?? c.is_imported) as boolean | null} />
                <Row label="Restgæld" value={(c.hasOutstandingFinance ?? c.has_outstanding_finance) as boolean | null} />
                <Row label="Finansieringsdetaljer" value={(c.financeDetails ?? c.finance_details) as string | null} />
                <Row label="Ønsket salg" value={(c.saleTimeline ?? c.sale_timeline) as string | null} />
                <Row label="Kommentar" value={c.comment as string | null} />
              </dl>
            </section>
          )}

          {lead.images.length > 0 && (
            <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
              <h2 className="mb-3 font-display text-lg font-bold text-brand-primary">Billeder ({lead.images.length})</h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {lead.images.map((img) => (
                  <li key={img.id}>
                    <a href={img.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md ring-1 ring-brand-ink/10">
                      <img src={img.url} alt={img.category ?? "Leadbillede"} className="aspect-[4/3] w-full object-cover" />
                    </a>
                    <p className="mt-1 text-xs text-brand-ink/50">{img.category}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-brand-ink/50">Billederne ligger i privat storage og vises via tidsbegrænsede signerede links.</p>
            </section>
          )}

          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
            <h2 className="mb-3 font-display text-lg font-bold text-brand-primary">Noter</h2>
            <ul className="space-y-3">
              {lead.notes.map((n) => (
                <li key={n.id} className="rounded-md bg-brand-surface p-3 text-sm">
                  <p>{n.body}</p>
                  <p className="mt-1 text-xs text-brand-ink/50">{n.author} · {formatDateTime(n.createdAt)}</p>
                </li>
              ))}
              {lead.notes.length === 0 && <li className="text-sm text-brand-ink/50">Ingen noter endnu.</li>}
            </ul>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!note.trim()) return;
                addNote.mutate({ leadId: lead.id, body: note.trim() });
                setNote("");
              }}
            >
              <label htmlFor="lead-note" className="sr-only">Ny note</label>
              <input id="lead-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Skriv en intern note…"
                className="flex-1 rounded-md border border-brand-ink/15 px-3 py-2 text-sm" />
              <button type="submit" disabled={addNote.isPending} className="rounded-md bg-brand-gradient px-4 py-2 text-white disabled:opacity-60" aria-label="Gem note">
                {addNote.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
              </button>
            </form>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
            <h2 className="mb-3 font-display text-lg font-bold text-brand-primary">Kontakt</h2>
            <dl>
              <Row label="Navn" value={lead.contact?.name} />
              <Row label="Telefon" value={lead.contact?.phone} />
              <Row label="E-mail" value={lead.contact?.email} />
              <Row label="Postnr./by" value={[lead.contact?.postalCode, lead.contact?.city].filter(Boolean).join(" ")} />
              <Row label="Foretrukken kanal" value={lead.contact?.preferredChannel} />
              <Row label="Bedste tidspunkt" value={lead.contact?.bestContactTime} />
              <Row label="Besked" value={lead.contact?.message} />
            </dl>
            <div className="mt-3 space-y-1 text-sm">
              {lead.consents.map((consent, i) => (
                <p key={i} className="text-brand-ink/60">
                  {consent.type === "processing" ? "Behandlingssamtykke" : "Markedsføringssamtykke"}:{" "}
                  <strong className={consent.granted ? "text-emerald-700" : "text-red-700"}>
                    {consent.granted ? "Ja" : "Nej"}
                  </strong>{" "}
                  ({consent.version}{consent.channels.length ? `, ${consent.channels.join("/")}` : ""})
                </p>
              ))}
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
            <h2 className="mb-3 font-display text-lg font-bold text-brand-primary">Attribution</h2>
            <dl>
              <Row label="Landingsside" value={lead.attribution?.landingPage} />
              <Row label="UTM source" value={lead.attribution?.utmSource} />
              <Row label="UTM medium" value={lead.attribution?.utmMedium} />
              <Row label="UTM campaign" value={lead.attribution?.utmCampaign} />
              <Row label="Enhed" value={lead.attribution?.deviceType} />
              <Row label="Kilde" value={lead.source} />
            </dl>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
            <h2 className="mb-3 font-display text-lg font-bold text-brand-primary">Behandling</h2>
            <div className="space-y-3">
              <button type="button" onClick={() => updateLead.mutate({ id: lead.id, assignToSelf: true })}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-brand-primary px-4 py-2 text-sm font-medium text-brand-primary hover:bg-brand-primary/5">
                <UserCheck className="h-4 w-4" aria-hidden /> Tildel til mig {lead.assignedTo && `(nu: ${lead.assignedTo})`}
              </button>

              <label className="block text-sm">
                <span className="mb-1 block font-medium">Skift status</span>
                <select
                  value={lead.status}
                  onChange={(e) => changeStatus(e.target.value as AdminLeadStatus)}
                  className="w-full rounded-md border border-brand-ink/15 px-3 py-2 text-sm"
                >
                  {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>

              {lead.status === "lost" && (
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Årsag til tab</span>
                  <input value={lostReason || lead.lostReason || ""} onChange={(e) => setLostReason(e.target.value)}
                    onBlur={() => updateLead.mutate({ id: lead.id, lostReason })}
                    className="w-full rounded-md border border-brand-ink/15 px-3 py-2 text-sm" />
                </label>
              )}

              <label className="block text-sm">
                <span className="mb-1 block font-medium">Opfølgningsdato</span>
                <input type="datetime-local" value={followUp || (lead.followUpAt ? lead.followUpAt.slice(0, 16) : "")}
                  onChange={(e) => setFollowUp(e.target.value)}
                  onBlur={() => followUp && updateLead.mutate({ id: lead.id, followUpAt: new Date(followUp).toISOString() })}
                  className="w-full rounded-md border border-brand-ink/15 px-3 py-2 text-sm" />
              </label>
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
            <h2 className="mb-3 font-display text-lg font-bold text-brand-primary">Statushistorik</h2>
            <ol className="space-y-2 text-sm">
              {[...lead.history].reverse().map((h, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>
                    {h.from ? `${LEAD_STATUS_LABELS[h.from as AdminLeadStatus] ?? h.from} → ` : ""}
                    <strong>{LEAD_STATUS_LABELS[h.to as AdminLeadStatus] ?? h.to}</strong>
                  </span>
                  <span className="shrink-0 text-xs text-brand-ink/50">{formatDateTime(h.at)}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
