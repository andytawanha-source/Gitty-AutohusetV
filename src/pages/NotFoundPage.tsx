import { Link } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";

export default function NotFoundPage() {
  return (
    <div className="container py-24 text-center">
      <Seo title="Siden blev ikke fundet" index={false} />
      <p className="font-display text-7xl font-bold text-brand-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Siden blev ikke fundet</h1>
      <p className="mt-2 text-brand-ink/70">Siden findes ikke, eller den er blevet flyttet.</p>
      <div className="mt-8 flex justify-center gap-4">
        <Link to="/" className="rounded-md bg-brand-gradient px-5 py-2.5 font-medium text-white hover:opacity-90">
          Til forsiden
        </Link>
        <Link to="/biler" className="rounded-md border border-brand-primary px-5 py-2.5 font-medium text-brand-primary hover:bg-brand-primary/5">
          Se biler til salg
        </Link>
      </div>
    </div>
  );
}
