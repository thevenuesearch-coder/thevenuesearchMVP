'use client';

import { useEffect, useMemo, useState } from 'react';

import { MAX_COMPARE_VENUES } from '../lib/compare/constants';
import type { VenueSummary } from '../lib/data';

import { CompareTray } from './compare/CompareTray';
import compareStyles from './compare/compare-select.module.css';
import { VenueCard } from './VenueCard';

/* Keeps the picks when the visitor opens /compare and comes back. */
const COMPARE_STORAGE_KEY = 'vs-compare-venues';

type ExploreClientProps = {
  initialVenues: VenueSummary[];
  initialError?: string;
};

export function ExploreClient({
  initialVenues,
  initialError,
}: ExploreClientProps) {
  const [destination, setDestination] = useState('');
  const [venueType, setVenueType] = useState('');
  const [capacity, setCapacity] = useState('');

  /* Venues picked for comparison (public slugs, max 4). */
  const [compareIds, setCompareIds] = useState<string[]>([]);

  /*
   * Venues arrive already loaded from the server -- fetched in
   * app/explore/page.tsx (a Server Component) so the grid is
   * present in the initial HTML for search engines and anyone
   * whose JS is slow, rather than only appearing after a
   * client-side fetch. No loading state is needed here since the
   * data is already resolved by the time this component renders.
   */
  const venues = initialVenues;
  const venuesError = initialError || '';

  /* =====================================================
     COMPARE SELECTION
  ===================================================== */

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(COMPARE_STORAGE_KEY);
      const saved: unknown = raw ? JSON.parse(raw) : [];

      if (Array.isArray(saved)) {
        /* Only restore venues that still exist in the list. */
        const valid = saved.filter(
          (id): id is string =>
            typeof id === 'string' && venues.some((v) => v.id === id)
        );
        if (valid.length > 0) {
          setCompareIds(valid.slice(0, MAX_COMPARE_VENUES));
        }
      }
    } catch {
      /* Storage blocked or corrupted: start with an empty selection. */
    }
  }, [venues]);

  function updateCompare(next: string[]) {
    setCompareIds(next);

    try {
      window.sessionStorage.setItem(
        COMPARE_STORAGE_KEY,
        JSON.stringify(next)
      );
    } catch {
      /* Not essential: the selection still works for this visit. */
    }
  }

  function toggleCompare(id: string) {
    if (compareIds.includes(id)) {
      updateCompare(compareIds.filter((x) => x !== id));
    } else if (compareIds.length < MAX_COMPARE_VENUES) {
      updateCompare([...compareIds, id]);
    }
  }

  const compareVenues = compareIds.flatMap((id) => {
    const match = venues.find((v) => v.id === id);
    return match ? [{ id: match.id, name: match.name }] : [];
  });

  /* =====================================================
     DESTINATIONS (derived from live venue data)
  ===================================================== */

  const destinations = useMemo(() => {
    return Array.from(
      new Set(
        venues
          .map((v) => v.destination)
          .filter(Boolean)
      )
    );
  }, [venues]);

  /* =====================================================
     READ DESTINATION FROM URL
     Example:
     /explore?destination=Hyderabad
  ===================================================== */

  useEffect(() => {
    /*
     * Destinations are derived from fetched venue data, so this
     * only tries to match once venues have loaded.
     */
    if (destinations.length === 0) return;

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
  }, [destinations]);

  const venueTypes = useMemo(() => {
    const types = venues
      .map((venue) => venue.type)
      .filter(Boolean);

    return Array.from(
      new Set(types)
    );
  }, [venues]);

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
    venues,
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
    <main
      id="main-content"
      className="page"
      style={
        compareVenues.length > 0
          ? { paddingBottom: 'calc(100px + 5.5rem)' }
          : undefined
      }
    >

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

      <div
        className="filterBar"
        role="search"
        aria-label="Filter venues"
      >

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

        <span role="status" aria-live="polite">
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

      {!venuesError && filteredVenues.length > 1 && (
        <p className={compareStyles.hint}>
          Tick <b>Compare</b> on up to {MAX_COMPARE_VENUES} venues to see
          their capacity, rooms, event spaces, amenities and services side by
          side.
        </p>
      )}

      {/* =================================================
          VENUE GRID
      ================================================= */}

      {venuesError ? (

        /* =================================================
           ERROR STATE
        ================================================= */

        <div className="emptyState">
          <h3>Something went wrong</h3>
          <p>{venuesError}</p>
        </div>

      ) : filteredVenues.length > 0 ? (

        <div className="venueGrid">

          {filteredVenues.map(
            (venue) => (
              <VenueCard
                headingLevel={2}
                key={venue.id}
                v={{
                  ...venue,

                  /*
                   * VenueCard expects these
                   * database-style properties.
                   */

                  slug: venue.id,

                  description:
                    venue.desc,
                }}
                compare={{
                  selected: compareIds.includes(venue.id),
                  disabled:
                    compareIds.length >= MAX_COMPARE_VENUES,
                  onToggle: () => toggleCompare(venue.id),
                }}
              />
            )
          )}

        </div>

      ) : (

        /* =================================================
           EMPTY STATE (no matches for current filters)
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

      <CompareTray
        venues={compareVenues}
        onRemove={toggleCompare}
        onClear={() => updateCompare([])}
      />

    </main>
  );
}