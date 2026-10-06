import type { Venue } from '../data';
import { formatCapacityRange, formatGuests, toCapacity } from '../capacity';
import type {
  CompareCell,
  CompareModel,
  CompareRoom,
  CompareRow,
  CompareVariant,
  CompareVenue,
} from './types';

/*
 * Turns venues (+ their room rows) into the comparison table model.
 *
 * Rules enforced here, not in the UI:
 *  - Each cell comes only from that venue's own data. Nothing is
 *    copied or inferred across venues.
 *  - Placeholder/negative values ("No", "N/A", "0", "Unknown"...)
 *    are treated as missing, even if one reaches the database.
 *  - Room categories are shown only for rooms that carry a
 *    source_url (the verification trail on venue_rooms).
 *  - Missing = null = a blank cell.
 *  - A row appears only if at least two venues have a value, so the
 *    table never fills up with empty rows.
 */

const PLACEHOLDERS = new Set([
  '', 'no', 'n/a', 'na', 'none', 'null', 'undefined', 'unknown', '-', '--',
  '—', '0', 'not available', 'not provided', 'not specified', 'tbd', 'nil',
]);

export function cleanString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return PLACEHOLDERS.has(text.toLowerCase()) ? null : text;
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function unique(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const v = cleanString(raw ?? '');
    if (v && !seen.has(v.toLowerCase())) {
      seen.add(v.toLowerCase());
      out.push(v);
    }
  }
  return out;
}

const LIST_CAP = 6;

function capList(items: string[]): string[] | null {
  if (items.length === 0) return null;
  if (items.length <= LIST_CAP) return items;
  return [...items.slice(0, LIST_CAP), `+${items.length - LIST_CAP} more`];
}

function formatInr(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

function toCompareVenue(
  venue: Venue,
  isCurrent: boolean,
  showPrice: boolean
): CompareVenue {
  const rating =
    typeof venue.rating === 'number' &&
    Number.isFinite(venue.rating) &&
    venue.rating > 0 &&
    venue.rating <= 5
      ? venue.rating.toFixed(1)
      : null;

  return {
    id: venue.id,
    name: cleanString(venue.name) ?? '',
    location: unique([venue.city, venue.destination, venue.country]).join(', '),
    image: cleanString(venue.image),
    startingPrice:
      showPrice && venue.price > 0 ? `From ${formatInr(venue.price)}` : null,
    rating,
    isCurrent,
  };
}

function roomCategories(rooms: CompareRoom[] | undefined): string[] | null {
  if (!rooms) return null;
  return capList(
    unique(rooms.filter((r) => isHttpUrl(r.sourceUrl)).map((r) => r.name))
  );
}

function eventSpaces(venue: Venue): string[] | null {
  const items = (venue.venueSpaces ?? [])
    .map((space) => {
      const name = cleanString(space.name);
      if (!name) return null;
      const guests = toCapacity(space.capacity)
        ? formatGuests(space.capacity)
        : null;
      return guests ? `${name} · up to ${guests}` : name;
    })
    .filter((x): x is string => x !== null);

  return capList(unique(items));
}

export function buildComparison(
  current: Venue,
  similar: Venue[],
  /* Published room rows keyed by Venue.dbId. */
  roomsByVenue: Record<string, CompareRoom[]>,
  { showPrice = false }: { showPrice?: boolean } = {}
): CompareModel {
  const ordered = [current, ...similar];

  const venues = ordered.map((v, i) => toCompareVenue(v, i === 0, showPrice));

  const defs: Array<{
    key: string;
    label: string;
    variant: CompareVariant;
    get: (v: Venue) => CompareCell;
  }> = [
    {
      key: 'type',
      label: 'Venue Type',
      variant: 'text',
      get: (v) => cleanString(v.type),
    },
    {
      key: 'capacity',
      label: 'Guest Capacity',
      variant: 'stat',
      get: (v) => formatCapacityRange(v.capacityMin, v.capacity),
    },
    {
      key: 'rooms',
      label: 'Room Categories',
      variant: 'chips',
      get: (v) => roomCategories(roomsByVenue[v.dbId]),
    },
    {
      key: 'spaces',
      label: 'Event & Function Spaces',
      variant: 'lines',
      get: eventSpaces,
    },
  ];

  const rows: CompareRow[] = [];
  for (const def of defs) {
    const cells = ordered.map((v) => def.get(v));
    if (cells.filter((c) => c !== null).length >= 2) {
      rows.push({
        key: def.key,
        label: def.label,
        variant: def.variant,
        cells,
      });
    }
  }

  return { venues, rows };
}
