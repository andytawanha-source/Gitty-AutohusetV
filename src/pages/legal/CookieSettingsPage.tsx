import { Seo } from "@/components/seo/Seo";
import { useConsent } from "@/features/consent/ConsentProvider";
import { formatDateTime } from "@/lib/format";

export default function CookieSettingsPage() {
  const { consent, openPreferences } = useConsent();

  return (
    <div className="container max-w-3xl py-12 lg:py-16">
      <Seo title="Cookieindstillinger" />
      <h1 className="font-display text-3xl font-bold text-brand-primary">Cookieindstillinger</h1>
      <p className="mt-3 leading-relaxed text-brand-ink/70">
        Her kan du til enhver tid se og ændre dit cookiesamtykke. Nødvendige cookies er altid aktive,
        fordi de kræves for, at hjemmesiden fungerer.
      </p>

      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-brand-ink/5">
        {consent ? (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Funktionelle</dt><dd className="font-semibold">{consent.functional ? "Accepteret" : "Afvist"}</dd></div>
            <div className="flex justify-between"><dt>Statistik</dt><dd className="font-semibold">{consent.statistics ? "Accepteret" : "Afvist"}</dd></div>
            <div className="flex justify-between"><dt>Marketing</dt><dd className="font-semibold">{consent.marketing ? "Accepteret" : "Afvist"}</dd></div>
            <div className="flex justify-between border-t border-brand-ink/10 pt-2 text-brand-ink/50">
              <dt>Valg truffet</dt><dd>{formatDateTime(consent.decidedAt)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-brand-ink/70">Du har endnu ikke truffet et valg.</p>
        )}
        <button
          type="button"
          onClick={openPreferences}
          className="mt-5 rounded-md bg-brand-gradient px-5 py-2.5 font-medium text-white hover:opacity-90"
        >
          Ændr cookieindstillinger
        </button>
      </div>
    </div>
  );
}
