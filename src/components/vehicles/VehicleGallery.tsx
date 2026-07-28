import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import type { VehicleImage } from "@/features/vehicles/types";
import { cn } from "@/lib/utils";

/** Billedgalleri med swipe (touch), tastaturnavigation, thumbnails og lightbox. */
export function VehicleGallery({ images, title }: { images: VehicleImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, prev, next]);

  if (!images.length) {
    return <div className="skeleton aspect-[8/5] w-full" aria-hidden />;
  }

  const current = images[index];

  const touchHandlers = {
    onTouchStart: (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX),
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 48) (dx > 0 ? prev : next)();
      setTouchStartX(null);
    },
  };

  return (
    <figure aria-label={`Billedgalleri: ${title}`}>
      <div className="group relative overflow-hidden rounded-xl bg-brand-ink/5" {...touchHandlers}>
        <img
          key={current.id}
          src={current.url}
          alt={current.altText}
          width={800}
          height={500}
          decoding="async"
          fetchPriority={index === 0 ? "high" : undefined}
          loading={index === 0 ? undefined : "lazy"}
          className="aspect-[8/5] w-full animate-image-reveal object-cover"
        />
        {images.length > 1 && (
          <>
            <button type="button" onClick={prev} aria-label="Forrige billede"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 shadow transition-opacity hover:bg-white lg:opacity-0 lg:group-hover:opacity-100">
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" onClick={next} aria-label="Næste billede"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 shadow transition-opacity hover:bg-white lg:opacity-0 lg:group-hover:opacity-100">
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </>
        )}
        <button type="button" onClick={() => setLightbox(true)} aria-label="Åbn billede i fuld størrelse"
          className="absolute bottom-3 right-3 rounded-full bg-white/85 p-2 shadow hover:bg-white">
          <Expand className="h-4 w-4" aria-hidden />
        </button>
        <p className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white">
          {index + 1} / {images.length}
        </p>
      </div>

      {images.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Billedminiaturer">
          {images.map((img, i) => (
            <li key={img.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Vis billede ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "block h-16 w-24 overflow-hidden rounded-md ring-2 transition-all",
                  i === index ? "ring-brand-accent" : "ring-transparent opacity-70 hover:opacity-100"
                )}
              >
                <img src={img.url} alt="" width={96} height={64} loading="lazy" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {lightbox && (
        <div role="dialog" aria-modal="true" aria-label={`Billede i fuld størrelse: ${current.altText}`}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4" {...touchHandlers}>
          <button type="button" onClick={() => setLightbox(false)} aria-label="Luk"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" autoFocus>
            <X className="h-6 w-6" aria-hidden />
          </button>
          {images.length > 1 && (
            <>
              <button type="button" onClick={prev} aria-label="Forrige billede"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
                <ChevronLeft className="h-6 w-6" aria-hidden />
              </button>
              <button type="button" onClick={next} aria-label="Næste billede"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
                <ChevronRight className="h-6 w-6" aria-hidden />
              </button>
            </>
          )}
          <img src={current.url} alt={current.altText} className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </figure>
  );
}
