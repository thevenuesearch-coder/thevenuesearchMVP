/*
 * ============================================================
 * COMPARE SELECTION
 * ============================================================
 *
 * Lightweight, client-only "shortlist for comparison" -- up to
 * two venues at a time, stored in localStorage rather than a new
 * Supabase table. Unlike the wishlist (which is tied to a signed-in
 * user and needs auth), comparison is meant to work instantly for
 * anyone browsing, logged in or not, so localStorage is the right
 * tool here rather than another RLS-guarded table.
 *
 * A custom 'tvs-compare-change' event is dispatched on every write
 * so every mounted toggle button / the floating compare bar can
 * react immediately, in the same tab (the native `storage` event
 * only fires in *other* tabs).
 */

const STORAGE_KEY = 'tvs_compare_v1';
export const MAX_COMPARE = 2;

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
      .filter(
        (entry): entry is CompareEntry =>
          entry && typeof entry.id === 'string'
      )
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

/**
 * Adds or removes a venue from the comparison shortlist.
 * If two are already selected and a third is added, the oldest
 * selection is dropped in its favour -- comparison is always
 * exactly "the last two you picked", never a silent no-op.
 */
export function toggleCompare(entry: CompareEntry): CompareEntry[] {
  const current = readList();
  const exists = current.some((item) => item.id === entry.id);

  const next = exists
    ? current.filter((item) => item.id !== entry.id)
    : [...current, entry].slice(-MAX_COMPARE);

  writeList(next);
  return next;
}

export function removeFromCompare(id: string): CompareEntry[] {
  const next = readList().filter((item) => item.id !== id);
  writeList(next);
  return next;
}

export function clearCompare() {
  writeList([]);
}
