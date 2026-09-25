import type { Metadata } from 'next';
import Link from 'next/link';

import { fetchVenuesServer } from '../lib/venues';
import { VenueCard } from '../components/VenueCard';
import { HeroSearchBox } from '../components/HeroSearchBox';

export const metadata: Metadata = {
  title: 'Verified Destination Wedding Venues in Hyderabad & India',
  description:
    'Find and book verified destination wedding venues, palaces and luxury hotels in Hyderabad and across India. Transparent decisions, instant holds, and a booking journey built around certainty.',
};

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
    <main>
      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="hero">
        <div className="heroVideo">
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={venues[0]?.image}
            src={
              process.env.NEXT_PUBLIC_HERO_VIDEO_URL || undefined
            }
          />
        </div>

        <div className="heroShade" />

        <div className="heroContent">
          <HeroSearchBox venues={venues} />
        </div>

        <div className="heroNote">
          A trusted infrastructure layer for weddings & events
          <span>•</span>
          Destination venues across India & beyond
        </div>
      </section>

      {/* =====================================================
          STATEMENT
      ===================================================== */}

      <section className="statement">
        <span className="kicker">WHY VENUE SEARCH</span>

        <h2>
          Venue discovery shouldn't feel like a negotiation.
        </h2>

        <p>
          Today, couples and planners face fragmented listings,
          opaque quotes, unverified information and manual
          coordination. We turn that chaos into a clear,
          data-backed decision journey.
        </p>

        <div className="stats">
          <div>
            <strong>30–40%</strong>
            <span>planning time saved</span>
          </div>

          <div>
            <strong>100%</strong>
            <span>verified-first approach</span>
          </div>

          <div>
            <strong>0</strong>
            <span>double-booking tolerance</span>
          </div>
        </div>
      </section>

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
                  ...v,
                  slug: v.id,
                  capacityMin: v.capacity,
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
              {v.image && <img src={v.image} alt={v.name} />}

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
