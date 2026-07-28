import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { applyConsentToTracking, initConsentMode } from "@/features/tracking/init";

/**
 * Consent-styring (spec pkt. 17/18):
 *  - Fire kategorier: nødvendige (altid), funktionelle, statistik, marketing.
 *  - Intet ikke-nødvendigt tracking før samtykke (Google Consent Mode v2: alt denied som default).
 *  - Valget kan altid ændres via /cookieindstillinger eller footerlinket.
 *  - Samtykket versioneres, så en ny banner kan vises ved væsentlige ændringer.
 */

export const CONSENT_VERSION = "v1";
const STORAGE_KEY = "autohuset:consent";

export interface ConsentState {
  version: string;
  decidedAt: string;
  functional: boolean;
  statistics: boolean;
  marketing: boolean;
}

interface ConsentContextValue {
  consent: ConsentState | null; // null = intet valg truffet endnu
  bannerVisible: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (prefs: Pick<ConsentState, "functional" | "statistics" | "marketing">) => void;
  openPreferences: () => void;
  preferencesOpen: boolean;
  closePreferences: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

function readStoredConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_VERSION) return null; // ny version → spørg igen
    return parsed;
  } catch {
    return null;
  }
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    initConsentMode(); // default: alt ikke-nødvendigt denied
    const stored = readStoredConsent();
    if (stored) {
      setConsent(stored);
      applyConsentToTracking(stored);
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((next: ConsentState) => {
    setConsent(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage utilgængelig – consent gælder så kun for sessionen
    }
    applyConsentToTracking(next);
  }, []);

  const decide = useCallback(
    (functional: boolean, statistics: boolean, marketing: boolean) => {
      persist({
        version: CONSENT_VERSION,
        decidedAt: new Date().toISOString(),
        functional,
        statistics,
        marketing,
      });
      setPreferencesOpen(false);
    },
    [persist]
  );

  return (
    <ConsentContext.Provider
      value={{
        consent,
        bannerVisible: loaded && consent === null,
        acceptAll: () => decide(true, true, true),
        rejectAll: () => decide(false, false, false),
        savePreferences: (p) => decide(p.functional, p.statistics, p.marketing),
        openPreferences: () => setPreferencesOpen(true),
        preferencesOpen,
        closePreferences: () => setPreferencesOpen(false),
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent skal bruges inden for ConsentProvider");
  return ctx;
}
