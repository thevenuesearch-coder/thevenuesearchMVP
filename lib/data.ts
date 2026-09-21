/**
 * Shared venue types.
 *
 * Venue data itself now lives in Supabase (see lib/venues.ts for
 * the fetch helpers and /supabase/migration_venue_sync_and_hold_expiry.sql
 * for the schema). This file used to also export a hardcoded
 * `venues` array -- that array was the site's only source of venue
 * data and never matched what was actually in the database, so it
 * has been replaced by a live fetch. The original content is
 * preserved in scripts/venue-seed-data.mjs for the one-time
 * migration script.
 */

export type VenueSpace = {
  id: string;
  name: string;
  capacity: number;
  image: string;
  description: string;
  tags: string[];
};

export type Venue = {
  id: string;
  dbId: string;
  name: string;
  destination: string;
  city: string;
  country: string;
  type: string;
  capacity: number;
  price: number;
  hold: number | null;
  rating: number | null;
  verified: boolean;
  image: string;
  tags: string[];
  desc: string;
  venueSpaces: VenueSpace[];
};
