import { supabase } from './supabase';
import type { Venue } from './data';
import { FEATURE_DEFS, type CompareFeature } from './compare/features';

/*
 * View-model for the Collections page.
 *
 * Everything here comes from data VenueSearch already holds:
 *   - photos: the venue's own images (main image, event-space images,
 *     room images), each captioned with its real space / room name. The
 *     database has no dining or exterior photo field, so none is labelled
 *     or invented.
 *   - stats: capacity, event-space count, room-category count, type and
 *     location. A value that is missing (0 / empty) is left out, never
 *     shown as 0 or "N/A".
 *   - highlights: verified amenities & services (see lib/compare/features).
 */

export type CollectionPhoto = {
  src: string;
  alt: string;
  caption: string;
};

export type CollectionVenue = {
  id: string;
  name: string;
  type: string;
  location: string;
  description: string;
  capacity: number | null;
  capacityMin: number | null;
  spaceCount: number;
  roomCount: number;
  photos: CollectionPhoto[];
  highlights: string[];
};

export type CollectionRoom = {
  name: string;
  image: string;
  gallery: string[];
};

const MAX_PHOTOS = 8;
const MAX_SPACE_PHOTOS = 3;
const MAX_ROOM_PHOTOS = 3;
const MAX_HIGHLIGHTS = 6;

/* Most useful for choosing a wedding venue first. */
const HIGHLIGHT_ORDER = [
  'swimming_pool',
  'spa',
  'fitness_centre',
  'wifi',
  'parking',
  'valet_parking',
  'ev_charging',
  'accessibility',
  'business_centre',
  'kids_facilities',
  'catering',
  'wedding_planning',
  'airport_transfer',
  'concierge',
  'room_service',
];

/*
 * Published rooms (name + photos) for a set of venues, in one query.
 * Mirrors the compare page. On error returns {} so the page simply has
 * no room photos / room counts rather than failing.
 */
export async function fetchCollectionRooms(
  venueIds: string[],
): Promise<Record<string, CollectionRoom[]>> {
  const rooms: Record<string, CollectionRoom[]> = {};
  const ids = venueIds.filter(Boolean);
  if (ids.length === 0) return rooms;

  const { data, error } = await supabase
    .from('venue_rooms')
    .select('venue_id, name, image_url, gallery_urls, sort_order')
    .in('venue_id', ids)
    .eq('status', 'published')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('collections rooms error:', error.message);
    return rooms;
  }

  for (const row of data ?? []) {
    (rooms[row.venue_id] ??= []).push({
      name: row.name,
      image: row.image_url || '',
      gallery: Array.isArray(row.gallery_urls) ? row.gallery_urls : [],
    });
  }

  return rooms;
}

function shorten(text: string, max = 190): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;

  const cut = clean.slice(0, max);
  const sentence = cut.lastIndexOf('. ');
  if (sentence > 80) return cut.slice(0, sentence + 1);

  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:\s]+$/, '')}…`;
}

function buildPhotos(venue: Venue, rooms: CollectionRoom[]): CollectionPhoto[] {
  const where = venue.city ? `${venue.name}, ${venue.city}` : venue.name;
  const seen = new Set<string>();
  const photos: CollectionPhoto[] = [];

  const add = (src: string | undefined, alt: string, caption: string) => {
    const url = (src ?? '').trim();
    if (!url || seen.has(url) || photos.length >= MAX_PHOTOS) return;
    seen.add(url);
    photos.push({ src: url, alt, caption });
  };

  add(venue.image, where, 'The venue');

  venue.venueSpaces
    .filter((space) => space.image)
    .slice(0, MAX_SPACE_PHOTOS)
    .forEach((space) =>
      add(
        space.image,
        `${space.name}, an event space at ${where}`,
        `Event space · ${space.name}`,
      ),
    );

  rooms
    .filter((room) => room.image || room.gallery.length > 0)
    .slice(0, MAX_ROOM_PHOTOS)
    .forEach((room) =>
      add(
        room.image || room.gallery[0],
        `${room.name} at ${where}`,
        `Room · ${room.name}`,
      ),
    );

  return photos;
}

function buildHighlights(features: CompareFeature[] | undefined): string[] {
  if (!features?.length) return [];

  const labelByKey = new Map(FEATURE_DEFS.map((d) => [d.key, d.label]));
  const have = new Set(features.map((f) => f.key));

  return HIGHLIGHT_ORDER.filter((key) => have.has(key))
    .map((key) => labelByKey.get(key))
    .filter((label): label is string => !!label)
    .slice(0, MAX_HIGHLIGHTS);
}

export function buildCollectionVenues(
  venues: Venue[],
  roomsByVenue: Record<string, CollectionRoom[]>,
  featuresByVenue: Record<string, CompareFeature[]>,
): CollectionVenue[] {
  return venues.map((venue) => {
    const rooms = roomsByVenue[venue.dbId] ?? [];

    return {
      id: venue.id,
      name: venue.name,
      type: venue.type,
      location: [venue.city, venue.destination]
        .filter((part, i, all) => part && all.indexOf(part) === i)
        .join(', '),
      description: shorten(venue.desc),
      capacity: venue.capacity > 0 ? venue.capacity : null,
      capacityMin: venue.capacityMin,
      spaceCount: venue.venueSpaces.length,
      roomCount: rooms.length,
      photos: buildPhotos(venue, rooms),
      highlights: buildHighlights(featuresByVenue[venue.dbId]),
    };
  });
}
