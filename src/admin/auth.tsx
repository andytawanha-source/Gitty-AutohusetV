import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export type AdminRole = "superadmin" | "dealer_admin" | "editor" | "lead_agent" | "sales_agent" | "rental_agent";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  roles: AdminRole[];
}

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  hasRole: (...roles: AdminRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_USER: AdminUser = {
  id: "demo-admin",
  email: "demo-admin@example.invalid",
  name: "Demo Administrator (TESTDATA)",
  organizationId: "11111111-1111-1111-1111-111111111111",
  roles: ["dealer_admin"],
};

async function loadAdminUser(): Promise<AdminUser | null> {
  const supabase = getSupabase();
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) return null;

  const [{ data: membership }, { data: roles }, { data: profile }] = await Promise.all([
    supabase.from("organization_members").select("organization_id").eq("profile_id", session.user.id).limit(1).maybeSingle(),
    supabase.from("user_roles").select("role").eq("profile_id", session.user.id),
    supabase.from("profiles").select("full_name").eq("id", session.user.id).maybeSingle(),
  ]);

  if (!membership) return null; // Bruger uden organisation har ingen adminadgang

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: profile?.full_name ?? session.user.email ?? "Admin",
    organizationId: membership.organization_id,
    roles: (roles ?? []).map((r) => r.role as AdminRole),
  };
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemo = !isSupabaseConfigured;

  useEffect(() => {
    if (isDemo) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    loadAdminUser()
      .then((u) => !cancelled && setUser(u))
      .finally(() => !cancelled && setLoading(false));
    const { data: sub } = getSupabase().auth.onAuthStateChange((_event, session) => {
      if (!session) setUser(null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [isDemo]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      if (isDemo) {
        // Demo-mode: fast demo-login uden backend
        if (email === "demo@demo.dk" && password === "demo1234") {
          setUser(DEMO_USER);
          return null;
        }
        return "Demo-mode: log ind med demo@demo.dk / demo1234";
      }
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      if (error) return "Forkert e-mail eller adgangskode.";
      const loaded = await loadAdminUser();
      if (!loaded) {
        await getSupabase().auth.signOut();
        return "Din bruger har ikke adgang til adminpanelet.";
      }
      setUser(loaded);
      return null;
    },
    [isDemo]
  );

  const signOut = useCallback(async () => {
    if (!isDemo) await getSupabase().auth.signOut();
    setUser(null);
  }, [isDemo]);

  const hasRole = useCallback(
    (...roles: AdminRole[]) =>
      !!user && (user.roles.includes("superadmin") || roles.some((r) => user.roles.includes(r))),
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, isDemo, signIn, signOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAdminAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAdminAuth skal bruges inden for AdminAuthProvider");
  return ctx;
}

export function RequireAuth({ children, roles }: { children: ReactNode; roles?: AdminRole[] }) {
  const { user, loading, hasRole } = useAdminAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Indlæser">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  if (roles && roles.length > 0 && !hasRole(...roles)) {
    return (
      <div className="p-10 text-center">
        <h1 className="font-display text-xl font-bold text-brand-primary">Ingen adgang</h1>
        <p className="mt-2 text-brand-ink/70">Din rolle giver ikke adgang til denne side.</p>
      </div>
    );
  }
  return <>{children}</>;
}
