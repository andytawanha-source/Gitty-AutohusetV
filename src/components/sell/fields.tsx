import { cn } from "@/lib/utils";

export const inputCls =
  "w-full rounded-md border border-brand-ink/15 bg-white px-3 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-brand-accent";

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm text-red-700">
      {message}
    </p>
  );
}

interface RadioOption {
  value: string;
  label: string;
}

/** Tilgængelig "pill"-radiogruppe til korte valg. */
export function RadioPills({
  legend,
  options,
  value,
  onChange,
  error,
  name,
}: {
  legend: string;
  options: RadioOption[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  name: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              "cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              value === opt.value
                ? "border-brand-primary bg-brand-gradient text-white"
                : "border-brand-ink/15 bg-white hover:border-brand-primary/50"
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        ))}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-700">{error}</p>}
    </fieldset>
  );
}
