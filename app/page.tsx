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

  return (
    <main id="main-content">
      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="hero">
        <div className="heroVideo">
          <video
            aria-hidden="true"
            tabIndex={-1}
            autoPlay
            muted
            loop
            playsInline
            poster={
              venues[0]?.image
                ? optimizedUrl(venues[0].image, 1080)
                : undefined
            }
            src={
              process.env.NEXT_PUBLIC_HERO_VIDEO_URL || undefined
            }
          />
        </div>

        <div className="heroShade" />

        <div className="heroContent">
          <HeroSearchBox
            venues={venues.map(({ id, name, destination }) => ({
              id,
              name,
              destination,
            }))}
          />
        </div>

        <div className="heroNote">
          A trusted infrastructure layer for weddings & events
          <span>•</span>
          Destination venues across India & beyond
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
            {venues.slice(0, 3).map((v) => (
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
          EXPERIENCE
      ===================================================== */}

      <section className="experience">
        <div className="experienceText">
          <span className="kicker">FROM SEARCH TO CERTAINTY</span>

          <h2>Discover. Compare. Hold. Book.</h2>

          <p>
            One wedding view connects the main venue with
            mehendi, sangeet and haldi spaces. Enquiries, Instant
            Holds and Instant Books stay clearly separated so
            every decision has a defined next step.
          </p>

          <Link
            data-cursor="view"
            className="outlineBtn"
            href="/how-it-works"
          >
            See how it works
          </Link>
        </div>

        <div className="orbit">
          <div className="orbitCenter">TVS</div>

          <span>
            01
            <br />
            <b>Discover</b>
          </span>

          <span>
            02
            <br />
            <b>Compare</b>
          </span>

          <span>
            03
            <br />
            <b>Hold</b>
          </span>

          <span>
            04
            <br />
            <b>Confirm</b>
          </span>
        </div>
      </section>

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
