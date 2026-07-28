import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { EQUIPMENT_CATALOG } from "@/features/equipment/catalog";
import { cn } from "@/lib/utils";

/**
 * Ekstraudstyr som en søgbar, kategoriseret liste i stedet for fritekst.
 * Admin kan vælge fra kataloget, tilføje eget udstyr, indsætte flere linjer
 * på én gang, og fjerne valgte punkter igen. Værdien er fortsat en almindelig
 * string[], så den passer direkte til vehicles.equipment.
 */
export function EquipmentPicker({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [query, setQuery] = useState("");
  const [customText, setCustomText] = useState("");

  const selectedSet = useMemo(() => new Set(value), [value]);

  const filteredCatalog = useMemo(() => {
    if (!query.trim()) return EQUIPMENT_CATALOG;
    const q = query.toLowerCase();
    return EQUIPMENT_CATALOG.map((cat) => ({ ...cat, items: cat.items.filter((item) => item.toLowerCase().includes(q)) })).filter(
      (cat) => cat.items.length > 0
    );
  }, [query]);

  const toggle = (item: string) => {
    onChange(selectedSet.has(item) ? value.filter((v) => v !== item) : [...value, item]);
  };

  const addCustomLines = () => {
    const lines = customText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return;
    const merged = [...value];
    for (const line of lines) if (!merged.includes(line)) merged.push(line);
    onChange(merged);
    setCustomText("");
  };

  return (
    <div className="space-y-4">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((item) => (
            <li key={item} className="flex items-center gap-1.5 rounded-full bg-brand-primary/10 py-1 pl-3 pr-1.5 text-sm text-brand-primary">
              {item}
              <button type="button" onClick={() => toggle(item)} aria-label={`Fjern ${item}`} className="rounded-full p-0.5 hover:bg-brand-primary/20">
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Søg ekstraudstyr…"
        className="w-full rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm"
      />

      <div className="max-h-64 space-y-3 overflow-y-auto rounded-md border border-brand-ink/10 p-3">
        {filteredCatalog.map((cat) => (
          <div key={cat.key}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-brand-ink/40">{cat.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {cat.items.map((item) => {
                const active = selectedSet.has(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggle(item)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition-colors",
                      active ? "border-brand-primary bg-brand-primary text-white" : "border-brand-ink/15 bg-white hover:border-brand-primary/40"
                    )}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {filteredCatalog.length === 0 && <p className="text-sm text-brand-ink/50">Intet udstyr matcher "{query}".</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Tilføj eget udstyr (ét punkt pr. linje)</label>
        <div className="flex gap-2">
          <textarea
            rows={2}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder={"fx Vinterhjul inkluderet\nServiceaftale 3 år"}
            className="w-full rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addCustomLines}
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm hover:bg-brand-ink/5"
          >
            <Plus className="h-4 w-4" aria-hidden /> Tilføj
          </button>
        </div>
      </div>
    </div>
  );
}
