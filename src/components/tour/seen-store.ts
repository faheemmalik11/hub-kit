const STORAGE_KEY = "hub-kit.tour.seen";

function readSeenIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function hasSeenTour(tourId: string): boolean {
  return readSeenIds().includes(tourId);
}

export function markTourSeen(tourId: string): void {
  const ids = readSeenIds();
  if (ids.includes(tourId)) {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, tourId]));
  } catch {
    return;
  }
}

export function resetSeenTours(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}
