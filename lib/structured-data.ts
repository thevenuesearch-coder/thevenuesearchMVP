import type { Venue, VenueSpace, RoomCategory } from './data';

/*
 * ============================================================
 * SCHEMA.ORG / JSON-LD STRUCTURED DATA
 * ============================================================
 *
 * Builds structured data from the venue records that are already
 * loaded from Supabase -- nothing is hard-coded per venue.
 *
 * Guiding rule (Google's structured data policy): markup must
 * describe content that is real and visible to users. So this file
 * only emits what the data genuinely supports:
 *
 *   EMITTED   venue / property, location, capacity, images,
 *             amenities, event spaces, hotel rooms, bookability
 *             (ReserveAction), and a venue list for /explore.
 *
 *   OFF       price. Prices exist in the database but are not
 *             shown on the page, so publishing them only in markup
 *             would not match what users see. See
 *             INCLUDE_PRICE_IN_JSON_LD below.
 *
 *   OMITTED   reviews / aggregateRating -- there is no reviews
 *             data (only a single curated rating, no review count),
 *             and unsourced ratings break Google's policy.
 *             events -- there is no public events data.
 *             date-level availability -- the app does not expose
 *             public availability (bookings are private), so it
 *             cannot be stated truthfully.
 */

export const SITE_URL = 'https://venuesearch.in';

/*
 * Turn on ONLY when venue prices are visibly shown on the venue
 * page (and the venues have agreed to publish them). Even when on,
 * a venue is skipped unless it has a real price (> 0).
 */
export const INCLUDE_PRICE_IN_JSON_LD = false;

export type VenueLocation = {
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type JsonObject = Record<string, unknown>;

/*
 * Safe serialisation for a <script type="application/ld+json">
 * block. Escapes characters that could terminate the script tag or
 * be misread by an HTML parser, so text from the database (venue
 * descriptions etc.) can never break out of the block.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/*
 * Drops undefined / null / empty strings / empty arrays / empty
 * objects so the output only contains properties that have real
 * values.
 */
function compact<T extends JsonObject>(input: T): JsonObject {
  const out: JsonObject = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value as JsonObject).length === 0
    ) {
      continue;
    }

    out[key] = value;
  }

  return out;
}

function absoluteUrl(url: string | null | undefined) {
  if (!url) return undefined;

  const trimmed = url.trim();

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `${SITE_URL}${trimmed}`;

  return undefined;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const value of values) {
    const v = (value || '').trim();
    const key = v.toLowerCase();

    if (v && !seen.has(key)) {
      seen.add(key);
      out.push(v);
    }
  }

  return out;
}

function featureList(names: string[], limit: number) {
  return names.slice(0, limit).map((name) => ({
    '@type': 'LocationFeatureSpecification',
    name,
    value: true,
  }));
}

function countryCode(country: string | null | undefined) {
  const c = (country || '').trim();

  if (!c) return undefined;
  if (c.toLowerCase() === 'india') return 'IN';

  return c;
}

function spaceNode(space: VenueSpace): JsonObject {
  return compact({
    '@type': 'Place',
    name: space.name,
    description: space.description,
    maximumAttendeeCapacity:
      space.capacity > 0 ? space.capacity : undefined,
    image: absoluteUrl(space.image),
    amenityFeature: featureList(
      uniqueStrings(space.tags || []),
      15
    ),
  });
}

function roomNode(room: RoomCategory): JsonObject {
  const gallery = uniqueStrings([
    absoluteUrl(room.image),
    ...(room.gallery || []).map(absoluteUrl),
  ]).slice(0, 6);

  const features = uniqueStrings([
    ...room.features,
    ...room.amenities,
    ...room.technology,
    ...room.services,
    ...room.specialInclusions,
  ]);

  let floorSize: JsonObject | undefined;

  if (room.sizeSqm && room.sizeSqm > 0) {
    floorSize = {
      '@type': 'QuantitativeValue',
      value: room.sizeSqm,
      unitCode: 'MTK',
    };
  } else if (room.sizeSqft && room.sizeSqft > 0) {
    floorSize = {
      '@type': 'QuantitativeValue',
      value: room.sizeSqft,
      unitCode: 'FTK',
    };
  }

  return compact({
    '@type': 'HotelRoom',
    name: room.name,
    description: room.description,
    image: gallery,
    bed: room.bedType
      ? { '@type': 'BedDetails', typeOfBed: room.bedType }
      : undefined,
    occupancy:
      room.maxOccupancy && room.maxOccupancy > 0
        ? {
            '@type': 'QuantitativeValue',
            maxValue: room.maxOccupancy,
          }
        : undefined,
    floorSize,
    amenityFeature: featureList(features, 25),
  });
}

/*
 * One venue page -> one EventVenue (and LodgingBusiness when the
 * venue has guest rooms).
 */
