import type { TourSeenStore } from "./types";

const STORAGE_KEY = "hub-kit.tour.seen";

type StoredEntry = { id: string; version: number };

function readEntries(): StoredEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap((entry) => {
      if (typeof entry === "string") {
        return [{ id: entry, version: 1 }];
      }
      if (entry && typeof entry === "object" && "id" in entry) {
        const record = entry as { id?: unknown; version?: unknown };
        if (typeof record.id === "string") {
          return [{ id: record.id, version: Number(record.version) || 1 }];
        }
      }
      return [];
    });
  } catch {
    return [];
  }
}

export function hasSeenTour(tourId: string, version = 1): boolean {
  return readEntries().some((entry) => entry.id === tourId && entry.version >= version);
}

export function markTourSeen(tourId: string, version = 1): void {
  const entries = readEntries().filter((entry) => entry.id !== tourId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...entries, { id: tourId, version }]));
  } catch {
    return;
  }
}

export const localTourSeenStore: TourSeenStore = {
  isReady: true,
  hasSeen: hasSeenTour,
  markSeen: (tourId, version) => markTourSeen(tourId, version),
};

export function resetSeenTours(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}
