import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import { Seo } from "@/components/seo/Seo";
import { useAdminAuth } from "../auth";
import { useBrand } from "@/app/BrandProvider";

export default function AdminLoginPage() {
  const { signIn, isDemo } = useAdminAuth();
  const brand = useBrand();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result) {
      setError(result);
      return;
    }
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/admin";
    navigate(from, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-primary p-4">
      <Seo title="Admin login" index={false} />
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <Lock className="mx-auto h-8 w-8 text-brand-primary" aria-hidden />
          <h1 className="mt-3 font-display text-xl font-bold text-brand-primary">{brand.name} · Admin</h1>
          {isDemo && (
            <p className="mt-2 rounded-md bg-amber-50 p-2 text-xs text-amber-900">
              DEMO-MODE: Log ind med <strong>demo@demo.dk</strong> / <strong>demo1234</strong>
            </p>
          )}
        </div>

        <label htmlFor="login-email" className="mb-1 block text-sm font-medium">E-mail</label>
        <input
          id="login-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-md border border-brand-ink/15 px-3 py-2.5 text-sm"
        />
        <label htmlFor="login-password" className="mb-1 block text-sm font-medium">Adgangskode</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-md border border-brand-ink/15 px-3 py-2.5 text-sm"
        />

        {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-gradient px-4 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Log ind
        </button>
      </form>
    </div>
  );
}
