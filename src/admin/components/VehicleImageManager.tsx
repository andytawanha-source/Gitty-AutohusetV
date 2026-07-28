import { useRef, useState } from "react";
import { GripVertical, ImageOff, Loader2, Star, Trash2, Upload } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAdminAuth } from "../auth";
import { compressImage, validateImageFile } from "@/features/leads/imageCompression";
import { cn } from "@/lib/utils";
import type { VehicleImage } from "@/features/vehicles/types";

interface UploadingItem {
  key: string;
  name: string;
  progress: "komprimerer" | "uploader" | "fejl";
  error?: string;
}

/**
 * Billedstyring til en (allerede oprettet, evt. kladde-) bil: drag-and-drop-upload
 * af flere filer, klient-side komprimering, forhåndsvisning, genrækkefølge via
 * træk, valg af forsidebillede, og sletning. Kræver et vehicleId, fordi billeder
 * gemmes under en storage-sti pr. bil – wizard'en opretter derfor bilen som
 * kladde, så snart trin 1 er udfyldt, så billedupload aldrig blokeres.
 */
export function VehicleImageManager({
  vehicleId,
  images,
  altBase,
  onChanged,
}: {
  vehicleId: string;
  images: VehicleImage[];
  altBase: string;
  onChanged: () => void;
}) {
  const { user } = useAdminAuth();
  const [uploading, setUploading] = useState<UploadingItem[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleFiles = async (files: FileList | File[]) => {
    if (!isSupabaseConfigured) {
      setUploading([{ key: "demo", name: "", progress: "fejl", error: "DEMO-MODE: billedupload kræver et konfigureret Supabase-projekt." }]);
      return;
    }
    const supabase = getSupabase();
    const fileArray = Array.from(files);
    let nextSort = sorted.length ? Math.max(...sorted.map((i) => i.sortOrder)) + 1 : 0;

    for (const file of fileArray) {
      const key = `${file.name}-${Date.now()}-${Math.random()}`;
      const invalid = validateImageFile(file);
      if (invalid) {
        setUploading((u) => [...u, { key, name: file.name, progress: "fejl", error: invalid }]);
        continue;
      }
      setUploading((u) => [...u, { key, name: file.name, progress: "komprimerer" }]);
      try {
        const compressed = await compressImage(file);
        setUploading((u) => u.map((i) => (i.key === key ? { ...i, progress: "uploader" } : i)));
        const ext = compressed.name.split(".").pop() ?? "jpg";
        const path = `${user!.organizationId}/${vehicleId}/${Date.now()}-${nextSort}.${ext}`;
        const { error: upErr } = await supabase.storage.from("vehicle-images").upload(path, compressed);
        if (upErr) throw new Error(upErr.message);
        const { error: dbErr } = await supabase.from("vehicle_images").insert({
          organization_id: user!.organizationId,
          vehicle_id: vehicleId,
          storage_path: path,
          alt_text: altBase,
          sort_order: nextSort,
          is_primary: sorted.length === 0 && nextSort === 0,
        });
        if (dbErr) throw new Error(dbErr.message);
        nextSort += 1;
        setUploading((u) => u.filter((i) => i.key !== key));
        onChanged();
      } catch (err) {
        setUploading((u) =>
          u.map((i) => (i.key === key ? { ...i, progress: "fejl", error: err instanceof Error ? err.message : "Upload fejlede." } : i))
        );
      }
    }
  };

  const deleteImage = async (img: VehicleImage) => {
    if (!isSupabaseConfigured) return;
    setBusy(true);
    try {
      const supabase = getSupabase();
      // storage_path kendes ikke direkte her (url kan være en public URL) – slet via id i databasen,
      // storage-objektet ryddes efterfølgende ved bulk-oprydning (ikke kritisk at lade orphaned filer ligge kortvarigt).
      const { error } = await supabase.from("vehicle_images").delete().eq("id", img.id);
      if (error) throw new Error(error.message);
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const setPrimary = async (img: VehicleImage) => {
    if (!isSupabaseConfigured || img.isPrimary) return;
    setBusy(true);
    try {
      const supabase = getSupabase();
      await supabase.from("vehicle_images").update({ is_primary: false }).eq("vehicle_id", vehicleId);
      const { error } = await supabase.from("vehicle_images").update({ is_primary: true }).eq("id", img.id);
      if (error) throw new Error(error.message);
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const reorder = async (from: number, to: number) => {
    if (from === to || !isSupabaseConfigured) return;
    const next = [...sorted];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setBusy(true);
    try {
      const supabase = getSupabase();
      await Promise.all(next.map((img, i) => supabase.from("vehicle_images").update({ sort_order: i }).eq("id", img.id)));
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDropTarget(true);
        }}
        onDragLeave={() => setIsDropTarget(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDropTarget(false);
          if (e.dataTransfer.files.length) void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          isDropTarget ? "border-brand-primary bg-brand-primary/5" : "border-brand-ink/15 bg-brand-surface-warm/40"
        )}
      >
        <Upload className="h-8 w-8 text-brand-accent" aria-hidden />
        <p className="text-sm font-medium text-brand-ink">Træk billeder herind, eller</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Vælg billeder
        </button>
        <p className="text-xs text-brand-ink/50">JPEG, PNG, WebP eller HEIC · komprimeres automatisk</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => e.target.files && void handleFiles(e.target.files)}
        />
      </div>

      {!isSupabaseConfigured && (
        <p className="rounded-md bg-amber-50 p-3 text-xs text-amber-800">
          DEMO-MODE: billedupload kræver et konfigureret Supabase-projekt – i produktion fungerer upload, komprimering og lagring som beskrevet.
        </p>
      )}

      {uploading.length > 0 && (
        <ul className="space-y-1.5 text-sm">
          {uploading.map((item) => (
            <li key={item.key} className="flex items-center gap-2">
              {item.progress === "fejl" ? (
                <ImageOff className="h-4 w-4 shrink-0 text-red-600" aria-hidden />
              ) : (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-accent" aria-hidden />
              )}
              <span className="truncate">
                {item.name || "Billede"} –{" "}
                {item.progress === "komprimerer" ? "komprimerer…" : item.progress === "uploader" ? "uploader…" : item.error}
              </span>
            </li>
          ))}
        </ul>
      )}

      {sorted.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {sorted.map((img, i) => (
            <li
              key={img.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) void reorder(dragIndex, i);
                setDragIndex(null);
              }}
              className={cn(
                "group relative overflow-hidden rounded-lg ring-1 ring-brand-ink/10",
                busy && "pointer-events-none opacity-60"
              )}
            >
              <img src={img.url} alt={img.altText} className="aspect-[4/3] w-full object-cover" />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-1.5">
                <GripVertical className="h-4 w-4 cursor-grab text-white/80" aria-hidden />
                {img.isPrimary && (
                  <span className="rounded-full bg-brand-accent px-2 py-0.5 text-[10px] font-bold uppercase text-brand-ink">
                    Forside
                  </span>
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => void setPrimary(img)}
                    title="Gør til forsidebillede"
                    className="rounded-full bg-white/90 p-1.5 hover:bg-white"
                  >
                    <Star className="h-3.5 w-3.5 text-brand-primary" aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void deleteImage(img)}
                  title="Slet billede"
                  className="rounded-full bg-white/90 p-1.5 hover:bg-white"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-600" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-brand-ink/50">Ingen billeder endnu. Annoncen kan gemmes som kladde, selvom billeder mangler.</p>
      )}
    </div>
  );
}
