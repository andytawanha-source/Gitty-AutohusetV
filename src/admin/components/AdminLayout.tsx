import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, Car, FlaskConical, History, KeyRound, LayoutDashboard, LogOut, Menu, MessageSquare, Settings, Users, X } from "lucide-react";
import { useAdminAuth } from "../auth";
import { useAdminInquiries, useAdminLeads } from "../api";
import { useBrand } from "@/app/BrandProvider";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/biler", label: "Biler til salg", icon: Car },
  { to: "/admin/lejebiler", label: "Lejebiler", icon: KeyRound },
  { to: "/admin/leads", label: "Leads", icon: MessageSquare, showLeadBadge: true },
  { to: "/admin/statistik", label: "Statistik", icon: BarChart3 },
  { to: "/admin/brugere", label: "Brugere", icon: Users, roles: ["dealer_admin" as const] },
  { to: "/admin/aktivitetslog", label: "Aktivitetslog", icon: History, roles: ["dealer_admin" as const] },
  { to: "/admin/indstillinger", label: "Indstillinger", icon: Settings, roles: ["dealer_admin" as const] },
];

export function AdminLayout() {
  const { user, isDemo, signOut, hasRole } = useAdminAuth();
  const brand = useBrand();
  const navigate = useNavigate();
  const [mobileNav, setMobileNav] = useState(false);
  const { data: leads } = useAdminLeads();
  const { data: inquiries } = useAdminInquiries();

  const newLeadCount = (leads?.filter((l) => l.status === "new").length ?? 0) + (inquiries?.filter((i) => i.status === "new").length ?? 0);

  const items = NAV.filter((item) => !item.roles || hasRole(...item.roles));

  return (
    <div className="flex min-h-screen bg-brand-surface">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 -translate-x-full bg-brand-gradient text-white transition-transform lg:static lg:translate-x-0",
          mobileNav && "translate-x-0"
        )}
        aria-label="Adminnavigation"
      >
        <div className="flex h-16 items-center justify-between px-5">
          <span className="font-display font-bold">{brand.name} · Admin</span>
          <button type="button" className="p-1 lg:hidden" aria-label="Luk menu" onClick={() => setMobileNav(false)}>
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <nav className="mt-2 space-y-1 px-3">
          {items.map(({ to, label, icon: Icon, end, showLeadBadge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileNav(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/10",
                  isActive && "bg-white/15 text-brand-accent"
                )
              }
            >
              <Icon className="h-4 w-4" aria-hidden /> {label}
              {showLeadBadge && newLeadCount > 0 && (
                <span className="ml-auto rounded-full bg-brand-accent px-2 py-0.5 text-xs font-bold text-brand-primary">
                  {newLeadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {mobileNav && (
        <button
          type="button"
          aria-label="Luk menu"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileNav(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-brand-ink/10 bg-white px-4 lg:px-6">
          <button type="button" className="rounded-md p-2 hover:bg-brand-ink/5 lg:hidden" aria-label="Åbn menu" onClick={() => setMobileNav(true)}>
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          {isDemo && (
            <p className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
              <FlaskConical className="h-3.5 w-3.5" aria-hidden /> DEMO-MODE – ændringer gemmes ikke
            </p>
          )}
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-brand-ink/70 sm:block">{user?.name}</span>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate("/admin/login");
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-brand-ink/15 px-3 py-1.5 text-sm hover:bg-brand-ink/5"
            >
              <LogOut className="h-4 w-4" aria-hidden /> Log ud
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
