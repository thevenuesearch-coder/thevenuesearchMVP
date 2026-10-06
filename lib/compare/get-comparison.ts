import type { Venue } from '../data';
import { supabase } from '../supabase';
import { SHOW_PUBLIC_STARTING_PRICE } from '../../components/PublicVenueDetails';
import { buildComparison } from './build';
import { pickSimilar, shortlistSimilar } from './similarity';
import type { CompareModel, CompareRoom } from './types';

/*
 * Server-only. Builds the "Compare Similar Venues" model for a venue
 * page.
 *
 * Reuses data the page already has: the current venue (with its
 * published rooms) and the full published-venue list. The only extra
 * request is ONE query for the published rooms of a short list of
 * candidates -- the list query doesn't include rooms. That query is
 * the same public, RLS-protected read the venue page already makes
 * (venue_rooms, status = 'published').
 *
 * It never throws: if anything goes wrong the comparison is simply
 * omitted, so a problem here can't take a venue page down.
 */
export async function getComparison(
  current: Venue,
  allVenues: Venue[]
): Promise<CompareModel | null> {
  try {
    const shortlist = shortlistSimilar(current, allVenues);
    if (shortlist.length === 0) return null;

    const roomsByVenue: Record<string, CompareRoom[]> = {
      [current.dbId]: current.rooms.map((room) => ({
        name: room.name,
        sourceUrl: room.sourceUrl,
      })),
    };

    const { data, error } = await supabase
      .from('venue_rooms')
      .select('venue_id, name, source_url, sort_order')
      .in('venue_id', shortlist.map((v) => v.dbId))
      .eq('status', 'published')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('getComparison rooms error:', error.message);
    } else {
      for (const row of data ?? []) {
        (roomsByVenue[row.venue_id] ??= []).push({
          name: row.name,
          sourceUrl: row.source_url,
        });
      }
    }

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
