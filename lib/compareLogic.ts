import type { Venue, VenueSpace } from './data';
import { MAX_COMPARE } from './compare';

export const NOT_AVAILABLE = 'Not available';

/* ============================================================
   FORMATTING + DERIVATION HELPERS
   (everything here reads real fields only -- nothing invented)
   ============================================================ */

export function formatPrice(value: number | null): string {
  if (!value) return NOT_AVAILABLE;

  if (value >= 100000) {
    const lakhs = value / 100000;
    const rounded = Number.isInteger(lakhs) ? lakhs : Math.round(lakhs * 10) / 10;
    return `₹${rounded}L`;
  }

  return `₹${value.toLocaleString('en-IN')}`;
}

export function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

export function collectAmenities(venue: Venue): string[] {
  const pool: string[] = [
    ...venue.tags,
    ...venue.venueSpaces.flatMap((space) => space.tags),
    ...venue.rooms.flatMap((room) => [
      ...room.amenities,
      ...room.features,
      ...room.technology,
      ...room.services,
      ...room.specialInclusions,
    ]),
  ];

  const seen = new Map<string, string>();
  for (const raw of pool) {
    const label = raw.trim();
    if (!label) continue;
    const key = normalizeLabel(label);
    if (!seen.has(key)) seen.set(key, label);
  }

  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
}

export function bestForTags(venue: Venue): string[] {
  const tags: string[] = [];

  if (venue.capacity >= 400) tags.push('Large weddings');
  else if (venue.capacity > 0 && venue.capacity <= 150) tags.push('Intimate events');
  else if (venue.capacity > 0) tags.push('Mid-size celebrations');

  if (venue.rooms.length >= 4) tags.push('Accommodation-heavy bookings');
  else if (venue.rooms.length > 0) tags.push('On-site guest stays');

  if (venue.venueSpaces.length >= 3) tags.push('Multi-event weekends');
  if (/resort|palace/i.test(venue.type)) tags.push('Destination weddings');

  return Array.from(new Set(tags));
}

/**
 * Indoor/Outdoor isn't a real column in the schema -- venue_spaces
 * has no such flag. Rather than guess from words like "lawn" or
 * "garden", this only reports a value when a space's own tags
 * literally contain the word "indoor" or "outdoor" -- anything
 * else honestly reports "Not available".
 */
export function indoorOutdoor(space: VenueSpace | null, venue: Venue): string {
  const pool = (space ? space.tags : venue.tags).map((t) => t.toLowerCase());
  const hasIndoor = pool.some((t) => t.includes('indoor'));
  const hasOutdoor = pool.some((t) => t.includes('outdoor'));
  if (hasIndoor && hasOutdoor) return 'Indoor & Outdoor';
  if (hasIndoor) return 'Indoor';
  if (hasOutdoor) return 'Outdoor';
  return NOT_AVAILABLE;
}

export function roomOccupancySummary(venue: Venue): string {
  const values = venue.rooms
    .map((r) => r.maxOccupancy)
    .filter((n): n is number => typeof n === 'number' && n > 0);
  if (values.length === 0) return NOT_AVAILABLE;
  return `Up to ${Math.max(...values)} per room`;
}

/* ============================================================
   COLUMN MODEL
   Each compared column = a venue (property) + optionally one of
   its venue_spaces, so two columns can be the same property but
   two different banquet spaces within it.
   ============================================================ */

export type Column = {
  venue: Venue;
  space: VenueSpace | null;
};

export function parseColumnsParam(raw: string): { slug: string; spaceId: string | null }[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPARE)
    .map((token) => {
      const [slug, spaceId] = token.split(':');
      return { slug, spaceId: spaceId || null };
    });
}

export function serializeColumns(refs: { slug: string; spaceId: string | null }[]): string {
  return refs.map((r) => (r.spaceId ? `${r.slug}:${r.spaceId}` : r.slug)).join(',');
}

/* ============================================================
   ROW MODEL
   ============================================================ */

export type Row = {
  label: string;
  values: string[];
  skipDiff?: boolean;
};

export type Category = {
  key: string;
  title: string;
  rows: Row[];
};

