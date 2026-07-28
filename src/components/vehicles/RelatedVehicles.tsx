import { useInventory } from "@/features/vehicles/api";
import type { Vehicle } from "@/features/vehicles/types";
import { VehicleGrid } from "./VehicleGrid";

/** Relaterede biler: samme biltype eller drivmiddel, tættest på prisen. */
export function RelatedVehicles({ current }: { current: Vehicle }) {
  const { data } = useInventory();
  if (!data) return null;

  const related = data
    .filter((v) => v.id !== current.id && (v.status === "published" || v.status === "reserved"))
    .sort((a, b) => {
      const score = (v: Vehicle) =>
        (v.bodyType === current.bodyType ? 2 : 0) +
        (v.fuelType === current.fuelType ? 1 : 0) -
        Math.abs((v.priceDkk ?? 0) - (current.priceDkk ?? 0)) / 1_000_000;
      return score(b) - score(a);
    })
    .slice(0, 3);

  if (!related.length) return null;

  return (
    <section className="border-t border-brand-ink/5 bg-brand-surface-warm/30 py-12" aria-labelledby="related-heading">
      <div className="container">
        <h2 id="related-heading" className="mb-6 font-display text-2xl font-bold text-brand-primary">
          Du vil måske også synes om
        </h2>
        <VehicleGrid vehicles={related} />
      </div>
    </section>
  );
}
