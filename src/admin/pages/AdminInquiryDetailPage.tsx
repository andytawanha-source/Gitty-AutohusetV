import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Send, UserCheck } from "lucide-react";
import { useAddInquiryNote, useAdminInquiryDetail, useUpdateInquiry } from "../api";
import { INQUIRY_TYPE_LABELS, LEAD_STATUS_LABELS, type AdminLeadStatus } from "../types";
import { formatDateTime } from "@/lib/format";

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 border-b border-brand-ink/5 py-1.5 text-sm">
      <dt className="text-brand-ink/60">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

/** Detaljevisning for henvendelser (kontakt/prøvetur/finansiering/leje/byttebil-klik). */
export default function AdminInquiryDetailPage() {
  const { id } = useParams();
  const { data: inquiry, isLoading } = useAdminInquiryDetail(id);
  const updateInquiry = useUpdateInquiry();
  const addNote = useAddInquiryNote();
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState("");

  if (isLoading) return <p className="p-6 text-brand-ink/50">Indlæser…</p>;
  if (!inquiry) return <p className="p-6">Henvendelsen blev ikke fundet.</p>;

  const attribution = inquiry.attribution as Record<string, unknown> | null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/admin/leads" className="rounded-md p-2 hover:bg-brand-ink/5" aria-label="Tilbage til leads">
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
        <h1 className="font-display text-2xl font-bold text-brand-primary">{INQUIRY_TYPE_LABELS[inquiry.inquiryType]}</h1>
        <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-sm font-medium text-brand-primary">
          {LEAD_STATUS_LABELS[inquiry.status]}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
            <h2 className="mb-3 font-display text-lg font-bold text-brand-primary">Henvendelse</h2>
            <dl>
              <Row label="Modtaget" value={formatDateTime(inquiry.createdAt)} />
              {inquiry.vehicle && (
                <Row label="Vedrører bil" value={[inquiry.vehicle.make, inquiry.vehicle.model, inquiry.vehicle.variant].filter(Boolean).join(" ")} />
              )}
              <Row label="Besked" value={inquiry.message} />
            </dl>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
            <h2 className="mb-3 font-display text-lg font-bold text-brand-primary">Noter</h2>
            <ul className="space-y-3">
              {inquiry.notes.map((n) => (
                <li key={n.id} className="rounded-md bg-brand-surface p-3 text-sm">
                  <p>{n.body}</p>
                  <p className="mt-1 text-xs text-brand-ink/50">{n.author} · {formatDateTime(n.createdAt)}</p>
                </li>
              ))}
              {inquiry.notes.length === 0 && <li className="text-sm text-brand-ink/50">Ingen noter endnu.</li>}
            </ul>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!note.trim()) return;
                addNote.mutate({ inquiryId: inquiry.id, body: note.trim() });
                setNote("");
              }}
            >
              <label htmlFor="inquiry-note" className="sr-only">Ny note</label>
              <input id="inquiry-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Skriv en intern note…"
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
              <Row label="Navn" value={inquiry.name} />
              <Row label="Telefon" value={inquiry.phone} />
              <Row label="E-mail" value={inquiry.email} />
            </dl>
          </section>

          {attribution && (
            <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
              <h2 className="mb-3 font-display text-lg font-bold text-brand-primary">Attribution</h2>
              <dl>
                <Row label="Landingsside" value={attribution.landing_page as string | null} />
                <Row label="UTM source" value={attribution.utm_source as string | null} />
                <Row label="UTM medium" value={attribution.utm_medium as string | null} />
                <Row label="UTM campaign" value={attribution.utm_campaign as string | null} />
              </dl>
            </section>
          )}

          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
            <h2 className="mb-3 font-display text-lg font-bold text-brand-primary">Behandling</h2>
            <div className="space-y-3">
              <button type="button" onClick={() => updateInquiry.mutate({ id: inquiry.id, assignToSelf: true })}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-brand-primary px-4 py-2 text-sm font-medium text-brand-primary hover:bg-brand-primary/5">
                <UserCheck className="h-4 w-4" aria-hidden /> Tildel til mig {inquiry.assignedTo && `(nu: ${inquiry.assignedTo})`}
              </button>

              <label className="block text-sm">
                <span className="mb-1 block font-medium">Skift status</span>
                <select
                  value={inquiry.status}
                  onChange={(e) => updateInquiry.mutate({ id: inquiry.id, status: e.target.value as AdminLeadStatus })}
                  className="w-full rounded-md border border-brand-ink/15 px-3 py-2 text-sm"
                >
                  {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium">Opfølgningsdato</span>
                <input type="datetime-local" value={followUp || (inquiry.followUpAt ? inquiry.followUpAt.slice(0, 16) : "")}
                  onChange={(e) => setFollowUp(e.target.value)}
                  onBlur={() => followUp && updateInquiry.mutate({ id: inquiry.id, followUpAt: new Date(followUp).toISOString() })}
                  className="w-full rounded-md border border-brand-ink/15 px-3 py-2 text-sm" />
              </label>
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
            <h2 className="mb-3 font-display text-lg font-bold text-brand-primary">Statushistorik</h2>
            <ol className="space-y-2 text-sm">
              {[...inquiry.history].reverse().map((h, i) => (
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
