import { unstable_cache } from 'next/cache';
import { cache } from 'react';

import { resolveVenueSlug } from './venue-slugs';
import { toCapacity } from './capacity';

import type {
  Venue,
  VenueSpace,
  VenueSummary,
  RoomCategory,
} from './data';

export type { Venue, VenueSpace, VenueSummary, RoomCategory };

/*
 * ============================================================
 * DB ROW SHAPES
 * ============================================================
 *
 * These match the columns selected in /app/api/venues/route.ts
 * and /app/api/venues/[slug]/route.ts.
 */

type DbVenueSpace = {
  id: string;
  slug: string | null;
  name: string;
  capacity: number | null;
  image_url: string | null;
  description: string | null;
  tags: string[] | null;
  space_type?: string | null;
};

type DbVenueRoom = {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
  gallery_urls: string[] | null;
  bed_type: string | null;
  max_occupancy: number | null;
  occupancy_note: string | null;
  size_sqm: number | null;
  size_sqft: number | null;
  view_type: string | null;
  description: string | null;
  features: string[] | null;
  bathroom_details: string | null;
  amenities: string[] | null;
  technology: string[] | null;
  dining_details: string | null;
  services: string[] | null;
  special_inclusions: string[] | null;
  has_balcony: boolean | null;
  floor_location: string | null;
  source_url: string | null;
};

type DbVenue = {
  id: string;
  slug: string;
  name: string;
  destination: string | null;
  state: string | null;
  city: string | null;
  country: string | null;
  type: string | null;
  capacity_min: number | null;
  capacity_max: number | null;
  indicative_price: number | null;
  hold_fee: number | null;
  rating: number | null;
  verified: boolean | null;
  hero_image: string | null;
  tags: string[] | null;
  description: string | null;
  updated_at?: string | null;
  venue_spaces: DbVenueSpace[] | null;
  venue_rooms: DbVenueRoom[] | null;
  /* Light-weight rows loaded by the list query only (Explore filters). */
  room_stub?: { id: string; status: string | null }[] | null;
  feature_stub?: { feature_key: string; status: string | null }[] | null;
};

/*
 * ============================================================
 * NORMALIZATION
 * ============================================================
 *
 * Converts a raw Supabase row into the same `Venue` shape the
 * app has always used, so existing pages/components didn't need
 * to be rewritten -- only their data source changed.
 *
 * `id` stays the human-readable slug so every existing
 * /venues/[id], /book?venue=, /enquiry?venue= link uses the
 * current public venue slug. `dbId` carries the real
 * Supabase UUID for anywhere that needs a foreign key
 * (booking_requests.venue_id, enquiries.venue_id, etc.).
 */

function normalizeSpace(space: DbVenueSpace): VenueSpace {
  return {
    id: space.slug || space.id,
    name: space.name,
    capacity: toCapacity(space.capacity) ?? 0,
    image: space.image_url || '',
    description: space.description || '',
    tags: space.tags || [],
  };
}

function normalizeRoom(room: DbVenueRoom): RoomCategory {
  return {
    id: room.slug || room.id,
    name: room.name,
    image: room.image_url || '',
    gallery: room.gallery_urls || [],
    bedType: room.bed_type,
    maxOccupancy: room.max_occupancy,
    occupancyNote: room.occupancy_note,
    sizeSqm: room.size_sqm,
    sizeSqft: room.size_sqft,
    view: room.view_type,
    description: room.description,
    features: room.features || [],
    bathroomDetails: room.bathroom_details,
    amenities: room.amenities || [],
    technology: room.technology || [],
    diningDetails: room.dining_details,
    services: room.services || [],
    specialInclusions: room.special_inclusions || [],
    hasBalcony: room.has_balcony ?? false,
    floorLocation: room.floor_location,
    sourceUrl: room.source_url,
  };
}


/*
 * Explore "Event space type" categories. Spaces are tagged freely in
 * the database ("Lawn", "Banquet", "Pool", ...); this folds the tags a
 * venue's spaces carry into a small, stable set so the filter offers
 * one clean option per kind of space.
 */
const SPACE_TYPE_ALIASES: Record<string, string[]> = {
  Lawn: ['lawn', 'lawns'],
  Garden: ['garden', 'garden room', 'garden temple'],
  'Banquet Hall': ['banquet hall', 'banquet'],
  Ballroom: ['ballroom', 'grand hall'],
  Courtyard: ['courtyard', 'court', 'patio'],
  Terrace: ['terrace', 'rooftop'],
  Poolside: ['poolside', 'pool'],
  Beachfront: ['beach', 'beachfront'],
};

