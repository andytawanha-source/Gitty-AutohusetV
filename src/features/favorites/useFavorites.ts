import { useCallback, useSyncExternalStore } from "react";

/**
 * Favoritter for anonyme besøgende gemmes i localStorage (nøgle pr. brand).
 * Indloggede brugere kan senere synkroniseres til favorites-tabellen.
 */

const STORAGE_KEY = "autohuset:favorites";
const EMPTY: string[] = [];
const listeners = new Set<() => void>();
let cache: string[] | null = null;

function read(): string[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[];
  } catch {
    cache = [];
  }
  return cache;
}

function write(ids: string[]) {
  cache = ids;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage kan være utilgængelig (private mode) – favoritter er ikke kritiske
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, read, () => EMPTY);

  const toggle = useCallback((vehicleId: string) => {
    const current = read();
    write(
      current.includes(vehicleId) ? current.filter((id) => id !== vehicleId) : [...current, vehicleId]
    );
  }, []);

  const isFavorite = useCallback((vehicleId: string) => favorites.includes(vehicleId), [favorites]);

  return { favorites, toggle, isFavorite };
}
