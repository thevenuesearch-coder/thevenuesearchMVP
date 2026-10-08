import bundled from './verified-features.json';
import { isFeatureKey, type CompareFeature } from './features';

/*
 * Verified amenities & services shipped with the app, generated from
 * scripts/venue-features-data.mjs (`npm run seed:features -- --json`).
 * Same rules as the database rows: every fact has a source URL, source
 * type and verification date, and anything unverified is simply absent.
 *
 * Used for a venue ONLY while the venue_features table has no rows for
 * it; as soon as the database has rows for that venue, they win.
 */

const SOURCE_TYPES = new Set(['official', 'google', 'authoritative']);

export function bundledFeatures(slug: string): CompareFeature[] {
  const rows = (bundled as Record<string, unknown>)[slug];
  if (!Array.isArray(rows)) return [];

  return rows.filter(
    (row): row is CompareFeature =>
      !!row &&
      isFeatureKey((row as CompareFeature).key) &&
      typeof (row as CompareFeature).sourceUrl === 'string' &&
      /^https?:\/\//i.test((row as CompareFeature).sourceUrl) &&
      SOURCE_TYPES.has((row as CompareFeature).sourceType) &&
      !!(row as CompareFeature).verifiedAt
  );
}
