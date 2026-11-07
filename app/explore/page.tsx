import type { Metadata } from 'next';
import { pageMetadata } from '../../lib/seo';

import {
  fetchVenuesResultServer,
  toVenueSummary,
} from '../../lib/venues';
import { ExploreClient } from '../../components/ExploreClient';
import {
  buildVenueListJsonLd,
  serializeJsonLd,
} from '../../lib/structured-data';

export const metadata: Metadata = pageMetadata({
  title: 'Explore Wedding Venues',
  description:
    'Browse verified destination wedding venues by location, venue type and guest capacity. Palaces, luxury hotels and resorts across Hyderabad and India.',
  path: '/explore',
});

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
  const { venues, failed } = await fetchVenuesResultServer();

  /*
   * Could not reach the database: answer with a server error (search
   * engines retry those) instead of a 200 page that says "0 venues",
   * which would be indexed as an empty page.
   */
  if (failed) {
    throw new Error('Venue data is temporarily unavailable.');
  }

  const error = '';

  const listJsonLd = buildVenueListJsonLd(venues);

  return (
    <>
      {listJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(listJsonLd),
          }}
        />
      )}

      <ExploreClient
        initialVenues={venues.map(toVenueSummary)}
        initialError={error}
      />
    </>
  );
}