export function buildCategories(columns: Column[]): Category[] {
  const val = (fn: (c: Column) => string): string[] => columns.map(fn);

  const propertyInfo: Row[] = [
    { label: 'Property name', values: val((c) => c.venue.name), skipDiff: true },
    {
      label: 'Location',
      values: val(
        (c) =>
          `${c.venue.city}${
            c.venue.country && c.venue.country !== c.venue.city ? `, ${c.venue.country}` : ''
          }`
      ),
      skipDiff: true,
    },
    { label: 'Venue type', values: val((c) => c.venue.type || NOT_AVAILABLE) },
    {
      label: 'Property rating',
      values: val((c) => (c.venue.rating ? `${c.venue.rating} ★` : NOT_AVAILABLE)),
    },
    {
      label: 'Banquet spaces at property',
      values: val((c) => (c.venue.venueSpaces.length ? String(c.venue.venueSpaces.length) : NOT_AVAILABLE)),
    },
    {
      label: 'Property capacity',
      values: val((c) =>
        c.venue.capacity ? `Up to ${c.venue.capacity.toLocaleString('en-IN')} guests` : NOT_AVAILABLE
      ),
    },
  ];

  const venueDetails: Row[] = [
    { label: 'Venue / space name', values: val((c) => c.space?.name || c.venue.name), skipDiff: true },
    {
      label: 'Capacity',
      values: val((c) => {
        const cap = c.space?.capacity || c.venue.capacity;
        return cap ? `${cap.toLocaleString('en-IN')} guests` : NOT_AVAILABLE;
      }),
    },
    { label: 'Indoor / Outdoor', values: val((c) => indoorOutdoor(c.space, c.venue)) },
    { label: 'Venue area', values: val(() => NOT_AVAILABLE), skipDiff: true },
    {
      label: 'About this space',
      values: val((c) => c.space?.description || c.venue.desc || NOT_AVAILABLE),
      skipDiff: true,
    },
    { label: 'Starting price', values: val((c) => formatPrice(c.venue.price)) },
  ];

  const accommodation: Row[] = [
    {
      label: 'Room categories',
      values: val((c) => (c.venue.rooms.length ? String(c.venue.rooms.length) : NOT_AVAILABLE)),
    },
    {
      label: 'Room category names',
      values: val((c) => c.venue.rooms.map((r) => r.name).join(', ') || NOT_AVAILABLE),
      skipDiff: true,
    },
    { label: 'Max occupancy', values: val((c) => roomOccupancySummary(c.venue)) },
    {
      label: 'Balcony rooms',
      values: val((c) =>
        c.venue.rooms.length ? (c.venue.rooms.some((r) => r.hasBalcony) ? 'Available' : NOT_AVAILABLE) : NOT_AVAILABLE
      ),
    },
  ];

  return [
    { key: 'property', title: 'Property Information', rows: propertyInfo },
    { key: 'venue', title: 'Venue Details', rows: venueDetails },
    { key: 'rooms', title: 'Accommodation', rows: accommodation },
  ];
}

export type AmenityRow = { label: string; present: boolean[] };

/**
 * A small, curated shortlist rather than every raw tag/feature
 * string in the database -- the full union was technically
 * accurate but unreadable (dozens of granular room-level entries).
 * Each is still only marked present when that word genuinely
 * appears somewhere in the venue's own tags/amenities/features/
 * services text -- nothing here is assumed or invented, just
 * scoped down to what's actually worth scanning at a glance.
 */
const AMENITY_SHORTLIST: { label: string; pattern: RegExp }[] = [
  { label: 'Parking', pattern: /\bparking\b/i },
  { label: 'Wi-Fi', pattern: /wi-?fi|internet/i },
  { label: 'Swimming Pool', pattern: /\bpool\b/i },
  { label: 'Power Backup', pattern: /power backup|generator/i },
  { label: 'Catering / Dining', pattern: /catering|restaurant|dining/i },
];

export function buildAmenityUnion(venues: Venue[]): AmenityRow[] {
  const pools = venues.map((v) => collectAmenities(v).join(' ').toLowerCase());

  return AMENITY_SHORTLIST.map(({ label, pattern }) => ({
    label,
    present: pools.map((text) => pattern.test(text)),
  }));
}

/**
 * Picks up to `count` "rival" venues for a given anchor venue --
 * same city first (most relevant comparison for someone deciding
 * between venues), then same venue type, then whatever's left.
 * Never invents venues: if fewer real candidates exist than
 * `count`, it simply returns fewer.
 */
export function pickRivalVenues(anchor: Venue, allVenues: Venue[], count: number): Venue[] {
  const pool = allVenues.filter((v) => v.id !== anchor.id);

  const sameCity = pool.filter((v) => v.city === anchor.city);
  const sameType = pool.filter((v) => v.type === anchor.type && v.city !== anchor.city);
  const rest = pool.filter((v) => v.city !== anchor.city && v.type !== anchor.type);

  const ordered = [...sameCity, ...sameType, ...rest];
  const seen = new Set<string>();
  const result: Venue[] = [];

  for (const v of ordered) {
    if (seen.has(v.id)) continue;
    seen.add(v.id);
    result.push(v);
    if (result.length >= count) break;
  }

  return result;
}
