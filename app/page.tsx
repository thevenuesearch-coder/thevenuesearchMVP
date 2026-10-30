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
import { DestinationsSection } from '../components/home/DestinationsSection';
import { CollectionsSection } from '../components/home/CollectionsSection';
import { PartnerCta } from '../components/home/PartnerCta';
import { Marquee } from '../components/home/Marquee';
import { SectionHead } from '../components/home/SectionHead';
import { MotionRoot } from '../components/collections/MotionRoot';
import { Reveal } from '../components/collections/Reveal';
import { imgProps, optimizedUrl, isOptimizable } from '../lib/image';

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
      <MotionRoot>
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
                'Six Senses Fort Barwara',
                'Wildflower Hall, An Oberoi Resort',
                'Taj Fateh Prakash Palace',
                'JW Marriott Mussoorie Walnut Grove Resort & Spa',
              ].flatMap((name) => {
                const v = venues.find((item) => item.name === name);
                return v && isOptimizable(v.image) ? [{ id: v.id, name: v.name, image: v.image }] : [];
              }),
            ]}
          />
        </div>
      </section>

      <Marquee items={['Destination weddings','Luxury palaces','Heritage hotels','Beachfront venues','Hill resorts','Hold your date']} />

      <DestinationsSection
        venues={venues.map(({ id, name, destination, state, image }) => ({ id, name, destination, state, image }))}
      />

      <CollectionsSection
        venues={venues.map(({ id, name, type, tags, image }) => ({ id, name, type, tags: tags || [], image }))}
      />

      {/* FEATURED VENUES — real VenueCard components */}
      <section className="edSection edCream" aria-labelledby="explore-title">
        <div className="edWrap">
          <Reveal>
            <SectionHead
              id="explore-title"
              index="03"
              label="Explore"
              title={<>Venues worth <em>the journey.</em></>}
              blurb="Discover and filter verified venues across India."
              href="/explore"
              hrefLabel="All venues"
            />
          </Reveal>

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
        </div>
      </section>

      <div className="vsWhiteWrap">
        <CompareGlance />
      </div>

      {/* LOCKED: approved "Discover. Compare. Hold. Book." section — unchanged */}
      <JourneyShowcase />

      <PartnerCta
        image={(venues.find((v) => v.name === 'Taj Lake Palace') || venues.find((v) => isOptimizable(v.image)))?.image}
        imageAlt="Taj Lake Palace"
      />
      </MotionRoot>
    </main>
  );
}
