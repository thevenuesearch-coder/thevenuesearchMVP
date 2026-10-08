import registry from './features.json';

/*
 * Verified amenities & services shown in the comparison table.
 *
 * features.json is the single registry (also read by
 * scripts/seed-venue-features.mjs, which rejects unknown keys).
 * Adding a row to the comparison = add an entry there + verified
 * rows in venue_features. Nothing about any individual venue lives
 * in code.
 *
 * Absence semantics: a venue either has a verified venue_features
 * row for a key or it doesn't. There is no negative value anywhere.
 */

export type FeatureGroup = 'amenities' | 'wedding' | 'services';

export type FeatureDef = {
  key: string;
  label: string;
  group: FeatureGroup;
};

export const FEATURE_DEFS = registry as FeatureDef[];

const KEYS = new Set(FEATURE_DEFS.map((def) => def.key));

export function isFeatureKey(value: unknown): value is string {
  return typeof value === 'string' && KEYS.has(value);
}

/*
 * One verified fact about one venue, as read from venue_features.
 * sourceUrl / sourceType / verifiedAt stay on the server model so a
 * cell can be audited; the table itself does not print them.
 */
export type CompareFeature = {
  key: string;
  detail: string | null;
  sourceUrl: string;
  sourceType: 'official' | 'google' | 'authoritative';
  verifiedAt: string;
};
