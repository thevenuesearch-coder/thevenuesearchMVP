import type { Venue } from '../data';
import { formatGuests, toCapacity } from '../capacity';
import { cleanString, spaceNamesByKind } from './build';
import type { CompareCell, CompareModel, CompareVariant } from './types';

/*
 * View-model for the premium /compare experience.
 *
 * Everything here is derived from the SAME verified comparison model the
 * venue-page widget uses, plus fields already on each venue record
 * (description, spaces, capacity). Nothing is invented: a missing value is
 * null and is shown as "Not listed" -- never as "No" and never as a ranking.
 */

export type ExpVenue = {
  id: string;
  name: string;
  location: string;
  type: string | null;
  image: string | null;
  rating: string | null;
  description: string | null;
  capacityLabel: string | null;
  spaceCount: number;
};

export type DiffStatus = 'same' | 'differs' | 'partial';

export type ExpRow = {
  key: string;
  label: string;
  variant: CompareVariant;
  cells: CompareCell[];
  status: DiffStatus;
};

export type ExpGroup = {
  key: string;
  label: string;
  rows: ExpRow[];
};

export type ExpInsight = {
  title: string;
  text: string;
  venueIds: string[];
};

export type Experience = {
  venues: ExpVenue[];
  groups: ExpGroup[];
  insights: ExpInsight[];
};

/* Which comparison-model rows land in which of the six requested groups. */
const GROUP_OF: Record<string, string> = {
  type: 'overview',
  location: 'location',
  capacity: 'capacity',
  rooms: 'accommodation',
  spaces: 'spaces',
  indoor: 'spaces',
  outdoor: 'spaces',
  'group:amenities': 'facilities',
  'group:wedding': 'facilities',
  'group:services': 'facilities',
};

const GROUP_LABELS: Array<[string, string]> = [
  ['overview', 'Property Overview'],
  ['spaces', 'Wedding Venue Spaces'],
  ['capacity', 'Guest Capacity'],
  ['accommodation', 'Accommodation'],
  ['facilities', 'Facilities & Amenities'],
  ['location', 'Location & Accessibility'],
];

function norm(cell: CompareCell): string | null {
  if (cell === null) return null;
  if (cell === true) return 'true';
  if (Array.isArray(cell)) {
    return cell.map((c) => c.trim().toLowerCase()).sort().join('|');
  }
  return cell.trim().toLowerCase();
}

/*
 * A row "differs" only when venues that HAVE a value disagree. A blank cell
 * never counts as a difference: it means "not listed", not "not available".
 */
function statusOf(cells: CompareCell[]): DiffStatus {
  const values = cells.map(norm).filter((v): v is string => v !== null);
  if (values.length < 2) return 'partial';
  return new Set(values).size > 1 ? 'differs' : 'same';
}

