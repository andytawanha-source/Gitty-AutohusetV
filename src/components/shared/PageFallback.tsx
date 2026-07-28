export function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Indlæser side">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      <span className="sr-only">Indlæser…</span>
    </div>
  );
}