export function buildVenueJsonLd(
  venue: Venue,
  location?: VenueLocation | null,
  options: { includePrice?: boolean } = {}
): JsonObject {
  const includePrice =
    options.includePrice ?? INCLUDE_PRICE_IN_JSON_LD;

  const url = `${SITE_URL}/venues/${venue.id}`;
  const hasRooms = venue.rooms.length > 0;

  /*
   * An offer (price) can only be attached to an Organization, and a
   * plain EventVenue is only a Place -- so a priced venue is also
   * typed as a LocalBusiness (LodgingBusiness already is one).
   */
  const hasOffer = includePrice && venue.price > 0;

  const images = uniqueStrings([
    absoluteUrl(venue.image),
    ...venue.venueSpaces.map((s) => absoluteUrl(s.image)),
    ...venue.rooms.map((r) => absoluteUrl(r.image)),
  ]).slice(0, 10);

  /*
   * Venue-level amenities: the union of what the rooms actually
   * list (features, in-room amenities, technology, services,
   * inclusions). Deduplicated and capped.
   */
  const amenities = uniqueStrings(
    venue.rooms.flatMap((room) => [
      ...room.features,
      ...room.amenities,
      ...room.technology,
      ...room.services,
      ...room.specialInclusions,
    ])
  );

  const lat =
    typeof location?.latitude === 'number' &&
    Math.abs(location.latitude) <= 90
      ? location.latitude
      : undefined;

  const lng =
    typeof location?.longitude === 'number' &&
    Math.abs(location.longitude) <= 180
      ? location.longitude
      : undefined;

  const addressLocality = venue.city || venue.destination;

  const address = compact({
    '@type': 'PostalAddress',
    streetAddress: location?.address || undefined,
    addressLocality,
    addressCountry: countryCode(venue.country),
  });

  const node = compact({
    '@context': 'https://schema.org',
    '@type': hasRooms
      ? ['EventVenue', 'LodgingBusiness']
      : hasOffer
        ? ['EventVenue', 'LocalBusiness']
        : 'EventVenue',
    '@id': `${url}#venue`,
    url,
    name: venue.name,
    description: venue.desc,
    image: images,
    address:
      Object.keys(address).length > 1 ? address : undefined,
    geo:
      lat !== undefined && lng !== undefined
        ? {
            '@type': 'GeoCoordinates',
            latitude: lat,
            longitude: lng,
          }
        : undefined,
    maximumAttendeeCapacity:
      venue.capacity > 0 ? venue.capacity : undefined,
    keywords: uniqueStrings(venue.tags || []).join(', '),
    amenityFeature: featureList(amenities, 30),
    containsPlace: [
      ...venue.venueSpaces.map(spaceNode),
      ...venue.rooms.map(roomNode),
    ],
    potentialAction: {
      '@type': 'ReserveAction',
      name: `Book ${venue.name}`,
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/book?venue=${venue.id}`,
        actionPlatform: [
          'https://schema.org/DesktopWebPlatform',
          'https://schema.org/MobileWebPlatform',
        ],
      },
      result: {
        '@type': 'Reservation',
        name: `Reservation at ${venue.name}`,
      },
    },
    makesOffer: hasOffer
        ? {
            '@type': 'Offer',
            url,
            priceSpecification: {
              '@type': 'PriceSpecification',
              minPrice: venue.price,
              priceCurrency: 'INR',
              description: 'Indicative starting price',
            },
          }
        : undefined,
  });

  return node;
}

/*
 * /explore -> ItemList of the venues shown on the page.
 */
export function buildVenueListJsonLd(
  venues: Venue[]
): JsonObject | null {
  if (venues.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Verified wedding venues',
    numberOfItems: venues.length,
    itemListElement: venues.map((venue, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/venues/${venue.id}`,
      name: venue.name,
    })),
  };
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const n = Number(value);

  return Number.isFinite(n) ? n : null;
}

/*
 * Street address and coordinates for a venue.
 *
 * Fetched separately from the main venue query on purpose: these
 * columns are defined in supabase/schema.sql, but the live table
 * has changed since, and the main query (which the whole site
 * depends on) must not be touched. If the columns are missing or
 * the request fails, this simply returns null and the structured
 * data is emitted without an address/geo -- the page is unaffected.
 */
export async function fetchVenueLocationServer(
  slug: string
): Promise<VenueLocation | null> {
  if (!slug) return null;

  try {
    const { supabase } = await import('./supabase');

    const { data, error } = await supabase
      .from('venues')
      .select('address, latitude, longitude')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error || !data) return null;

    const row = data as {
      address?: string | null;
      latitude?: unknown;
      longitude?: unknown;
    };

    return {
      address: row.address || null,
      latitude: toNumber(row.latitude),
      longitude: toNumber(row.longitude),
    };
  } catch {
    return null;
  }
}
