import type { Vehicle } from "@/features/vehicles/types";
import { VehicleCard } from "./VehicleCard";

export function VehicleGrid({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list">
      {vehicles.map((v, i) => (
        <li key={v.id} className="animate-fade-up h-full" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
          <VehicleCard vehicle={v} />
        </li>
      ))}
    </ul>
  );
}

export function VehicleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-brand-ink/5">
          <div className="skeleton aspect-[8/5] rounded-none" />
          <div className="space-y-3 p-4">
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-6 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
