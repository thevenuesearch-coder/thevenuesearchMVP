'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';

import type { Venue } from '../lib/data';

type HeroSearchBoxProps = {
  venues: Venue[];
};

export function HeroSearchBox({ venues }: HeroSearchBoxProps) {
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
    new Set(venues.map((v) => v.destination).filter(Boolean))
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
    ? venues.filter((v) => v.destination === destination)
    : venues;

  /*
   * =====================================================
   * SELECTED VENUE
   * =====================================================
   */

  const selectedVenue = destinationVenues.find(
    (v) => v.id === venue
  );

  /*
   * =====================================================
   * EXPLORE URL
   * =====================================================
   */

  const exploreHref =
    `/explore?destination=${encodeURIComponent(destination)}` +
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

  function handleDestinationChange(value: string) {
    setDestination(value);
    setVenue('');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <span className="kicker">
        THE NEW STANDARD FOR VENUE DISCOVERY
      </span>

      <h1>
        Find the place
        <br />
        <em>your story deserves.</em>
      </h1>

      <p>
        Verified destination wedding venues, transparent
        decisions and a booking journey built around certainty.
      </p>

      {/* =================================================
          HERO SEARCH
      ================================================= */}

      <div className="searchBox">
        {/* =================================================
            DESTINATION
        ================================================= */}

        <div>
          <small>Destination</small>

          <select
            value={destination}
            onChange={(e) =>
              handleDestinationChange(e.target.value)
            }
          >
            <option value="">All destinations</option>

            {destinations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {/* =================================================
            VENUE
        ================================================= */}

        <div>
          <small>Venue</small>

          <select
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          >
            <option value="">
              {destination
                ? `All ${destination} venues`
                : 'All venues'}
            </option>

            {destinationVenues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* =================================================
            GUESTS
        ================================================= */}

        <div>
          <small>Guests</small>

          <select
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
          >
            <option value="">Guest count</option>
            <option value="50–100">50–100</option>
            <option value="100–200">100–200</option>
            <option value="200–400">200–400</option>
            <option value="400–600">400–600</option>
            <option value="600+">600+</option>
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
  );
}
