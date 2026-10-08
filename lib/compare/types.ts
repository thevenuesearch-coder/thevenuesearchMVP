/*
 * Shapes for the "Compare Similar Venues" table on the venue page.
 * Every value is either a verified/validated string or null -- null
 * renders as a blank cell. There is no "N/A" / "No" / "0" state.
 */

/*
 * `true` = a verified yes (rendered as a check). There is deliberately
 * no `false`: an unverified or unavailable detail is `null` (blank).
 */
export type CompareCell = string | string[] | true | null;

export type CompareVenue = {
  id: string; /* public slug, same as Venue.id */
  name: string;
  location: string;
  image: string | null;
  startingPrice: string | null; /* only when SHOW_PUBLIC_STARTING_PRICE */
  rating: string | null;
  isCurrent: boolean;
};

/* How a row's values are drawn: plain text, a big number, pills, stacked lines, or a check. */
export type CompareVariant = 'text' | 'stat' | 'chips' | 'lines' | 'check';

/* Table sections, in display order. */
export type CompareGroup =
  | 'overview'
  | 'accommodation'
  | 'spaces'
  | 'amenities'
  | 'dining'
  | 'wedding'
  | 'services';

export const COMPARE_GROUP_LABELS: Record<CompareGroup, string> = {
  overview: 'Venue Overview',
  accommodation: 'Accommodation',
  spaces: 'Event Spaces',
  amenities: 'Amenities',
  dining: 'Dining',
  wedding: 'Wedding & Event Services',
  services: 'Services',
};

export type CompareRow = {
  key: string;
  group: CompareGroup;
  label: string;
  variant: CompareVariant;
  cells: CompareCell[]; /* same order and length as venues */
};

export type CompareModel = {
  venues: CompareVenue[]; /* current venue is always first */
  rows: CompareRow[];
};

/* A room category plus where its details were sourced from. */
export type CompareRoom = {
  name: string;
  sourceUrl: string | null;
};
