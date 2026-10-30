import type { Metadata } from 'next';
import { pageMetadata } from '../lib/seo';
import Link from 'next/link';

import {
  fetchVenuesServer,
  toVenueSummary,
} from '../lib/venues';
import { VenueCard } from '../components/VenueCard';
import { HeroSearchBox } from '../components/HeroSearchBox';
import { CompareGlance } from '../components/home/CompareGlance';
import { JourneyShowcase } from '../components/home/JourneyShowcase';
import { HeroCollage } from '../components/home/HeroCollage';
import { imgProps, optimizedUrl } from '../lib/image';

export const metadata: Metadata = pageMetadata({
  title: 'Verified Destination Wedding Venues in Hyderabad & India',
  description:
    'Find and book verified destination wedding venues, palaces and luxury hotels in Hyderabad and across India. Transparent decisions, instant holds, and a booking journey built around certainty.',
  path: '/',
});

/*
 * Rendered per-request rather than statically at build time --
 * venues come from Supabase and can change at any time (new
 * venues published, images updated), so this must always fetch
 * fresh data, matching the cache: 'no-store' the old client-side
 * fetch used.
 */
export const dynamic = 'force-dynamic';

/*
 * Server Component: venues are fetched here, server-side, so the
 * featured-venues grid and the collections strip are present in
 * the actual HTML response -- real content for search engines and
 * anyone whose JavaScript is slow or unavailable, rather than the
 * "Loading venues…" placeholder that used to be all a crawler (or
 * this page's own SSR output) ever saw. Only the interactive
 * search box (which needs client state) is a separate client
 * component; everything else here renders on the server.
 */
export default async function Home() {
  const venues = await fetchVenuesServer();
  const preferredFeaturedNames = ['Wildflower Hall, An Oberoi Resort', 'JW Marriott Mussoorie Walnut Grove Resort & Spa', 'Taj Fateh Prakash Palace'];
  const preferredFeatured = preferredFeaturedNames.flatMap((name) => {
    const venue = venues.find((item) => item.name === name);
    return venue ? [venue] : [];
  });
  const featuredVenues = preferredFeatured.length === 3 ? preferredFeatured : venues.filter((venue) => !['T-Hub', 'Ramoji Film City Hyderabad', 'Taj Rishikesh Resort & Spa'].includes(venue.name)).slice(0, 3);

  return (
    <main id="main-content">
      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="heroV2">
        <div className="heroV2Inner">
          <HeroSearchBox
            venues={venues.map(({ id, name, destination, state }) => ({
              id,
              name,
              destination,
              state,
            }))}
          />

          <HeroCollage
            venues={[
              ...[
                'Taj Rishikesh Resort & Spa',
                'Wildflower Hall, An Oberoi Resort',
                'Taj Fateh Prakash Palace',
                'Six Senses Fort Barwara',
              ].flatMap((name) => {
                const v = venues.find((item) => item.name === name);
                return v && v.image ? [{ id: v.id, name: v.name, image: v.image }] : [];
              }),
            ]}
          />
        </div>
      </section>

      {/* =====================================================
          COMPARE VENUES AT A GLANCE
          (replaces the former "Venue discovery shouldn't feel
          like a negotiation" statistics section)
      ===================================================== */}

      <CompareGlance />

      {/* =====================================================
          FEATURED VENUES
      ===================================================== */}

      <section className="darkSection">
        <div className="sectionHead">
          <div>
            <span className="kicker">
              CURATED FOR THE DESTINATION WEDDING
            </span>

            <h2>Discover beautiful venues.</h2>
          </div>

          <Link href="/explore">View all venues →</Link>
        </div>

        {venues.length === 0 ? (
          <div className="emptyState">
            <p>No venues are published yet — check back soon.</p>
          </div>
        ) : (
          <div className="venueGrid">
            {featuredVenues.map((v) => (
              <VenueCard
                key={v.id}
                v={{
                  ...toVenueSummary(v),
                  slug: v.id,
                  description: v.desc,
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          EXPERIENCE -- the search-to-certainty journey
      ===================================================== */}

      <JourneyShowcase />

      {/* =====================================================
          COLLECTIONS
      ===================================================== */}

      <section className="collections">
        <span className="kicker">INSPIRE THE DECISION</span>

        <h2>Start with a feeling.</h2>

        <div className="collectionRow">
          {venues.slice(0, 4).map((v, index) => (
            <Link
              href={`/venues/${v.id}`}
              className="collection"
              key={v.id}
            >
              {v.image && (
                <img
                  {...imgProps(v.image, v.name, {
                    width: 300,
                    height: 420,
                    sizes: '300px',
                  })}
                />
              )}

              <div>
                <small>0{index + 1}</small>
                <h3>{v.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
