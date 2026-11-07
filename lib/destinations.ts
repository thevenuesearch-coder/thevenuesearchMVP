import type { Venue } from './data';
import { formatGuests, toCapacity } from './capacity';
import { clip } from './seo';

/*
 * Destination landing pages: /wedding-venues/[destination]
 *
 * Everything here is derived from the published venue records, so a
 * destination page exists exactly when venues are listed there, and
 * every number and name on it is real. Nothing is hard-coded per city.
 */

/* A page with fewer venues is thin content: reachable, but not indexed. */
export const MIN_VENUES_TO_INDEX = 2;

export type Destination = {
  slug: string;
  name: string;
  state: string;
  venues: Venue[];
};

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mostCommon(values: string[]): string {
  const counts = new Map<string, number>();

  for (const value of values) {
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return (
    [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
  );
}

/*
 * Group venues by their `destination` (the city or region couples
 * search for). Venues without a destination are left out; they stay
 * on Explore and in the sitemap as venue pages.
 */
export function buildDestinations(venues: Venue[]): Destination[] {
  const groups = new Map<string, Venue[]>();

  for (const venue of venues) {
    const name = (venue.destination || '').trim();
    if (!name) continue;

    const slug = slugify(name);
    if (!slug) continue;

    groups.set(slug, [...(groups.get(slug) ?? []), venue]);
  }

  return [...groups.entries()]
    .map(([slug, list]) => ({
      slug,
      name: mostCommon(list.map((v) => (v.destination || '').trim())),
      state: mostCommon(list.map((v) => (v.state || '').trim())),
      venues: list,
    }))
    .sort(
      (a, b) =>
        b.venues.length - a.venues.length || a.name.localeCompare(b.name)
    );
}

export function findDestination(
  venues: Venue[],
  slug: string
): Destination | null {
  return buildDestinations(venues).find((d) => d.slug === slug) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Grouping a destination's venues for the page                       */
/* ------------------------------------------------------------------ */

const PALACE = /palace|fort|heritage|haveli|mahal/i;
const RESORT = /resort|camp|retreat|sanctuary|village/i;
const HOTEL = /hotel|convention|banquet|boutique/i;

export type VenueGroup = {
  key: 'palace' | 'resort' | 'hotel' | 'other';
  heading: string;
  venues: Venue[];
};

/*
 * Splits a destination's venues by property type, using each venue's
 * own `type` label. Each venue appears once. When everything lands in
 * one group the page uses a single plain heading instead.
 */
export function groupVenues(destination: Destination): VenueGroup[] {
  const { name } = destination;

  const buckets: Record<VenueGroup['key'], Venue[]> = {
    palace: [],
    resort: [],
    hotel: [],
    other: [],
  };

  for (const venue of destination.venues) {
    const label = venue.type || '';

    if (PALACE.test(label)) buckets.palace.push(venue);
    else if (RESORT.test(label)) buckets.resort.push(venue);
    else if (HOTEL.test(label)) buckets.hotel.push(venue);
    else buckets.other.push(venue);
  }

  const groups: VenueGroup[] = (
    [
      ['palace', `Palace and heritage wedding venues in ${name}`],
      ['resort', `Wedding resorts in ${name}`],
      ['hotel', `Hotel wedding venues in ${name}`],
      ['other', `More wedding venues in ${name}`],
    ] as const
  )
    .map(([key, heading]) => ({ key, heading, venues: buckets[key] }))
    .filter((group) => group.venues.length > 0);

  if (groups.length === 1) {
    return [{ ...groups[0], heading: `Wedding venues in ${name}` }];
  }

  return groups;
}

/* ------------------------------------------------------------------ */
/*  Copy generated from the data                                       */
/* ------------------------------------------------------------------ */

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

type Facts = {
  count: number;
  kinds: string[];
  capacityMin: number | null;
  capacityMax: number | null;
  largest: Venue | null;
  spaces: number;
};

export function destinationFacts(destination: Destination): Facts {
  const { venues } = destination;

  const kinds: string[] = [];
  if (venues.some((v) => PALACE.test(v.type || ''))) kinds.push('palaces and heritage properties');
  if (venues.some((v) => RESORT.test(v.type || ''))) kinds.push('resorts');
  if (venues.some((v) => HOTEL.test(v.type || ''))) {
    kinds.push(
      venues.some((v) => /luxury/i.test(v.type || '')) ? 'luxury hotels' : 'hotels'
    );
  }

  const capacities = venues
    .map((v) => ({ v, n: toCapacity(v.capacity) }))
    .filter((x): x is { v: Venue; n: number } => x.n !== null);

  const sorted = [...capacities].sort((a, b) => b.n - a.n);

  return {
    count: venues.length,
    kinds,
    capacityMin: sorted.length >= 2 ? sorted[sorted.length - 1].n : null,
    capacityMax: sorted.length >= 1 ? sorted[0].n : null,
    largest: sorted[0]?.v ?? null,
    spaces: venues.reduce((n, v) => n + (v.venueSpaces?.length ?? 0), 0),
  };
}

export function destinationTitle(destination: Destination): string {
  return `Wedding Venues in ${destination.name}${
    destination.state && destination.state !== destination.name
      ? `, ${destination.state}`
      : ''
  }`;
}

export function destinationDescription(destination: Destination): string {
  const facts = destinationFacts(destination);
  const names = destination.venues.slice(0, 3).map((v) => v.name);
  const more = facts.count - names.length;

  const kinds = facts.kinds.length ? ` ${joinList(facts.kinds)}` : ' venues';
  const capacity =
    facts.capacityMax !== null
      ? ` Guest capacity up to ${formatGuests(facts.capacityMax)}.`
      : '';

  return clip(
    `Browse ${facts.count} verified wedding venues in ${destination.name}: ${joinList(names)}${
      more > 0 ? ` and ${more} more` : ''
    }.${kinds === ' venues' ? '' : ` Includes${kinds}.`}${capacity} Compare and enquire online.`,
    160
  );
}

/* Intro paragraphs for the page body. */
export function destinationIntro(destination: Destination): string[] {
  const facts = destinationFacts(destination);
  const where =
    destination.state && destination.state !== destination.name
      ? `${destination.name}, ${destination.state}`
      : destination.name;

  const first = `The Venue Search lists ${facts.count} wedding ${
    facts.count === 1 ? 'venue' : 'venues'
  } in ${where}${
    facts.kinds.length ? `, from ${joinList(facts.kinds)}` : ''
  }.${
    facts.spaces > 0
      ? ` Between them they list ${facts.spaces} event ${
          facts.spaces === 1 ? 'space' : 'spaces'
        }.`
      : ''
  }`;

  const paragraphs = [first];

  if (facts.capacityMax !== null && facts.largest) {
    paragraphs.push(
      facts.capacityMin !== null && facts.capacityMin !== facts.capacityMax
        ? `Published guest capacity runs from ${formatGuests(facts.capacityMin)} to ${formatGuests(facts.capacityMax)}, depending on the venue. ${facts.largest.name} lists the highest figure.`
        : `${facts.largest.name} lists a guest capacity of up to ${formatGuests(facts.capacityMax)}.`
    );
  }

  paragraphs.push(
    'Capacities are the largest figure each venue publishes. Confirm seating layouts, dates and pricing with the venue before you decide: send an enquiry, or place an Instant Hold on a date.'
  );

  return paragraphs;
}