function namesOf(venues: ExpVenue[], ids: string[]): string {
  const names = venues.filter((v) => ids.includes(v.id)).map((v) => v.name);
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/* Winners of a numeric measure; only when at least two venues have a value and they differ. */
function leaders(
  items: Array<{ id: string; value: number | null }>
): { ids: string[]; value: number } | null {
  const have = items.filter((i): i is { id: string; value: number } => i.value !== null);
  if (have.length < 2) return null;
  const max = Math.max(...have.map((i) => i.value));
  if (have.every((i) => i.value === max)) return null;
  return { ids: have.filter((i) => i.value === max).map((i) => i.id), value: max };
}

export function buildExperience(selected: Venue[], model: CompareModel): Experience {
  const modelById = new Map(model.venues.map((v) => [v.id, v]));
  const capacityRow = model.rows.find((r) => r.key === 'capacity');

  const venues: ExpVenue[] = selected.map((venue, index) => {
    const mv = modelById.get(venue.id);
    const cap = capacityRow?.cells[index];
    return {
      id: venue.id,
      name: mv?.name || venue.name,
      location: mv?.location || venue.city || venue.destination || '',
      type: cleanString(venue.type),
      image: mv?.image ?? cleanString(venue.image),
      rating: mv?.rating ?? null,
      description: cleanString(venue.desc),
      capacityLabel: typeof cap === 'string' ? cap : null,
      spaceCount: (venue.venueSpaces ?? []).filter((s) => cleanString(s.name)).length,
    };
  });

  const buckets = new Map<string, Array<Omit<ExpRow, 'status'>>>();
  const push = (group: string, row: Omit<ExpRow, 'status'>) => {
    const list = buckets.get(group) ?? [];
    list.push(row);
    buckets.set(group, list);
  };

  /* Overview: the description comes straight from the venue record. */
  const descCells = selected.map((v) => cleanString(v.desc));
  if (descCells.some(Boolean)) {
    push('overview', { key: 'description', label: 'About', variant: 'text', cells: descCells });
  }

  for (const row of model.rows) {
    const group = GROUP_OF[row.key] ?? (row.key.startsWith('feature:') ? 'facilities' : null);
    if (group) push(group, { key: row.key, label: row.label, variant: row.variant, cells: row.cells });
  }

  /* Spaces: how many are listed (a plain count of real records). */
  const countCells: CompareCell[] = venues.map((v) => (v.spaceCount > 0 ? String(v.spaceCount) : null));
  if (countCells.some(Boolean)) {
    push('spaces', { key: 'space-count', label: 'Event Spaces Listed', variant: 'stat', cells: countCells });
  }

  /* Capacity: the largest single space, when spaces carry a stated capacity. */
  const largestCells: CompareCell[] = selected.map((v) => {
    const best = (v.venueSpaces ?? [])
      .map((s) => ({ name: cleanString(s.name), cap: toCapacity(s.capacity) }))
      .filter((s): s is { name: string; cap: number } => Boolean(s.name) && s.cap !== null)
      .sort((a, b) => b.cap - a.cap)[0];
    return best ? `${best.name} · up to ${formatGuests(best.cap)}` : null;
  });
  if (largestCells.some(Boolean)) {
    push('capacity', { key: 'largest-space', label: 'Largest Listed Space', variant: 'lines', cells: largestCells.map((c) => (typeof c === 'string' ? [c] : null)) });
  }

  /* Location: state and country come from the venue record. */
  const regionCells: CompareCell[] = selected.map((v) => {
    const parts = [cleanString(v.state), cleanString(v.country)].filter(Boolean) as string[];
    return parts.length ? parts.join(', ') : null;
  });
  if (regionCells.some(Boolean)) {
    push('location', { key: 'region', label: 'State & Country', variant: 'text', cells: regionCells });
  }

  const groups: ExpGroup[] = GROUP_LABELS.flatMap(([key, label]) => {
    /* Free-text descriptions always differ, so they are never flagged or hidden as a "difference". */
    const rows = (buckets.get(key) ?? []).map((r) => ({
      ...r,
      status: r.key === 'description' ? ('partial' as DiffStatus) : statusOf(r.cells),
    }));
    return rows.length ? [{ key, label, rows }] : [];
  });

  /* ---- Summary: calculated only from the figures above ---- */
  const insights: ExpInsight[] = [];
  if (selected.length >= 2) {
    const cap = leaders(selected.map((v) => ({ id: v.id, value: toCapacity(v.capacity) })));
    if (cap) {
      insights.push({
        title: 'Largest stated capacity',
        text: `${namesOf(venues, cap.ids)} ${cap.ids.length > 1 ? 'list' : 'lists'} the highest guest capacity here, up to ${formatGuests(cap.value)}.`,
        venueIds: cap.ids,
      });
    }

    const spaces = leaders(venues.map((v) => ({ id: v.id, value: v.spaceCount > 0 ? v.spaceCount : null })));
    if (spaces) {
      insights.push({
        title: 'Most event spaces listed',
        text: `${namesOf(venues, spaces.ids)} ${spaces.ids.length > 1 ? 'each list' : 'lists'} ${spaces.value} event spaces.`,
        venueIds: spaces.ids,
      });
    }

    const outdoor = leaders(selected.map((v) => {
      const n = spaceNamesByKind(v, 'outdoor').length;
      return { id: v.id, value: n > 0 ? n : null };
    }));
    if (outdoor) {
      insights.push({
        title: 'Widest choice of outdoor spaces',
        text: `${namesOf(venues, outdoor.ids)} ${outdoor.ids.length > 1 ? 'each list' : 'lists'} ${outdoor.value} outdoor ${outdoor.value === 1 ? 'space' : 'spaces'} (lawns, gardens, poolside and similar).`,
        venueIds: outdoor.ids,
      });
    }

    const indoor = leaders(selected.map((v) => {
      const n = spaceNamesByKind(v, 'indoor').length;
      return { id: v.id, value: n > 0 ? n : null };
    }));
    if (indoor) {
      insights.push({
        title: 'Widest choice of indoor spaces',
        text: `${namesOf(venues, indoor.ids)} ${indoor.ids.length > 1 ? 'each list' : 'lists'} ${indoor.value} indoor ${indoor.value === 1 ? 'space' : 'spaces'} (ballrooms, banquet halls and similar).`,
        venueIds: indoor.ids,
      });
    }

    const both = selected
      .filter((v) => spaceNamesByKind(v, 'indoor').length > 0 && spaceNamesByKind(v, 'outdoor').length > 0)
      .map((v) => v.id);
    if (both.length > 0 && both.length < selected.length) {
      insights.push({
        title: 'Indoor and outdoor spaces together',
        text: `${namesOf(venues, both)} ${both.length > 1 ? 'list' : 'lists'} both indoor and outdoor event spaces.`,
        venueIds: both,
      });
    }
  }

  return { venues, groups, insights };
}
