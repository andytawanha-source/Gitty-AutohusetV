import { Link } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { useVehicles } from "@/features/vehicles/api";
import { VehicleGrid, VehicleGridSkeleton } from "@/components/vehicles/VehicleGrid";

export default function SoldVehiclesPage() {
  const { vehicles, isLoading } = useVehicles({ status: "sold" }, "newest");

  return (
    <div className="container py-10 lg:py-14">
      <Seo title="Solgte biler" description="Se et udvalg af de biler, vi har solgt." />
      <h1 className="font-display text-3xl font-bold text-brand-primary lg:text-4xl">Solgte biler</h1>
      <p className="mt-2 max-w-xl text-brand-ink/70">
        Et udvalg af biler, der har fundet nye ejere. Leder du efter noget lignende?{" "}
        <Link to="/kontakt" className="font-medium text-brand-primary underline">Kontakt os</Link> – vi finder gerne bilen til dig.
      </p>
      <div className="mt-8">
        {isLoading && <VehicleGridSkeleton />}
        {vehicles && vehicles.length === 0 && (
          <p className="rounded-xl bg-white p-10 text-center text-brand-ink/70 shadow-sm ring-1 ring-brand-ink/5">
            Ingen solgte biler at vise endnu.
          </p>
        )}
        {vehicles && vehicles.length > 0 && <VehicleGrid vehicles={vehicles} />}
      </div>
    </div>
  );
}
