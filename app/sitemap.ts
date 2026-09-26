import type { MetadataRoute } from 'next';

import { fetchVenuesServer } from '../lib/venues';

const BASE_URL = 'https://venuesearch.in';

const staticRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1.0, changeFrequency: 'daily' },
  { path: '/explore', priority: 0.9, changeFrequency: 'daily' },
  { path: '/wedding-venues', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/collections', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/how-it-works', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/for-venues', priority: 0.6, changeFrequency: 'monthly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${BASE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  let venueEntries: MetadataRoute.Sitemap = [];
  try {
    const venues = await fetchVenuesServer();
    venueEntries = venues.map((v) => ({
      url: `${BASE_URL}/venues/${v.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch {
    // If Supabase is unreachable at build/request time, still ship the
    // static routes rather than failing the whole sitemap.
    venueEntries = [];
  }

  return [...staticEntries, ...venueEntries];
}
