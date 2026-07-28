import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Seo } from "@/components/seo/Seo";
import { useInventory } from "@/features/vehicles/api";
import { useFavorites } from "@/features/favorites/useFavorites";
import { VehicleGrid, VehicleGridSkeleton } from "@/components/vehicles/VehicleGrid";

export default function FavoritesPage() {
  const { data, isLoading } = useInventory();
  const { favorites } = useFavorites();
  const vehicles = (data ?? []).filter((v) => favorites.includes(v.id));

  return (
    <div className="container py-10 lg:py-14">
      <Seo title="Favoritter" index={false} />
      <h1 className="font-display text-3xl font-bold text-brand-primary lg:text-4xl">Dine favoritter</h1>
      <div className="mt-8">
        {isLoading && <VehicleGridSkeleton count={3} />}
        {!isLoading && vehicles.length === 0 && (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-brand-ink/5">
            <Heart className="mx-auto h-10 w-10 text-brand-ink/20" aria-hidden />
            <p className="mt-3 font-display text-lg font-semibold">Du har ingen favoritter endnu</p>
            <p className="mt-1 text-brand-ink/70">Tryk på hjertet på en bil for at gemme den her.</p>
            <Link to="/biler" className="mt-5 inline-block rounded-md bg-brand-gradient px-6 py-2.5 font-medium text-white hover:opacity-90">
              Se biler til salg
            </Link>
          </div>
        )}
        {vehicles.length > 0 && <VehicleGrid vehicles={vehicles} />}
      </div>
    </div>
  );
}
