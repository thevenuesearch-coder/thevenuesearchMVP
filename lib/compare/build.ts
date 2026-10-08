import type { Venue } from '../data';
import { formatCapacityRange, formatGuests, toCapacity } from '../capacity';
import { FEATURE_DEFS, type CompareFeature } from './features';
import type {
  CompareCell,
  CompareGroup,
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
 *  - A row appears only if enough venues have a value, so the table
 *    never fills up with empty rows. Amenity/service rows appear as
 *    soon as ONE compared venue has a verified value: that is the
 *    difference a visitor is looking for.
 *  - Amenities and services come only from venue_features rows
 *    (verified, with a source). A venue with no row for a feature
 *    gets a blank cell -- never a "No".
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

/*
 * Indoor / outdoor event spaces, from the tags already on each
 * venue_space (no new data, no guessing). A space is listed only when
 * its tags clearly say one or the other; spaces with no such tag, or
 * with both, are left out of both rows. Names are shown without
 * capacities (the Event & Function Spaces row has those).
 */
const OUTDOOR_TAGS = new Set(['outdoor', 'lawn', 'garden', 'poolside', 'deck']);
const INDOOR_TAGS = new Set(['indoor', 'ballroom', 'banquet', 'convention']);

function spacesByKind(
  venue: Venue,
  kind: 'indoor' | 'outdoor'
): string[] | null {
  const wanted = kind === 'indoor' ? INDOOR_TAGS : OUTDOOR_TAGS;
  const other = kind === 'indoor' ? OUTDOOR_TAGS : INDOOR_TAGS;

  const names = (venue.venueSpaces ?? [])
    .filter((space) => {
      const tags = (space.tags ?? []).map((t) => t.trim().toLowerCase());
      return tags.some((t) => wanted.has(t)) && !tags.some((t) => other.has(t));
    })
    .map((space) => cleanString(space.name));

  return capList(unique(names));
}

function featureCell(
  features: CompareFeature[] | undefined,
  key: string,
  display: 'check' | 'chips' = 'check'
): CompareCell {
  const found = features?.find((f) => f.key === key);
  if (!found) return null; /* not verified -> blank */

  const detail = cleanString(found.detail ?? '');

  if (display === 'chips') {
    /* A chips row exists to show its detail; with none there is nothing to show. */
    return detail ? capList(unique(detail.split(' · '))) : null;
  }

  return detail ?? true;
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

export type BuildOptions = {
  /* Hide prices unless the site-wide flag allows them. */
  showPrice?: boolean;
  /* Mark the first venue as "this venue" (venue-page widget). */
  highlightFirst?: boolean;
  /* A row is shown when at least this many venues have a value. */
  minFilledPerRow?: number;
};

/*
 * Compare any set of venues (the standalone /compare page).
 */
export function buildComparisonFor(
  ordered: Venue[],
  /* Published room rows keyed by Venue.dbId. */
  roomsByVenue: Record<string, CompareRoom[]>,
  /* Verified amenities & services keyed by Venue.dbId. */
  featuresByVenue: Record<string, CompareFeature[]>,
  {
    showPrice = false,
    highlightFirst = false,
    minFilledPerRow = 2,
  }: BuildOptions = {}
): CompareModel {
  const venues = ordered.map((v, i) =>
    toCompareVenue(v, highlightFirst && i === 0, showPrice)
  );

  /*
   * One row per group listing every VERIFIED item for each venue, with its
   * short factual detail where the source gave one ("Parking (Up to 350
   * cars)"). A venue with nothing verified in the group is left blank.
   */
  const summaryRow = (group: CompareGroup, label: string) => ({
    key: `group:${group}`,
    group,
    label,
    variant: 'chips' as CompareVariant,
    min: 1,
    get: (v: Venue): CompareCell => {
      const verified = featuresByVenue[v.dbId];
      if (!verified?.length) return null;

      const items = FEATURE_DEFS.filter((def) => def.group === group)
        .map((def) => {
          const found = verified.find((f) => f.key === def.key);
          if (!found) return null;
          const detail = cleanString(found.detail ?? '');
          return detail ? `${def.label} (${detail})` : def.label;
        })
        .filter((item): item is string => item !== null);

      return items.length ? items : null;
    },
  });

  const defs: Array<{
    key: string;
    group: CompareGroup;
    label: string;
    variant: CompareVariant;
    /* Rows only need this many filled cells to show (default: minFilledPerRow). */
    min?: number;
    get: (v: Venue) => CompareCell;
  }> = [
    /* ---- Venue overview ---- */
    {
      key: 'type',
      group: 'overview',
      label: 'Venue Type',
      variant: 'text',
      get: (v) => cleanString(v.type),
    },
    {
      key: 'location',
      group: 'overview',
      label: 'Location',
      variant: 'text',
      get: (v) => unique([v.city, v.destination]).join(', ') || null,
    },
    {
      key: 'capacity',
      group: 'overview',
      label: 'Guest Capacity',
      variant: 'stat',
      get: (v) => formatCapacityRange(v.capacityMin, v.capacity),
    },

    /* ---- Accommodation ---- */
    {
      key: 'rooms',
      group: 'accommodation',
      label: 'Room Categories',
      variant: 'chips',
      get: (v) => roomCategories(roomsByVenue[v.dbId]),
    },

    /* ---- Event spaces ---- */
    {
      key: 'spaces',
      group: 'spaces',
      label: 'Event & Function Spaces',
      variant: 'lines',
      get: eventSpaces,
    },
    {
      key: 'indoor',
      group: 'spaces',
      label: 'Indoor Spaces',
      variant: 'chips',
      get: (v) => spacesByKind(v, 'indoor'),
    },
    {
      key: 'outdoor',
      group: 'spaces',
      label: 'Outdoor Spaces',
      variant: 'chips',
      get: (v) => spacesByKind(v, 'outdoor'),
    },

    /* ---- Amenities: ONE row listing everything verified for each venue ---- */
    summaryRow('amenities', 'Amenities Available'),

    /* ---- Dining: restaurants, cuisines, bars, 24-hour dining ---- */
    ...FEATURE_DEFS.filter((def) => def.group === 'dining').map((def) => ({
      key: `feature:${def.key}`,
      group: def.group as CompareGroup,
      label: def.label,
      variant: (def.display === 'chips' ? 'chips' : 'check') as CompareVariant,
      min: 1,
      get: (v: Venue): CompareCell =>
        featureCell(featuresByVenue[v.dbId], def.key, def.display),
    })),

    /* ---- Wedding & event services, then general services: one row each ---- */
    summaryRow('wedding', 'Wedding & Event Services'),
    summaryRow('services', 'Services Available'),
  ];

  const rows: CompareRow[] = [];
  for (const def of defs) {
    const cells = ordered.map((v) => def.get(v));
    if (cells.filter((c) => c !== null).length >= (def.min ?? minFilledPerRow)) {
      rows.push({
        key: def.key,
        group: def.group,
        label: def.label,
        variant: def.variant,
        cells,
      });
    }
  }

  return { venues, rows };
}

/*
 * Venue-page widget: this venue + its similar venues.
 */
export function buildComparison(
  current: Venue,
  similar: Venue[],
  roomsByVenue: Record<string, CompareRoom[]>,
  featuresByVenue: Record<string, CompareFeature[]>,
  { showPrice = false }: { showPrice?: boolean } = {}
): CompareModel {
  return buildComparisonFor([current, ...similar], roomsByVenue, featuresByVenue, {
    showPrice,
    highlightFirst: true,
  });
}
