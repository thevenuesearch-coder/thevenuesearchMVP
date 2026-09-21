'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';

import { venues } from '../lib/data';
import { VenueCard } from '../components/VenueCard';

export default function Home() {
  const [destination, setDestination] = useState('');
  const [venue, setVenue] = useState('');
  const [guests, setGuests] = useState('');

  /*
   * =====================================================
   * DESTINATIONS
   * =====================================================
   *
   * Get the destinations directly from the venue data.
   * This keeps the destination list synchronized with
   * the venues available on the platform.
   */

  const destinations = Array.from(
    new Set(
      venues
        .map((v) => v.destination)
        .filter(Boolean)
    )
  );

  /*
   * =====================================================
   * FILTER VENUES BY DESTINATION
   * =====================================================
   *
   * When a destination is selected, only venues from
   * that destination will appear in the Venue dropdown.
   */

  const destinationVenues = destination
    ? venues.filter(
        (v) =>
          v.destination === destination
      )
    : venues;

  /*
   * =====================================================
   * SELECTED VENUE
   * =====================================================
   */

  const selectedVenue =
    destinationVenues.find(
      (v) => v.id === venue
    );

  /*
   * =====================================================
   * EXPLORE URL
   * =====================================================
   */

  const exploreHref =
    `/explore?destination=${encodeURIComponent(
      destination
    )}` +
    `${venue ? `&venue=${encodeURIComponent(venue)}` : ''}` +
    `${guests ? `&guests=${encodeURIComponent(guests)}` : ''}`;

  /*
   * =====================================================
   * DESTINATION CHANGE
   * =====================================================
   *
   * When the destination changes, reset the selected
   * venue because the previous venue may belong to
   * another destination.
   */

  function handleDestinationChange(
    value: string
  ) {
    setDestination(value);
    setVenue('');
  }

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
              process.env.NEXT_PUBLIC_HERO_VIDEO_URL ||
              undefined
            }
          />
        </div>

        <div className="heroShade" />

        <div className="heroContent">
          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
            }}
          >
            <span className="kicker">
              THE NEW STANDARD FOR VENUE DISCOVERY
            </span>

            <h1>
              Find the place
              <br />
              <em>
                your story deserves.
              </em>
            </h1>

            <p>
              Verified destination wedding venues,
              transparent decisions and a booking journey
              built around certainty.
            </p>

            {/* =================================================
                HERO SEARCH
            ================================================= */}

            <div className="searchBox">

              {/* =================================================
                  DESTINATION
              ================================================= */}

              <div>
                <small>
                  Destination
                </small>

                <select
                  value={destination}
                  onChange={(e) =>
                    handleDestinationChange(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    All destinations
                  </option>

                  {destinations.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* =================================================
                  VENUE
              ================================================= */}

              <div>
                <small>
                  Venue
                </small>

                <select
                  value={venue}
                  onChange={(e) =>
                    setVenue(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    {destination
                      ? `All ${destination} venues`
                      : 'All venues'}
                  </option>

                  {destinationVenues.map(
                    (v) => (
                      <option
                        key={v.id}
                        value={v.id}
                      >
                        {v.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* =================================================
                  GUESTS
              ================================================= */}

              <div>
                <small>
                  Guests
                </small>

                <select
                  value={guests}
                  onChange={(e) =>
                    setGuests(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Guest count
                  </option>

                  <option value="50–100">
                    50–100
                  </option>

                  <option value="100–200">
                    100–200
                  </option>

                  <option value="200–400">
                    200–400
                  </option>

                  <option value="400–600">
                    400–600
                  </option>

                  <option value="600+">
                    600+
                  </option>
                </select>
              </div>

              {/* =================================================
                  EXPLORE BUTTON
              ================================================= */}

              <Link
                data-cursor="open"
                className="primaryBtn large"
                href={
                  selectedVenue
                    ? `/venues/${selectedVenue.id}`
                    : exploreHref
                }
              >
                Explore venues →
              </Link>
            </div>
          </motion.div>
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
        <span className="kicker">
          WHY VENUE SEARCH
        </span>

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
            <strong>
              30–40%
            </strong>

            <span>
              planning time saved
            </span>
          </div>

          <div>
            <strong>
              100%
            </strong>

            <span>
              verified-first approach
            </span>
          </div>

          <div>
            <strong>
              0
            </strong>

            <span>
              double-booking tolerance
            </span>
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

            <h2>
              Discover beautiful venues.
            </h2>
          </div>

          <Link href="/explore">
            View all venues →
          </Link>
        </div>

        <div className="venueGrid">
          {venues
            .slice(0, 3)
            .map((v) => (
              <VenueCard
                key={v.id}
                v={{
                  ...v,
                  slug: v.id,
                  capacityMin:
                    v.capacity,
                  description:
                    v.desc,
                }}
              />
            ))}
        </div>
      </section>

      {/* =====================================================
          EXPERIENCE
      ===================================================== */}

      <section className="experience">
        <div className="experienceText">
          <span className="kicker">
            FROM SEARCH TO CERTAINTY
          </span>

          <h2>
            Discover. Compare. Hold. Book.
          </h2>

          <p>
            One wedding view connects the main venue with
            mehendi, sangeet and haldi spaces. Enquiries,
            Instant Holds and Instant Books stay clearly
            separated so every decision has a defined next
            step.
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
          <div className="orbitCenter">
            TVS
          </div>

          <span>
            01
            <br />
            <b>
              Discover
            </b>
          </span>

          <span>
            02
            <br />
            <b>
              Compare
            </b>
          </span>

          <span>
            03
            <br />
            <b>
              Hold
            </b>
          </span>

          <span>
            04
            <br />
            <b>
              Confirm
            </b>
          </span>
        </div>
      </section>

      {/* =====================================================
          COLLECTIONS
      ===================================================== */}

      <section className="collections">
        <span className="kicker">
          INSPIRE THE DECISION
        </span>

        <h2>
          Start with a feeling.
        </h2>

        <div className="collectionRow">
          {[
            [
              'Taj Falaknuma',
              venues[0]?.image,
            ],
            [
              'Novotel Hyderabad',
              venues[2]?.image,
            ],
            [
              'Radisson Hyderabad',
              venues[4]?.image,
            ],
            [
              'ITC Kohenur',
              venues[5]?.image,
            ],
          ].map(
            ([name, image], index) => (
              <Link
                href="/collections"
                className="collection"
                key={String(name)}
              >
                {image && (
                  <img
                    src={String(image)}
                    alt={String(name)}
                  />
                )}

                <div>
                  <small>
                    0{index + 1}
                  </small>

                  <h3>
                    {String(name)}
                  </h3>
                </div>
              </Link>
            )
          )}
        </div>
      </section>
    </main>
  );
}