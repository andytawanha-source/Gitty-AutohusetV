import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  Solgt: "bg-brand-ink text-white",
  Reserveret: "bg-amber-600 text-white",
  Nyhed: "bg-brand-accent text-brand-primary",
  Populær: "bg-brand-gradient text-white",
  Elbil: "bg-emerald-600 text-white",
};

export function VehicleBadge({ label }: { label: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm",
        STYLES[label] ?? "bg-brand-secondary text-white"
      )}
    >
      {label}
    </span>
  );
}
