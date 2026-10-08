import type { Venue } from '../data';
import { supabase } from '../supabase';
import { SHOW_PUBLIC_STARTING_PRICE } from '../../components/PublicVenueDetails';
import { buildComparison, buildComparisonFor } from './build';
import { bundledFeatures } from './bundled-features';
import { isFeatureKey, type CompareFeature } from './features';
import { pickSimilar, shortlistSimilar } from './similarity';
import type { CompareModel, CompareRoom } from './types';

/*
 * Server-only data loading for the comparison engine.
 *
 * Neither function ever throws: if anything goes wrong the comparison
 * is simply omitted, so a problem here can't take a page down.
 */

/*
 * ONE query: published rooms for a set of venues. The list query
 * behind fetchVenuesServer() doesn't include rooms. This is the same
 * public, RLS-protected read the venue page already makes
 * (venue_rooms, status = 'published'). On error returns {} so the
 * table is built without the rooms row rather than failing.
 */
async function fetchPublishedRooms(
  venueIds: string[]
): Promise<Record<string, CompareRoom[]>> {
  const rooms: Record<string, CompareRoom[]> = {};
  const ids = venueIds.filter(Boolean);
  if (ids.length === 0) return rooms;

  const { data, error } = await supabase
    .from('venue_rooms')
    .select('venue_id, name, source_url, sort_order')
    .in('venue_id', ids)
    .eq('status', 'published')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('compare rooms error:', error.message);
    return rooms;
  }

  for (const row of data ?? []) {
    (rooms[row.venue_id] ??= []).push({
      name: row.name,
      sourceUrl: row.source_url,
    });
  }

  return rooms;
}

/*
 * ONE query: verified amenities & services for a set of venues
 * (venue_features, status = 'published'; public RLS read, same
 * pattern as venue_rooms). Only rows that can be audited are used:
 * a known feature key, an http(s) source URL, a valid source type
 * and a verification date. Anything else is dropped. On error
 * (including the table not existing yet) returns {} so the table is
 * built without those rows rather than failing.
 */
const SOURCE_TYPES = new Set(['official', 'google', 'authoritative']);

function isHttpUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try {
    const { protocol } = new URL(value.trim());
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

export async function fetchPublishedFeatures(
  venueIds: string[]
): Promise<Record<string, CompareFeature[]>> {
  const features: Record<string, CompareFeature[]> = {};
  const ids = venueIds.filter(Boolean);
  if (ids.length === 0) return features;

  const { data, error } = await supabase
    .from('venue_features')
    .select('venue_id, feature_key, detail, source_url, source_type, verified_at')
    .in('venue_id', ids)
    .eq('status', 'published');

  if (error) {
    console.error('compare features error:', error.message);
    return features;
  }

  for (const row of data ?? []) {
    if (
      !isFeatureKey(row.feature_key) ||
      !isHttpUrl(row.source_url) ||
      !SOURCE_TYPES.has(row.source_type) ||
      !row.verified_at
    ) {
      continue;
    }

    (features[row.venue_id] ??= []).push({
      key: row.feature_key,
      detail: row.detail ?? null,
      sourceUrl: row.source_url,
      sourceType: row.source_type,
      verifiedAt: row.verified_at,
    });
  }

  return features;
}

/*
 * Database rows win. A venue the database has no rows for yet falls back
 * to the verified data bundled with the app (never to a guess).
 */
export function withBundledFallback(
  venues: Venue[],
  fromDb: Record<string, CompareFeature[]>
): Record<string, CompareFeature[]> {
  const merged = { ...fromDb };

  for (const venue of venues) {
    if (merged[venue.dbId]?.length) continue;

    const bundled = bundledFeatures(venue.id);
    if (bundled.length) merged[venue.dbId] = bundled;
  }

  return merged;
}

/*
 * Venue page: this venue + up to 3 comparable ones, chosen from the
 * venue list the page already loaded (no extra candidate query).
 */
export async function getComparison(
  current: Venue,
  allVenues: Venue[]
): Promise<CompareModel | null> {
  try {
    const shortlist = shortlistSimilar(current, allVenues);
    if (shortlist.length === 0) return null;

    const roomsByVenue = await fetchPublishedRooms(
      shortlist.map((v) => v.dbId)
    );
    roomsByVenue[current.dbId] = current.rooms.map((room) => ({
      name: room.name,
      sourceUrl: room.sourceUrl,
    }));

    const featuresByVenue = withBundledFallback(
      [current, ...shortlist],
      await fetchPublishedFeatures([
        current.dbId,
        ...shortlist.map((v) => v.dbId),
      ])
    );

    const similar = pickSimilar(
      current,
      shortlist,
      (venue) => (roomsByVenue[venue.dbId]?.length ?? 0) > 0
    );
    if (similar.length === 0) return null;

    return buildComparison(current, similar, roomsByVenue, featuresByVenue, {
      showPrice: SHOW_PUBLIC_STARTING_PRICE,
    });
  } catch (error) {
    console.error('getComparison failed:', error);
    return null;
  }
}

/*
 * /compare page: exactly the venues the visitor picked, in the order
 * they picked them. A row is shown if any selected venue has a value
 * (unlike the venue-page widget, the visitor chose these venues, so
 * we don't hide a row just because only one of them has data).
 */
export async function getSelectionComparison(
  selected: Venue[]
): Promise<CompareModel | null> {
  try {
    if (selected.length < 2) return null;

    const roomsByVenue = await fetchPublishedRooms(
      selected.map((v) => v.dbId)
    );

    const featuresByVenue = withBundledFallback(
      selected,
      await fetchPublishedFeatures(selected.map((v) => v.dbId))
    );

    return buildComparisonFor(selected, roomsByVenue, featuresByVenue, {
      showPrice: SHOW_PUBLIC_STARTING_PRICE,
      highlightFirst: false,
      minFilledPerRow: 1,
    });
  } catch (error) {
    console.error('getSelectionComparison failed:', error);
    return null;
  }
}
