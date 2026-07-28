import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAdminAuth } from "../auth";
import { useBrand } from "@/app/BrandProvider";
import { logAudit } from "../api";

const inputCls = "w-full rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm";

interface BrandSettings {
  legal_name: string;
  cvr: string;
  address: string;
  phone: string;
  email: string;
  lead_email: string;
  lead_response_time: string;
}

export default function AdminSettingsPage() {
  const { user } = useAdminAuth();
  const brand = useBrand();
  const [settings, setSettings] = useState<BrandSettings>({
    legal_name: brand.contact.legalName,
    cvr: brand.contact.cvr,
    address: brand.contact.address,
    phone: brand.contact.phone,
    email: brand.contact.email,
    lead_email: brand.contact.leadEmail,
    lead_response_time: brand.leadResponseTime,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;
    getSupabase()
      .from("brands")
      .select("legal_name, cvr, address, phone, email, lead_email, lead_response_time")
      .eq("organization_id", user.organizationId)
      .single()
      .then(({ data }) => {
        if (data) setSettings(data as BrandSettings);
      });
  }, [user]);

  const set = <K extends keyof BrandSettings>(key: K, value: string) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!isSupabaseConfigured) {
      setMessage("DEMO-MODE: Indstillinger gemmes ikke uden et konfigureret Supabase-projekt.");
      return;
    }
    setSaving(true);
    const { error } = await getSupabase()
      .from("brands")
      .update(settings)
      .eq("organization_id", user!.organizationId);
    setSaving(false);
    setMessage(error ? `Kunne ikke gemme: ${error.message}` : "Indstillingerne er gemt.");
    if (!error) {
      void logAudit({ organizationId: user!.organizationId, actorId: user!.id, action: "settings.update", entityType: "brand" });
    }
  };

  return (
    <form onSubmit={save} className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-brand-primary">Indstillinger</h1>
        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          Gem
        </button>
      </div>

      {message && <p className="rounded-md bg-brand-primary/5 p-3 text-sm" role="status">{message}</p>}

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-brand-ink/5">
        <h2 className="mb-4 font-display text-lg font-bold text-brand-primary">Virksomhedsoplysninger</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium">Juridisk navn</span>
            <input className={inputCls} value={settings.legal_name} onChange={(e) => set("legal_name", e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">CVR-nummer</span>
            <input className={inputCls} value={settings.cvr} onChange={(e) => set("cvr", e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Telefonnummer</span>
            <input className={inputCls} value={settings.phone} onChange={(e) => set("phone", e.target.value)} />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium">Adresse</span>
            <input className={inputCls} value={settings.address} onChange={(e) => set("address", e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Offentlig e-mail</span>
            <input type="email" className={inputCls} value={settings.email} onChange={(e) => set("email", e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Lead-modtager (e-mail)</span>
            <input type="email" className={inputCls} value={settings.lead_email} onChange={(e) => set("lead_email", e.target.value)} />
            <span className="mt-1 block text-xs text-brand-ink/50">Nye leads sendes til denne adresse.</span>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium">Forventet responstid (vises til kunder)</span>
            <input className={inputCls} value={settings.lead_response_time} onChange={(e) => set("lead_response_time", e.target.value)} />
          </label>
        </div>
      </section>

      <section className="rounded-xl bg-white p-5 text-sm text-brand-ink/60 shadow-sm ring-1 ring-brand-ink/5">
        <h2 className="mb-2 font-display text-lg font-bold text-brand-primary">Øvrige indstillinger</h2>
        <p>
          Åbningstider, heroindhold, forsidetekster, SEO-standarder, farver/logo, juridiske tekster,
          nummerpladeleverandør, e-mail-, tracking- og cookieindstillinger redigeres i databasen
          (<code>brands</code>, <code>site_settings</code>, <code>integration_settings</code>, <code>legal_documents</code>)
          og udbygges med dedikerede formularer efter behov. Hemmelige API-nøgler sættes ALTID som
          Supabase-function-secrets – aldrig her.
        </p>
      </section>
    </form>
  );
}
