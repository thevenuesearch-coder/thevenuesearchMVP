import type { Metadata } from 'next';

import { fetchVenuesServer } from '../../lib/venues';
import { ExploreClient } from '../../components/ExploreClient';

export const metadata: Metadata = {
  title: 'Explore Wedding Venues',
  description:
    'Browse verified destination wedding venues by location, venue type and guest capacity. Palaces, luxury hotels and resorts across Hyderabad and India.',
};

/*
 * Rendered per-request rather than statically at build time --
 * see app/page.tsx for why.
 */
export const dynamic = 'force-dynamic';

/*
 * Server Component: fetches venues server-side so the grid is
 * present in the initial HTML (search engines, slow-JS clients)
 * instead of the client-only fetch this page used to do. All the
 * interactive filtering (destination/venue type/capacity, URL
 * sync, reset) lives in ExploreClient, unchanged in behavior --
 * only where the data comes from changed.
 */
export default async function ExplorePage() {
  let venues: Awaited<ReturnType<typeof fetchVenuesServer>> = [];
  let error = '';

  try {
    venues = await fetchVenuesServer();
  } catch (err) {
    console.error('Failed to load venues:', err);
    error =
      'We could not load venues right now. Please refresh the page.';
  }

  return (
    <ExploreClient initialVenues={venues} initialError={error} />
  );
}
