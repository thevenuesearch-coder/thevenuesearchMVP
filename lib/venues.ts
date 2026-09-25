import type { Venue, VenueSpace, RoomCategory } from './data';

export type { Venue, VenueSpace, RoomCategory };

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
  city: string | null;
  country: string | null;
  type: string | null;
  capacity_max: number | null;
  indicative_price: number | null;
  hold_fee: number | null;
  rating: number | null;
  verified: boolean | null;
  hero_image: string | null;
  tags: string[] | null;
  description: string | null;
  venue_spaces: DbVenueSpace[] | null;
  venue_rooms: DbVenueRoom[] | null;
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
 * `id` stays the human-readable slug (e.g. "hyderabad-1") so
 * every existing /venues/[id], /book?venue=, /enquiry?venue=
 * link keeps working unchanged. `dbId` carries the real
 * Supabase UUID for anywhere that needs a foreign key
 * (booking_requests.venue_id, enquiries.venue_id, etc.).
 */

function normalizeSpace(space: DbVenueSpace): VenueSpace {
  return {
    id: space.slug || space.id,
    name: space.name,
    capacity: space.capacity || 0,
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

function normalizeVenue(row: DbVenue): Venue {
  return {
    id: row.slug,
    dbId: row.id,
    name: row.name,
    destination: row.destination || row.city || '',
    city: row.city || '',
    country: row.country || 'India',
    type: row.type || '',
    capacity: row.capacity_max || 0,
    price: row.indicative_price || 0,
    hold: row.hold_fee ?? null,
    rating: row.rating ?? null,
    verified: row.verified ?? true,
    image: row.hero_image || '',
    tags: row.tags || [],
    desc: row.description || '',
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
export async function fetchVenuesServer(): Promise<Venue[]> {
  const { supabase } = await import('./supabase');

  const { data, error } = await supabase
    .from('venues')
    .select(
      `
        id,
        slug,
        name,
        destination,
        city,
        country,
        type,
        capacity_max,
        indicative_price,
        hold_fee,
        rating,
        verified,
        hero_image,
        tags,
        description,
        venue_spaces (
          id,
          slug,
          name,
          capacity,
          image_url,
          description,
          tags
        )
      `
    )
    .eq('status', 'published')
    .order('featured', { ascending: false });

  if (error) {
    console.error('fetchVenuesServer error:', error.message);
    return [];
  }

  return ((data || []) as DbVenue[]).map(normalizeVenue);
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
export async function fetchVenueBySlugServer(
  slug: string
): Promise<Venue | null> {
  if (!slug) return null;

  const { supabase } = await import('./supabase');

  const { data, error } = await supabase
    .from('venues')
    .select(
      `
        id,
        slug,
        name,
        destination,
        city,
        country,
        type,
        capacity_max,
        indicative_price,
        hold_fee,
        rating,
        verified,
        hero_image,
        tags,
        description,
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
    return null;
  }

  if (!data) return null;

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

  return normalizeVenue({
    ...(data as DbVenue),
    venue_rooms: publishedRooms,
  } as DbVenue);
}