export const SPACE_TYPE_OPTIONS = Object.keys(SPACE_TYPE_ALIASES);

function deriveSpaceTypes(spaces: DbVenueSpace[] | null): string[] {
  const found = new Set<string>();

  for (const space of spaces || []) {
    const labels = [...(space.tags || []), space.space_type || '']
      .map((label) => label.trim().toLowerCase())
      .filter(Boolean);

    for (const [category, aliases] of Object.entries(SPACE_TYPE_ALIASES)) {
      if (labels.some((label) => aliases.includes(label))) {
        found.add(category);
      }
    }
  }

  return SPACE_TYPE_OPTIONS.filter((category) => found.has(category));
}

function normalizeVenue(row: DbVenue): Venue {
  return {
    id: row.slug,
    dbId: row.id,
    name: row.name,
    destination: row.destination || row.city || '',
    state: row.state || '',
    city: row.city || '',
    country: row.country || 'India',
    type: row.type || '',
    capacity: toCapacity(row.capacity_max) ?? 0,
    capacityMin: toCapacity(row.capacity_min),
    price: row.indicative_price || 0,
    hold: row.hold_fee ?? null,
    rating: row.rating ?? null,
    verified: row.verified ?? true,
    /*
     * A venue without its own hero image uses its first space photo,
     * the same photo its venue page shows as the hero. This keeps the
     * Explore and Home cards from falling back to the placeholder.
     */
    image:
      row.hero_image ||
      (row.venue_spaces || [])
        .map((space) => space.image_url)
        .find(Boolean) ||
      '',
    tags: row.tags || [],
    desc: row.description || '',
    updatedAt: row.updated_at || undefined,
    spaceTypes: deriveSpaceTypes(row.venue_spaces),
    amenities: (row.feature_stub || [])
      .filter((feature) => feature.status === 'published')
      .map((feature) => feature.feature_key),
    roomCategoryCount: (row.room_stub || []).filter(
      (room) => room.status === 'published'
    ).length,
    venueSpaces: (row.venue_spaces || []).map(normalizeSpace),
    rooms: (row.venue_rooms || []).map(normalizeRoom),
  };
}

/*
 * ============================================================
 * FETCH HELPERS
 * ============================================================
 */

