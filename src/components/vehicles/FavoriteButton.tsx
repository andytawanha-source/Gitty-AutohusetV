import { Heart } from "lucide-react";
import { useFavorites } from "@/features/favorites/useFavorites";
import { track } from "@/features/tracking/track";
import { cn } from "@/lib/utils";

export function FavoriteButton({ vehicleId, className }: { vehicleId: string; className?: string }) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(vehicleId);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? "Fjern fra favoritter" : "Gem som favorit"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(vehicleId);
        if (!active) track("favorite_vehicle", { vehicle_id: vehicleId });
      }}
      className={cn(
        "rounded-full bg-white/90 p-2 shadow-sm transition-transform hover:scale-110 motion-reduce:transform-none",
        className
      )}
    >
      <Heart
        aria-hidden
        className={cn(
          "h-5 w-5 transition-colors",
          active ? "animate-pop-in fill-red-500 stroke-red-500" : "stroke-brand-ink/60"
        )}
      />
    </button>
  );
}
