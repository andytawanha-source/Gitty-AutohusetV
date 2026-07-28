import { Link } from "react-router-dom";
import { Fuel, Gauge, Calendar, Settings2 } from "lucide-react";
import type { Vehicle } from "@/features/vehicles/types";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/features/vehicles/types";
import { formatMileage, formatMonthlyPrice, formatPrice } from "@/lib/format";
import { VehicleBadge } from "./VehicleBadge";
import { FavoriteButton } from "./FavoriteButton";
import { cn } from "@/lib/utils";

/**
 * Fuldt klikbart bilkort uden at kompromittere tilgængeligheden:
 * Ét <Link> med udvidet klikflade (pseudo-overlay), favoritknappen ligger ovenpå.
 */
export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const primary = vehicle.images.find((i) => i.isPrimary) ?? vehicle.images[0];
  const isSold = vehicle.status === "sold";
  const isReserved = vehicle.status === "reserved";
  const title = [vehicle.make, vehicle.model, vehicle.variant].filter(Boolean).join(" ");

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-brand-ink/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg motion-reduce:transform-none",
        isSold && "opacity-80"
      )}
    >
      <div className="relative aspect-[8/5] overflow-hidden bg-brand-ink/5">
        {primary && (
          <img
            src={primary.url}
            alt={primary.altText}
            width={800}
            height={500}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transform-none"
          />
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {isSold && <VehicleBadge label="Solgt" />}
          {isReserved && <VehicleBadge label="Reserveret" />}
          {!isSold && !isReserved && vehicle.badges.map((b) => <VehicleBadge key={b} label={b} />)}
        </div>
        <FavoriteButton vehicleId={vehicle.id} className="absolute right-3 top-3 z-10" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-[2.75rem] font-display text-lg font-semibold leading-snug text-brand-ink">
          <Link
            to={`/biler/${vehicle.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {title}
          </Link>
        </h3>

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-brand-ink/70">
          {vehicle.modelYear && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <dt className="sr-only">Modelår</dt>
              <dd>{vehicle.modelYear}</dd>
            </div>
          )}
          {vehicle.mileageKm !== null && (
            <div className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <dt className="sr-only">Kilometerstand</dt>
              <dd>{formatMileage(vehicle.mileageKm)}</dd>
            </div>
          )}
          {vehicle.fuelType && (
            <div className="flex items-center gap-1.5">
              <Fuel className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <dt className="sr-only">Drivmiddel</dt>
              <dd>{FUEL_LABELS[vehicle.fuelType]}</dd>
            </div>
          )}
          {vehicle.transmission && (
            <div className="flex items-center gap-1.5">
              <Settings2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <dt className="sr-only">Gearkasse</dt>
              <dd>{TRANSMISSION_LABELS[vehicle.transmission]}</dd>
            </div>
          )}
        </dl>

        <div className="mt-auto flex items-end justify-between border-t border-brand-ink/10 pt-3">
          <div>
            {vehicle.priceDkk !== null && (
              <p className="font-display text-xl font-bold text-brand-primary">
                {isSold ? "Solgt" : formatPrice(vehicle.priceDkk)}
              </p>
            )}
            {!isSold && vehicle.monthlyPriceDkk !== null && (
              <p className="text-xs text-brand-ink/60">
                Fra {formatMonthlyPrice(vehicle.monthlyPriceDkk)}*
              </p>
            )}
          </div>
          <span
            aria-hidden
            className="rounded-md bg-brand-primary/5 px-3 py-1.5 text-sm font-medium text-brand-primary transition-colors group-hover:bg-brand-gradient group-hover:text-white"
          >
            Se bilen
          </span>
        </div>
      </div>
    </article>
  );
}
