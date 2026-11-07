import type { MetadataRoute } from 'next';

import { fetchVenuesResultServer } from '../lib/venues';
import { MIN_VENUES_TO_INDEX, buildDestinations } from '../lib/destinations';

/*
 * Generated per request (from the cached venue list, so this is cheap)
 * rather than at build time: a deploy must never depend on the
 * database being reachable, and new venues should appear in the
 * sitemap without a redeploy.
 */
export const dynamic = 'force-dynamic';

const BASE_URL = 'https://venuesearch.in';
 
const staticRoutes: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
}[] = [
  {
    path: '/',
    priority: 1.0,
    changeFrequency: 'daily',
  },
  {
    path: '/explore',
    priority: 0.9,
    changeFrequency: 'daily',
  },
  {
    path: '/wedding-venues',
    priority: 0.9,
    changeFrequency: 'weekly',
  },
  {
    path: '/compare',
    priority: 0.6,
    changeFrequency: 'monthly',
  },
  {
    path: '/collections',
    priority: 0.8,
    changeFrequency: 'weekly',
  },
  {
    path: '/how-it-works',
    priority: 0.7,
    changeFrequency: 'monthly',
  },
  {
    path: '/for-venues',
    priority: 0.7,
    changeFrequency: 'monthly',
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /*
   * Public static pages.
   *
   * We intentionally do NOT include:
   * /admin
   * /login
   * /profile
   * /planner
   * /wishlist
   * /book/*
   * /enquiry
   * /api/*
   *
   * These pages are private, transactional, authenticated,
   * or otherwise not useful as public search results.
   */

  const staticEntries: MetadataRoute.Sitemap =
    staticRoutes.map((route) => ({
      url: `${BASE_URL}${route.path}`,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }));

  /*
   * Dynamically add all published venues from Supabase.
   *
   * fetchVenuesServer() already filters venues using:
   * status = 'published'
   *
   * Therefore draft/unpublished venues will not appear
   * in the sitemap.
   */

  const { venues, failed } = await fetchVenuesResultServer();

  /*
   * If the venue list could not be loaded, fail the request (search
   * engines retry a 5xx) instead of publishing a sitemap with every
   * venue missing, which looks like a mass removal.
   */
  if (failed) {
    throw new Error('Sitemap: venue data is temporarily unavailable.');
  }

  const venueEntries: MetadataRoute.Sitemap = venues
    .filter((venue) => Boolean(venue.id))
    .map((venue) => ({
      url: `${BASE_URL}/venues/${encodeURIComponent(venue.id)}`,
      lastModified: venue.updatedAt ? new Date(venue.updatedAt) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  /*
   * Destination landing pages, only where there are enough venues
   * for the page to be worth indexing (the pages themselves are
   * marked noindex below that threshold).
   */
  const destinationEntries: MetadataRoute.Sitemap = buildDestinations(venues)
    .filter((destination) => destination.venues.length >= MIN_VENUES_TO_INDEX)
    .map((destination) => {
      const dates = destination.venues
        .map((venue) => (venue.updatedAt ? Date.parse(venue.updatedAt) : NaN))
        .filter((time) => Number.isFinite(time));

      return {
        url: `${BASE_URL}/wedding-venues/${destination.slug}`,
        lastModified: dates.length ? new Date(Math.max(...dates)) : undefined,
        changeFrequency: 'weekly' as const,
        priority: destination.slug === 'hyderabad' ? 0.9 : 0.8,
      };
    });

  return [
    ...staticEntries,
    ...destinationEntries,
    ...venueEntries,
  ];
}
