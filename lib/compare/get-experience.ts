import type { Venue } from '../data';
import { SHOW_PUBLIC_STARTING_PRICE } from '../../components/PublicVenueDetails';
import { buildExperience, type XModel } from './experience';
import {
  fetchPublishedFeatures,
  fetchPublishedRooms,
  withBundledFallback,
} from './get-comparison';

/*
 * Server-only loader for the /compare experience.
 *
 * Reuses the same two public reads the existing comparison already
 * makes (published rooms, verified features) -- no new queries, no
 * schema changes. Never throws: on any failure the comparison is
 * simply omitted and the page shows its normal empty state.
 */
export async function getExperienceComparison(
  selected: Venue[]
): Promise<XModel | null> {
  try {
    if (selected.length < 2) return null;

    const ids = selected.map((venue) => venue.dbId);

    const [roomsByVenue, featuresFromDb] = await Promise.all([
      fetchPublishedRooms(ids),
      fetchPublishedFeatures(ids),
    ]);

    return buildExperience(
      selected,
      roomsByVenue,
      withBundledFallback(selected, featuresFromDb),
      { showPrice: SHOW_PUBLIC_STARTING_PRICE }
    );
  } catch (error) {
    console.error('getExperienceComparison failed:', error);
    return null;
  }
}