export async function fetchVenues(): Promise<Venue[]> {
  const response = await fetch('/api/venues', {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Unable to load venues.');
  }

  const { data } = await response.json();

  return ((data || []) as DbVenue[]).map(normalizeVenue);
}

/*
 * Server-side counterpart to fetchVenues(): queries Supabase
 * directly instead of via a relative /api fetch (which only
 * resolves inside a browser). Used from Server Components so the
 * venue grid is present in the initial HTML -- real content for
 * search engines and anyone whose JS is slow or unavailable --
 * rather than only appearing after a client-side useEffect runs.
 * Mirrors the exact query in app/api/venues/route.ts.
 */
async function loadPublishedVenues(): Promise<Venue[]> {
  const { supabase } = await import('./supabase');

  const { data, error } = await supabase
    .from('venues')
    .select(
      `
        id,
        slug,
        name,
        destination,
        state,
        city,
        country,
        type,
        capacity_min,
        capacity_max,
        indicative_price,
        hold_fee,
        rating,
        verified,
        hero_image,
        tags,
        description,
        updated_at,
        venue_spaces (
          id,
          slug,
          name,
          capacity,
          image_url,
          description,
          tags,
          space_type
        ),
        room_stub:venue_rooms (
          id,
          status
        ),
        feature_stub:venue_features (
          feature_key,
          status
        )
      `
    )
    .eq('status', 'published')
    .order('featured', { ascending: false });

  if (error) {
    /*
     * Throw (do not return []): a thrown error is never stored in the
     * cache below, so a Supabase outage can't freeze an empty list in
     * for the next few minutes.
     */
    throw new Error(error.message);
  }

  return ((data || []) as DbVenue[]).map(normalizeVenue);
}

/*
 * The published-venue list, cached for 5 minutes.
 *
 * Why: the home, Explore, venue, destination and sitemap routes all
 * need this same list. Fetching it from Supabase on every request
 * (about 0.3 MB each time) used up the project's monthly egress, and
 * while Supabase was unavailable every page rendered with no venues.
 * With the cache, one request per few minutes refreshes it, and if a
 * refresh fails the last good copy keeps being served (stale-while-
 * revalidate) instead of an empty list.
 *
 * New or edited venues show up within 5 minutes. Call
 * revalidateTag('venues') to refresh sooner.
 */
export const VENUES_CACHE_SECONDS = 300;

const loadPublishedVenuesCached = unstable_cache(
  loadPublishedVenues,
  ['published-venues-v1'],
  { revalidate: VENUES_CACHE_SECONDS, tags: ['venues'] }
);

/*
 * Venues plus whether the load failed, so pages can tell "there are
 * no venues" apart from "we could not reach the database" (the second
 * must never be served to Google as a normal empty page).
 */
export async function fetchVenuesResultServer(): Promise<{
  venues: Venue[];
  failed: boolean;
}> {
  try {
    return { venues: await loadPublishedVenuesCached(), failed: false };
  } catch (error) {
    console.error(
      'fetchVenuesServer error:',
      error instanceof Error ? error.message : error
    );
    return { venues: [], failed: true };
  }
}

/* Same list, for callers that only need the venues (never throws). */
export async function fetchVenuesServer(): Promise<Venue[]> {
  return (await fetchVenuesResultServer()).venues;
}

export async function fetchVenueBySlug(
  slug: string
): Promise<Venue | null> {
  if (!slug) return null;

  const response = await fetch(
    `/api/venues/${encodeURIComponent(slug)}`,
    { cache: 'no-store' }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Unable to load venue.');
  }

  const { data } = await response.json();

  return data ? normalizeVenue(data as DbVenue) : null;
}

/*
 * Server-side counterpart to fetchVenueBySlug(). Mirrors the
 * exact query in app/api/venues/[slug]/route.ts. Used by the venue
 * detail page's Server Component wrapper both to render real
 * content server-side and to power generateMetadata (per-venue
 * SEO title/description/OG tags).
 */
export const fetchVenueBySlugServer = cache(
  async (slug: string): Promise<Venue | null> =>
    (await fetchVenueResultServer(slug)).venue
);

/*
 * Same query, but reports whether the lookup itself failed so the
 * page can tell "this venue doesn't exist" (a real 404) apart from
 * "Supabase hiccuped" (which must not be served as a 404 to
 * search engines). React cache() de-duplicates the call within a
 * request: generateMetadata and the page used to run this query
 * twice per view.
 */
export const fetchVenueResultServer = cache(
  async (
    slug: string
  ): Promise<{ venue: Venue | null; failed: boolean }> =>
    queryVenueBySlug(slug)
);

async function queryVenueBySlug(
  requestedSlug: string
): Promise<{ venue: Venue | null; failed: boolean }> {
  if (!requestedSlug) return { venue: null, failed: false };

  const slug = resolveVenueSlug(requestedSlug);

  const { supabase } = await import('./supabase');

  const { data, error } = await supabase
    .from('venues')
    .select(
      `
        id,
        slug,
        name,
        destination,
        state,
        city,
        country,
        type,
        capacity_min,
        capacity_max,
        indicative_price,
        hold_fee,
        rating,
        verified,
        hero_image,
        tags,
        description,
        updated_at,
        venue_spaces (
          id,
          slug,
          name,
          capacity,
          image_url,
          description,
          tags
        ),
        venue_rooms (
          id,
          slug,
          name,
          image_url,
          gallery_urls,
          bed_type,
          max_occupancy,
          occupancy_note,
          size_sqm,
          size_sqft,
          view_type,
          description,
          features,
          bathroom_details,
          amenities,
          technology,
          dining_details,
          services,
          special_inclusions,
          has_balcony,
          floor_location,
          source_url,
          status,
          sort_order
        )
      `
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    console.error('fetchVenueBySlugServer error:', error.message);
    return { venue: null, failed: true };
  }

  if (!data) return { venue: null, failed: false };

  /*
   * Same post-query filtering the API route does -- a nested
   * Supabase select embeds related rows as-is, so unpublished
   * ('draft') rooms would otherwise leak into the public page.
   */
  const publishedRooms = ((data as any).venue_rooms || [])
    .filter((room: any) => room.status === 'published')
    .sort(
      (a: any, b: any) =>
        (a.sort_order || 0) - (b.sort_order || 0)
    );

  return {
    venue: normalizeVenue({
      ...(data as DbVenue),
      venue_rooms: publishedRooms,
    } as DbVenue),
    failed: false,
  };
}

/*
 * Strips a full Venue down to what list/card components need
 * (see VenueSummary in ./data).
 */
export function toVenueSummary(venue: Venue): VenueSummary {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  /*
   * dbId is kept: cards need the real database id (a uuid) to save a
   * venue to the shortlist. The slug in `id` is not valid there.
   */
  const { price, hold, venueSpaces, rooms, ...summary } =
    venue;

  return summary;
}
