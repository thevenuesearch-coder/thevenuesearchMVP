/*
 * ============================================================
 * COMPARE SELECTION (v2 — up to 4 venues)
 * ============================================================
 *
 * Client-only shortlist, stored in localStorage rather than a new
 * Supabase table -- works instantly whether or not someone's
 * signed in, and survives navigating away to Explore and back.
 *
 * A custom 'tvs-compare-change' event fires on every write so any
 * mounted toggle button / the floating tray reacts immediately in
 * the same tab (the native `storage` event only fires cross-tab).
 */

const STORAGE_KEY = 'tvs_compare_v2';
export const MAX_COMPARE = 4;
export const MIN_COMPARE = 2;

export type CompareEntry = {
  id: string; // venue slug -- matches /venues/[id] and fetchVenueBySlug
  name: string;
  image: string;
  city: string;
};

function readList(): CompareEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((entry): entry is CompareEntry => entry && typeof entry.id === 'string')
      .slice(0, MAX_COMPARE);
  } catch {
    return [];
  }
}

function writeList(entries: CompareEntry[]) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event('tvs-compare-change'));
}

export function getCompareList(): CompareEntry[] {
  return readList();
}

export function isInCompare(id: string): boolean {
  return readList().some((entry) => entry.id === id);
}

export type ToggleResult = {
  entries: CompareEntry[];
  /** false only when the shortlist was already full and this was
   *  an attempt to add a 5th venue -- nothing changed. */
  applied: boolean;
};

/**
 * Adds or removes a venue from the comparison shortlist. Unlike
 * the earlier 2-slot version, this does NOT silently evict the
 * oldest pick once full -- comparing up to 4 is a deliberate
 * choice, so at capacity the caller is told nothing happened and
 * can prompt the person to remove one first.
 */
export function toggleCompare(entry: CompareEntry): ToggleResult {
  const current = readList();
  const exists = current.some((item) => item.id === entry.id);

  if (exists) {
    const next = current.filter((item) => item.id !== entry.id);
    writeList(next);
    return { entries: next, applied: true };
  }

  if (current.length >= MAX_COMPARE) {
    return { entries: current, applied: false };
  }

  const next = [...current, entry];
  writeList(next);
  return { entries: next, applied: true };
}

export function removeFromCompare(id: string): CompareEntry[] {
  const next = readList().filter((item) => item.id !== id);
  writeList(next);
  return next;
}

export function setCompareList(entries: CompareEntry[]): CompareEntry[] {
  const next = entries.slice(0, MAX_COMPARE);
  writeList(next);
  return next;
}

export function clearCompare() {
  writeList([]);
}
