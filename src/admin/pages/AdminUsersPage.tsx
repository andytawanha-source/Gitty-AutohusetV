import { useState } from "react";
import { Loader2, Trash2, UserPlus, X } from "lucide-react";
import { useInviteMember, useOrgMembers, useRemoveMember, useUpdateMemberRoles } from "../api";
import type { AdminRole } from "../auth";
import { useAdminAuth } from "../auth";

export const ROLE_LABELS: Record<string, string> = {
  superadmin: "Superadmin",
  dealer_admin: "Forhandleradmin",
  editor: "Redaktør",
  lead_agent: "Leadmedarbejder",
  sales_agent: "Sælger",
  rental_agent: "Udlejningsmedarbejder",
};

const ASSIGNABLE_ROLES: AdminRole[] = ["dealer_admin", "editor", "lead_agent", "sales_agent", "rental_agent"];

function RoleCheckboxes({ selected, onChange }: { selected: AdminRole[]; onChange: (roles: AdminRole[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ASSIGNABLE_ROLES.map((role) => {
        const checked = selected.includes(role);
        return (
          <label
            key={role}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              checked ? "border-brand-primary bg-brand-primary/10 text-brand-primary" : "border-brand-ink/15 text-brand-ink/60 hover:bg-brand-ink/5"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(e.target.checked ? [...selected, role] : selected.filter((r) => r !== role))}
              className="sr-only"
            />
            {ROLE_LABELS[role]}
          </label>
        );
      })}
    </div>
  );
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const invite = useInviteMember();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [roles, setRoles] = useState<AdminRole[]>(["lead_agent"]);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (roles.length === 0) {
      setError("Vælg mindst én rolle.");
      return;
    }
    try {
      await invite.mutateAsync({ email, fullName, roles });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke invitere brugeren.");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-brand-ink/10 bg-brand-surface-warm/40 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-brand-primary">Invitér ny bruger</h2>
        <button type="button" onClick={onDone} aria-label="Luk" className="rounded-full p-1.5 hover:bg-brand-ink/5">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="inv-name" className="mb-1 block text-sm font-medium">Navn</label>
          <input id="inv-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="inv-email" className="mb-1 block text-sm font-medium">E-mail</label>
          <input id="inv-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-medium">Roller</p>
        <RoleCheckboxes selected={roles} onChange={setRoles} />
      </div>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      <button
        type="submit"
        disabled={invite.isPending}
        className="inline-flex items-center gap-2 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {invite.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <UserPlus className="h-4 w-4" aria-hidden />}
        Send invitation
      </button>
    </form>
  );
}

export default function AdminUsersPage() {
  const { user, isDemo } = useAdminAuth();
  const { data: members, isLoading } = useOrgMembers();
  const updateRoles = useUpdateMemberRoles();
  const removeMember = useRemoveMember();
  const [showInvite, setShowInvite] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftRoles, setDraftRoles] = useState<AdminRole[]>([]);

  const startEdit = (id: string, roles: AdminRole[]) => {
    setEditingId(id);
    setDraftRoles(roles);
  };

  const saveRoles = async (id: string) => {
    await updateRoles.mutateAsync({ profileId: id, roles: draftRoles });
    setEditingId(null);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-brand-primary">Brugere og roller</h1>
        {!showInvite && (
          <button
            type="button"
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" aria-hidden /> Invitér bruger
          </button>
        )}
      </div>

      {isDemo && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          DEMO-MODE: invitationer, rolleændringer og fjernelser gemmes kun i denne browsersession.
        </p>
      )}

      {showInvite && <InviteForm onDone={() => setShowInvite(false)} />}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-brand-ink/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-ink/10 text-left text-xs uppercase tracking-wide text-brand-ink/50">
              <th className="p-3">Bruger</th>
              <th className="p-3">Roller</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-brand-ink/50">Indlæser…</td>
              </tr>
            )}
            {(members ?? []).map((m) => (
              <tr key={m.id} className="border-b border-brand-ink/5 align-top">
                <td className="p-3 font-medium">{m.name}</td>
                <td className="p-3">
                  {editingId === m.id ? (
                    <RoleCheckboxes selected={draftRoles} onChange={setDraftRoles} />
                  ) : m.roles.length ? (
                    m.roles.map((r) => (
                      <span key={r} className="mr-1.5 mb-1 inline-block rounded-full bg-brand-primary/10 px-2.5 py-1 text-xs font-medium text-brand-primary">
                        {ROLE_LABELS[r] ?? r}
                      </span>
                    ))
                  ) : (
                    <span className="text-brand-ink/40">Ingen roller</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  {editingId === m.id ? (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => void saveRoles(m.id)}
                        disabled={updateRoles.isPending}
                        className="rounded-md bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                      >
                        Gem
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="rounded-md px-3 py-1.5 text-xs text-brand-ink/60 hover:bg-brand-ink/5">
                        Annullér
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => startEdit(m.id, m.roles)} className="rounded-md px-3 py-1.5 text-xs font-medium text-brand-primary hover:bg-brand-primary/5">
                        Rediger roller
                      </button>
                      {m.id !== user?.id && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Fjern ${m.name} fra organisationen?`)) void removeMember.mutateAsync(m.id);
                          }}
                          aria-label={`Fjern ${m.name}`}
                          className="rounded-md p-1.5 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-brand-ink/50">
        Rettigheder håndhæves autoritativt af Row Level Security i databasen – rollevisningen her styrer kun adgang til
        adminpanelets brugerflade.
      </p>
    </div>
  );
}
