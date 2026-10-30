'use client';

import Link from 'next/link';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { useState } from 'react';

import type { Venue } from '../lib/data';

type SearchVenue = Pick<Venue, 'id' | 'name' | 'destination' | 'state'>;

type HeroSearchBoxProps = {
  venues: SearchVenue[];
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

  /*
   * The dropdown lists states (not cities). A venue without a
   * state falls back to its destination so it never disappears.
   */
  const stateOf = (v: SearchVenue) => v.state || v.destination;

  const destinations = Array.from(
    new Set(venues.map(stateOf).filter(Boolean))
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
    ? venues.filter((v) => stateOf(v) === destination)
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
    <LazyMotion features={domAnimation}>
    <m.div
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
        <em>your story</em>
        <br />
        deserves.
      </h1>

      <p className="heroLead">
        Verified destination wedding venues, transparent
        decisions and a booking journey built around certainty.
      </p>

      {/* HERO SEARCH — same state, same URLs as before */}
      <div className="heroSearch" role="search" aria-label="Find a venue">
        <div className="field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 21s-7-5.6-7-11a7 7 0 1 1 14 0c0 5.4-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>
          <div className="fieldBody">
            <label htmlFor="hero-search-destination">Destination</label>
            <select
              id="hero-search-destination"
              value={destination}
              onChange={(e) => handleDestinationChange(e.target.value)}
            >
              <option value="">All destinations</option>
              {destinations.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/></svg>
          <div className="fieldBody">
            <label htmlFor="hero-search-venue">Venue</label>
            <select
              id="hero-search-venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            >
              <option value="">
                {destination ? `All ${destination} venues` : 'All venues'}
              </option>
              {destinationVenues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.4 2.7-6 6-6s6 2.6 6 6M16 11a3 3 0 1 0 0-6M17.5 14.3c2 .6 3.5 2.6 3.5 5.7"/></svg>
          <div className="fieldBody">
            <label htmlFor="hero-search-guests">Guests</label>
            <select
              id="hero-search-guests"
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
        </div>

        <Link
          data-cursor="open"
          className="primaryBtn large"
          href={selectedVenue ? `/venues/${selectedVenue.id}` : exploreHref}
        >
          Explore venues →
        </Link>
      </div>
    </m.div>
    </LazyMotion>
  );
}
