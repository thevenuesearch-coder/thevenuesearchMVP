/*
 * Shapes for the "Compare Similar Venues" table on the venue page.
 * Every value is either a verified/validated string or null -- null
 * renders as a blank cell. There is no "N/A" / "No" / "0" state.
 */

export type CompareCell = string | string[] | null;

export type CompareVenue = {
  id: string; /* public slug, same as Venue.id */
  name: string;
  location: string;
  image: string | null;
  startingPrice: string | null; /* only when SHOW_PUBLIC_STARTING_PRICE */
  rating: string | null;
  isCurrent: boolean;
};

/* How a row's values are drawn: plain text, a big number, pills, or stacked lines. */
export type CompareVariant = 'text' | 'stat' | 'chips' | 'lines';

export type CompareRow = {
  key: string;
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
