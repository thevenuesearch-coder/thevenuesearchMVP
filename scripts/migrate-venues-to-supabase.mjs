/**
 * One-time migration: pushes the real venue catalog (previously
 * hardcoded in lib/data.ts) into Supabase so the live site can
 * read venues from the database instead of a static file.
 *
 * Safe to re-run: every insert is an upsert keyed on slug, so
 * running this again just refreshes the same rows instead of
 * creating duplicates.
 *
 * Requires the schema extensions in
 * supabase/migration_venue_sync_and_hold_expiry.sql to already
 * be applied (it adds the columns this script writes to).
 *
 * Usage:
 *   1. Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and
 *      SUPABASE_SERVICE_ROLE_KEY set (the service role key is
 *      required — RLS blocks anonymous writes to venues).
 *   2. npm run migrate:venues
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { venueSeedData } from './venue-seed-data.mjs';

/*
 * Minimal .env.local loader (no extra dependency needed).
 * Only sets a variable if it isn't already set in the
 * environment, matching standard dotenv behavior.
 */
function loadEnvLocal() {
  if (!existsSync('.env.local')) return;

  const lines = readFileSync('.env.local', 'utf8').split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    '\nMissing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.\n' +
      'This script needs the service role key because Row Level\n' +
      'Security blocks anonymous writes to the venues table.\n'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function migrateVenue(venue) {
  const {
    id: slug,
    name,
    destination,
    city,
    country,
    type,
    capacity,
    price,
    hold,
    rating,
    verified,
    image,
    tags,
    desc,
    venueSpaces,
  } = venue;

  /*
   * Upsert the venue itself.
   */
  const { data: venueRow, error: venueError } = await supabase
    .from('venues')
    .upsert(
      {
        slug,
        name,
        destination,
        city,
        country,
        type,
        capacity_max: capacity,
        indicative_price: price || 0,
        hold_fee: hold,
        rating,
        verified,
        hero_image: image,
        tags,
        description: desc,
        status: 'published',
      },
      { onConflict: 'slug' }
    )
    .select('id, slug, name')
    .single();

  if (venueError) {
    console.error(`  ✗ Failed to upsert venue "${name}":`, venueError.message);
    return { venue: name, ok: false, error: venueError.message };
  }

  console.log(`  ✓ Venue: ${venueRow.name} (${venueRow.id})`);

  /*
   * Upsert each venue space, linked by venue_id.
   */
  let spaceErrors = 0;

  for (const space of venueSpaces || []) {
    const { error: spaceError } = await supabase.from('venue_spaces').upsert(
      {
        venue_id: venueRow.id,
        slug: space.id,
        name: space.name,
        capacity: space.capacity,
        space_type: null,
        image_url: space.image,
        description: space.description,
        tags: space.tags,
      },
      { onConflict: 'slug' }
    );

    if (spaceError) {
      spaceErrors += 1;
      console.error(
        `    ✗ Failed to upsert space "${space.name}":`,
        spaceError.message
      );
    }
  }

  if (spaceErrors === 0) {
    console.log(`    ✓ ${venueSpaces?.length || 0} spaces synced`);
  }

  return { venue: name, ok: spaceErrors === 0, spaceErrors };
}

async function main() {
  console.log(`\nMigrating ${venueSeedData.length} venues to Supabase...\n`);

  const results = [];

  for (const venue of venueSeedData) {
    results.push(await migrateVenue(venue));
  }

  const failed = results.filter((r) => !r.ok);

  console.log('\n----------------------------------------');
  console.log(`Done. ${results.length - failed.length}/${results.length} venues migrated cleanly.`);

  if (failed.length > 0) {
    console.log('\nVenues with errors:');
    failed.forEach((f) => console.log(`  - ${f.venue}`));
    process.exit(1);
  }

  console.log('\nYour site will now read these venues from Supabase.');
  console.log('Double check a few pages (/, /explore, a venue detail page) to confirm.\n');
}

main().catch((err) => {
  console.error('\nMigration script crashed:', err);
  process.exit(1);
});
