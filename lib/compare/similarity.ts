import type { Venue } from '../data';

/*
 * Picks genuinely comparable venues. Pure functions, no I/O.
 *
 * Score (0..1) = weighted blend of:
 *   location        30%  same city 1.0, same destination 0.7
 *   venue type      25%  same type 1.0, shared noun ("palace") 0.75,
 *                        both stay-style properties 0.4
 *   guest capacity  20%  min/max ratio of the maximum capacities
 *   price range     15%  min/max ratio of indicative prices
 *                        (used for ranking only -- never displayed here)
 *   accommodation   10%  both venues have published room categories
 *
 * A dimension where either venue has no data is skipped and the
 * remaining weights are renormalised, so missing data is never
 * treated as a match or a mismatch. Accommodation can only add to a
 * score: "no published rooms" means unknown, not "no accommodation".
 */

const WEIGHTS = {
  location: 0.3,
  type: 0.25,
  capacity: 0.2,
  price: 0.15,
  accommodation: 0.1,
};

const STAY_NOUNS = ['palace', 'resort', 'hotel', 'fort', 'haveli', 'villa', 'lodge'];
const OTHER_NOUNS = ['farmhouse', 'farm', 'banquet', 'lawn', 'garden', 'beach'];
const ALL_NOUNS = [...STAY_NOUNS, ...OTHER_NOUNS];

const norm = (s?: string | null) => (s ?? '').trim().toLowerCase();
const positive = (n?: number | null): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n > 0;
const ratio = (a: number, b: number) => Math.min(a, b) / Math.max(a, b);

function locationScore(a: Venue, b: Venue): number | null {
  const cityA = norm(a.city);
  const cityB = norm(b.city);
  if (cityA && cityB) {
    if (cityA === cityB) return 1;
  }
  const destA = norm(a.destination);
  const destB = norm(b.destination);
  if (destA && destB && destA === destB) return 0.7;
  return cityA && cityB ? 0 : destA && destB ? 0 : null;
}

function typeScore(a: Venue, b: Venue): number | null {
  const x = norm(a.type);
  const y = norm(b.type);
  if (!x || !y) return null;
  if (x === y) return 1;
  const nounsX = ALL_NOUNS.filter((n) => x.includes(n));
  const nounsY = ALL_NOUNS.filter((n) => y.includes(n));
  if (nounsX.some((n) => nounsY.includes(n))) return 0.75;
  const stayX = nounsX.some((n) => STAY_NOUNS.includes(n));
  const stayY = nounsY.some((n) => STAY_NOUNS.includes(n));
  return stayX && stayY ? 0.4 : 0;
}

export type RoomPresence = { current: boolean; candidate: boolean };

export function similarityScore(
  current: Venue,
  candidate: Venue,
  rooms?: RoomPresence
): number {
  const dims: Array<[number, number | null]> = [
    [WEIGHTS.location, locationScore(current, candidate)],
    [WEIGHTS.type, typeScore(current, candidate)],
    [
      WEIGHTS.capacity,
      positive(current.capacity) && positive(candidate.capacity)
        ? ratio(current.capacity, candidate.capacity)
        : null,
    ],
    [
      WEIGHTS.price,
      positive(current.price) && positive(candidate.price)
        ? ratio(current.price, candidate.price)
        : null,
    ],
    [
      WEIGHTS.accommodation,
      rooms && rooms.current && rooms.candidate ? 1 : null,
    ],
  ];

  const known = dims.filter((d): d is [number, number] => d[1] !== null);
  const totalWeight = known.reduce((sum, [w]) => sum + w, 0);

  return totalWeight === 0
    ? 0
    : known.reduce((sum, [w, v]) => sum + w * v, 0) / totalWeight;
}

/* Never the current venue; no duplicates by slug or database id. */
function eligible(current: Venue, pool: Venue[]): Venue[] {
  const ids = new Set<string>([current.id]);
  const dbIds = new Set<string>(current.dbId ? [current.dbId] : []);
  const out: Venue[] = [];

  for (const venue of pool) {
    if (ids.has(venue.id) || (venue.dbId && dbIds.has(venue.dbId))) continue;
    ids.add(venue.id);
    if (venue.dbId) dbIds.add(venue.dbId);
    out.push(venue);
  }

  return out;
}

const byScoreThenId = (
  a: { v: Venue; score: number },
  b: { v: Venue; score: number }
) => b.score - a.score || a.v.id.localeCompare(b.v.id);

/*
 * Stage 1: rank on data we already have (the list query does not
 * include rooms) and keep a short list, so rooms are fetched for a
 * handful of venues instead of all of them.
 */
export function shortlistSimilar(
  current: Venue,
  pool: Venue[],
  size = 8
): Venue[] {
  return eligible(current, pool)
    .map((v) => ({ v, score: similarityScore(current, v) }))
    .sort(byScoreThenId)
    .slice(0, size)
    .map((x) => x.v);
}

/*
 * Stage 2: final ranking, now with room data. Venues below
 * `minScore` are dropped so a weak match is never presented as
 * "similar" just to fill a column.
 */
export function pickSimilar(
  current: Venue,
  shortlist: Venue[],
  roomsPresent: (venue: Venue) => boolean,
  { limit = 3, minScore = 0.35 }: { limit?: number; minScore?: number } = {}
): Venue[] {
  const currentHasRooms = roomsPresent(current);

  return eligible(current, shortlist)
    .map((v) => ({
      v,
      score: similarityScore(current, v, {
        current: currentHasRooms,
        candidate: roomsPresent(v),
      }),
    }))
    .filter((x) => x.score >= minScore)
    .sort(byScoreThenId)
    .slice(0, limit)
    .map((x) => x.v);
}
