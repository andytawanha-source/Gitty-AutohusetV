import { useAuditLog } from "../api";
import { formatDateTime } from "@/lib/format";

const ACTION_LABELS: Record<string, string> = {
  "vehicle.create": "Bil oprettet",
  "vehicle.update": "Bil opdateret",
  "vehicle.status_changed": "Bilstatus ændret",
  "vehicle.delete": "Bil slettet",
  "lead.status_changed": "Lead-status ændret",
  "inquiry.status_changed": "Henvendelse-status ændret",
  "user.invited": "Bruger inviteret",
  "user.roles_changed": "Brugerroller ændret",
  "user.removed": "Bruger fjernet",
  "settings.update": "Indstillinger opdateret",
};

export default function AdminAuditLogPage() {
  const { data: entries, isLoading } = useAuditLog();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-brand-primary">Aktivitetslog</h1>
      <p className="text-sm text-brand-ink/60">
        Viser de seneste 200 handlinger foretaget i adminpanelet af dig og dine kolleger. Kun tilgængelig for
        forhandleradministratorer.
      </p>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-brand-ink/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-ink/10 text-left text-xs uppercase tracking-wide text-brand-ink/50">
              <th className="p-3">Tidspunkt</th>
              <th className="p-3">Bruger</th>
              <th className="p-3">Handling</th>
              <th className="p-3">Detaljer</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-brand-ink/50">Indlæser…</td>
              </tr>
            )}
            {!isLoading && (entries ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-brand-ink/50">Ingen registrerede handlinger endnu.</td>
              </tr>
            )}
            {(entries ?? []).map((entry) => (
              <tr key={entry.id} className="border-b border-brand-ink/5 align-top">
                <td className="whitespace-nowrap p-3 text-brand-ink/70">{formatDateTime(entry.createdAt)}</td>
                <td className="p-3 font-medium">{entry.actorName}</td>
                <td className="p-3">{ACTION_LABELS[entry.action] ?? entry.action}</td>
                <td className="max-w-xs truncate p-3 text-xs text-brand-ink/50" title={JSON.stringify(entry.details)}>
                  {Object.keys(entry.details).length > 0 ? JSON.stringify(entry.details) : "–"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
