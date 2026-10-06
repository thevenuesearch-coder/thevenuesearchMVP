import type { MetadataRoute } from 'next';

import { fetchVenuesServer } from '../lib/venues';

/*
 * Regenerate hourly so newly published / unpublished venues reach
 * the sitemap without a redeploy (it was frozen at build time).
 */
export const revalidate = 3600;

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

  let venueEntries: MetadataRoute.Sitemap = [];

  try {
    const venues = await fetchVenuesServer();

    venueEntries = venues
      .filter((venue) => Boolean(venue.id))
      .map((venue) => ({
        url: `${BASE_URL}/venues/${encodeURIComponent(venue.id)}`,
        lastModified: venue.updatedAt
          ? new Date(venue.updatedAt)
          : undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
  } catch (error) {
    /*
     * If Supabase is temporarily unavailable, keep the sitemap
     * working with the public static pages instead of failing
     * the entire sitemap request.
     */

    console.error(
      'Sitemap: failed to load venues from Supabase:',
      error
    );
  }

  return [
    ...staticEntries,
    ...venueEntries,
  ];
}
