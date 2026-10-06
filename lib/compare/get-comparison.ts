import type { Venue } from '../data';
import { supabase } from '../supabase';
import { SHOW_PUBLIC_STARTING_PRICE } from '../../components/PublicVenueDetails';
import { buildComparison, buildComparisonFor } from './build';
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

    const similar = pickSimilar(
      current,
      shortlist,
      (venue) => (roomsByVenue[venue.dbId]?.length ?? 0) > 0
    );
    if (similar.length === 0) return null;

    return buildComparison(current, similar, roomsByVenue, {
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

    return buildComparisonFor(selected, roomsByVenue, {
      showPrice: SHOW_PUBLIC_STARTING_PRICE,
      highlightFirst: false,
      minFilledPerRow: 1,
    });
  } catch (error) {
    console.error('getSelectionComparison failed:', error);
    return null;
  }
}
