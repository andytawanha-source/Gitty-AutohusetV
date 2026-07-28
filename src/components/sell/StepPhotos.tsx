import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, GripVertical, Loader2, Trash2 } from "lucide-react";
import { PHOTO_CATEGORIES, type LeadPhoto } from "@/features/leads/schema";
import { compressImage, validateImageFile } from "@/features/leads/imageCompression";
import { cn } from "@/lib/utils";

const MAX_PHOTOS = 12;

export function StepPhotos({
  photos,
  onChange,
  onNext,
  onBack,
}: {
  photos: LeadPhoto[];
  onChange: (photos: LeadPhoto[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeCategory, setActiveCategory] = useState<LeadPhoto["category"]>("front");
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = async (files: FileList | File[]) => {
    setError(null);
    const list = Array.from(files);
    if (photos.length + list.length > MAX_PHOTOS) {
      setError(`Du kan højst uploade ${MAX_PHOTOS} billeder.`);
      return;
    }
    for (const file of list) {
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    setProcessing(true);
    try {
      const newPhotos: LeadPhoto[] = [];
      for (const file of list) {
        const compressed = await compressImage(file);
        newPhotos.push({
          id: crypto.randomUUID(),
          file: compressed,
          previewUrl: URL.createObjectURL(compressed),
          category: activeCategory,
        });
      }
      onChange([...photos, ...newPhotos]);
    } finally {
      setProcessing(false);
    }
  };

  const remove = (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (photo) URL.revokeObjectURL(photo.previewUrl);
    onChange(photos.filter((p) => p.id !== id));
  };

  const move = (index: number, direction: -1 | 1) => {
    const next = [...photos];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-brand-primary">Billeder af bilen</h2>
        <p className="mt-1 text-sm text-brand-ink/70">
          Billeder gør vurderingen hurtigere og mere præcis. Du kan tage billeder direkte med din mobil.
          Billederne behandles fortroligt og vises aldrig offentligt.
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Hvad viser billedet, du uploader?</legend>
        <div className="flex flex-wrap gap-2">
          {PHOTO_CATEGORIES.map((cat) => (
            <label
              key={cat.key}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors",
                activeCategory === cat.key
                  ? "border-brand-primary bg-brand-gradient text-white"
                  : "border-brand-ink/15 bg-white hover:border-brand-primary/50"
              )}
            >
              <input
                type="radio"
                name="photo-category"
                className="sr-only"
                checked={activeCategory === cat.key}
                onChange={() => setActiveCategory(cat.key)}
              />
              {cat.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload billeder – klik eller træk filer hertil"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          dragOver ? "border-brand-accent bg-brand-accent/10" : "border-brand-ink/20 bg-white hover:border-brand-accent"
        )}
      >
        {processing ? (
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" aria-hidden />
        ) : (
          <Camera className="h-8 w-8 text-brand-ink/40" aria-hidden />
        )}
        <p className="text-sm font-medium">{processing ? "Komprimerer billeder…" : "Klik for at vælge billeder, eller træk dem hertil"}</p>
        <p className="text-xs text-brand-ink/50">JPEG, PNG, WebP eller HEIC · maks. 10 MB pr. billede</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          capture="environment"
          multiple
          className="sr-only"
          onChange={(e) => e.target.files && void addFiles(e.target.files)}
        />
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}

      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" role="list" aria-label="Uploadede billeder">
          {photos.map((photo, i) => (
            <li key={photo.id} className="group relative overflow-hidden rounded-lg ring-1 ring-brand-ink/10">
              <img src={photo.previewUrl} alt={PHOTO_CATEGORIES.find((c) => c.key === photo.category)?.label ?? "Billede"} className="aspect-[4/3] w-full object-cover" />
              <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                {PHOTO_CATEGORIES.find((c) => c.key === photo.category)?.label}
              </span>
              <div className="absolute bottom-1.5 right-1.5 flex gap-1">
                <button type="button" onClick={() => move(i, -1)} aria-label="Flyt billede frem" disabled={i === 0}
                  className="rounded bg-white/90 p-1.5 shadow disabled:opacity-40">
                  <GripVertical className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button type="button" onClick={() => remove(photo.id)} aria-label="Fjern billede"
                  className="rounded bg-white/90 p-1.5 text-red-600 shadow hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-brand-ink/60 hover:text-brand-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Tilbage
        </button>
        <button type="button" onClick={onNext}
          className="inline-flex items-center gap-2 rounded-md bg-brand-gradient px-5 py-3 font-semibold text-white hover:opacity-90">
          {photos.length === 0 ? "Fortsæt uden billeder" : "Fortsæt"} <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
