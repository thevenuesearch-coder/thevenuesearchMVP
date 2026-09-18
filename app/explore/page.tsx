'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  destinations,
  venues,
} from '../../lib/data';

import { VenueCard } from '../../components/VenueCard';

export default function Explore() {
  const [destination, setDestination] = useState('');
  const [venueType, setVenueType] = useState('');
  const [capacity, setCapacity] = useState('');

  /* =====================================================
     READ DESTINATION FROM URL
     Example:
     /explore?destination=Hyderabad
  ===================================================== */

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const destinationParam =
      params.get('destination');

    if (destinationParam) {
      const matchedDestination =
        destinations.find(
          (item) =>
            item.toLowerCase() ===
            destinationParam.toLowerCase()
        );

      if (matchedDestination) {
        setDestination(
          matchedDestination
        );
      }
    }

    const guestsParam =
      params.get('guests');

    if (guestsParam) {
      const firstNumber =
        guestsParam.match(/\d+/);

      if (firstNumber) {
        setCapacity(
          firstNumber[0]
        );
      }
    }
  }, []);

  /* =====================================================
     VENUE TYPES
  ===================================================== */

  const venueTypes = useMemo(() => {
    const types = venues
      .map((venue) => venue.type)
      .filter(Boolean);

    return Array.from(
      new Set(types)
    );
  }, []);

  /* =====================================================
     FILTER VENUES
  ===================================================== */

  const filteredVenues = useMemo(() => {
    return venues.filter((venue) => {
      /* -----------------------------------------------
         DESTINATION FILTER
      ------------------------------------------------ */

      const matchesDestination =
        !destination ||
        venue.destination.toLowerCase() ===
          destination.toLowerCase();

      /* -----------------------------------------------
         VENUE TYPE FILTER
      ------------------------------------------------ */

      const matchesVenueType =
        !venueType ||
        venue.type.toLowerCase() ===
          venueType.toLowerCase();

      /* -----------------------------------------------
         GUEST CAPACITY FILTER
      ------------------------------------------------ */

      let matchesCapacity = true;

      if (capacity) {
        const minimumGuests =
          Number(capacity);

        matchesCapacity =
          venue.capacity >=
          minimumGuests;
      }

      return (
        matchesDestination &&
        matchesVenueType &&
        matchesCapacity
      );
    });
  }, [
    destination,
    venueType,
    capacity,
  ]);

  /* =====================================================
     RESET FILTERS
  ===================================================== */

  function resetFilters() {
    setDestination('');
    setVenueType('');
    setCapacity('');

    /* Remove filter parameters from URL */

    window.history.replaceState(
      {},
      '',
      '/explore'
    );
  }

  /* =====================================================
     UPDATE DESTINATION
  ===================================================== */

  function handleDestinationChange(
    value: string
  ) {
    setDestination(value);

    const url =
      new URL(
        window.location.href
      );

    if (value) {
      url.searchParams.set(
        'destination',
        value
      );
    } else {
      url.searchParams.delete(
        'destination'
      );
    }

    window.history.replaceState(
      {},
      '',
      url.toString()
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <main className="page">

      {/* =================================================
          HERO
      ================================================= */}

      <div className="exploreHero">

        <span className="kicker">
          DESTINATION WEDDINGS
        </span>

        <h1>
          Find your venue,
          <em> with confidence.</em>
        </h1>

        <p>
          Explore verified venues by destination,
          venue type and guest capacity.
        </p>

      </div>

      {/* =================================================
          FILTER BAR
      ================================================= */}

      <div className="filterBar">

        {/* DESTINATION */}

        <select
          value={destination}
          onChange={(e) =>
            handleDestinationChange(
              e.target.value
            )
          }
          aria-label="Filter by destination"
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

        {/* VENUE TYPE */}

        <select
          value={venueType}
          onChange={(e) =>
            setVenueType(
              e.target.value
            )
          }
          aria-label="Filter by venue type"
        >
          <option value="">
            All venues
          </option>

          {venueTypes.map(
            (type) => (
              <option
                key={type}
                value={type}
              >
                {type}
              </option>
            )
          )}
        </select>

        {/* GUEST CAPACITY */}

        <select
          value={capacity}
          onChange={(e) =>
            setCapacity(
              e.target.value
            )
          }
          aria-label="Filter by guest capacity"
        >
          <option value="">
            Guest capacity
          </option>

          <option value="50">
            50+ guests
          </option>

          <option value="100">
            100+ guests
          </option>

          <option value="200">
            200+ guests
          </option>

          <option value="400">
            400+ guests
          </option>

          <option value="600">
            600+ guests
          </option>

          <option value="1000">
            1000+ guests
          </option>

        </select>

        {/* RESET */}

        <button
          type="button"
          data-cursor="view"
          className="outlineBtn"
          onClick={resetFilters}
        >
          Reset
        </button>

      </div>

      {/* =================================================
          RESULT HEADER
      ================================================= */}

      <div className="resultHead">

        <span>
          <b>
            {filteredVenues.length}
          </b>{' '}
          curated venues
        </span>

        <span>
          Verified inventory ·{' '}
          {destination ||
            'All destinations'}
        </span>

      </div>

      {/* =================================================
          VENUE GRID
      ================================================= */}

      {filteredVenues.length > 0 ? (

        <div className="venueGrid">

          {filteredVenues.map(
            (venue) => (
              <VenueCard
                key={venue.id}
                v={{
                  ...venue,

                  /*
                   * VenueCard expects these
                   * database-style properties.
                   */

                  slug: venue.id,

                  capacityMin:
                    venue.capacity,

                  description:
                    venue.desc,
                }}
              />
            )
          )}

        </div>

      ) : (

        /* =================================================
           EMPTY STATE
        ================================================= */

        <div className="emptyState">

          <h3>
            No venues found
          </h3>

          <p>
            Try changing your destination,
            venue type or guest capacity.
          </p>

          <button
            type="button"
            className="primaryBtn"
            onClick={resetFilters}
          >
            Reset filters
          </button>

        </div>

      )}

    </main>
  );
}