'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  destinations,
  venues,
} from '../../lib/data';

import { VenueCard } from '../../components/VenueCard';

export default function Explore() {
  const [destination, setDestination] =
    useState('');

  const [venue, setVenue] =
    useState('');

  const [cap, setCap] =
    useState('');

  const [openFilter, setOpenFilter] =
    useState<
      'destination' | 'venue' | 'guests' | null
    >(null);

  const filterRef =
    useRef<HTMLDivElement>(null);


  /*
   * ---------------------------------------------------------
   * READ URL FILTERS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const selectedDestination =
      params.get('destination') || '';

    const selectedVenue =
      params.get('venue') || '';

    const guests =
      params.get('guests') || '';

    if (selectedDestination) {
      setDestination(
        selectedDestination
      );
    }

    if (selectedVenue) {
      setVenue(selectedVenue);
    }

    if (guests) {
      setCap(
        guests.split('–')[0]
      );
    }
  }, []);


  /*
   * ---------------------------------------------------------
   * CLOSE DROPDOWN WHEN CLICKING OUTSIDE
   * ---------------------------------------------------------
   */

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        filterRef.current &&
        !filterRef.current.contains(
          event.target as Node
        )
      ) {
        setOpenFilter(null);
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);


  /*
   * ---------------------------------------------------------
   * VENUES FOR SELECTED DESTINATION
   * ---------------------------------------------------------
   */

  const destinationVenues =
    useMemo(() => {
      if (!destination) {
        return venues;
      }

      return venues.filter(
        (v) =>
          v.destination ===
          destination
      );
    }, [destination]);


  /*
   * ---------------------------------------------------------
   * FILTER VENUES
   * ---------------------------------------------------------
   */

  const filtered =
    useMemo(() => {
      return venues.filter((v) => {

        const matchesDestination =
          !destination ||
          v.destination ===
            destination;

        const matchesVenue =
          !venue ||
          v.id === venue;

        const matchesCapacity =
          !cap ||
          v.capacity >=
            Number(cap);

        return (
          matchesDestination &&
          matchesVenue &&
          matchesCapacity
        );
      });
    }, [
      destination,
      venue,
      cap,
    ]);


  /*
   * ---------------------------------------------------------
   * UPDATE URL
   * ---------------------------------------------------------
   */

  function updateUrl(
    nextDestination: string,
    nextVenue: string,
    nextCap: string
  ) {
    const params =
      new URLSearchParams();

    if (nextDestination) {
      params.set(
        'destination',
        nextDestination
      );
    }

    if (nextVenue) {
      params.set(
        'venue',
        nextVenue
      );
    }

    if (nextCap) {
      params.set(
        'guests',
        nextCap
      );
    }

    const query =
      params.toString();

    window.history.replaceState(
      {},
      '',
      query
        ? `/explore?${query}`
        : '/explore'
    );
  }


  /*
   * ---------------------------------------------------------
   * DESTINATION
   * ---------------------------------------------------------
   */

  function selectDestination(
    value: string
  ) {
    setDestination(value);

    /*
     * Reset venue because a venue
     * from the previous destination
     * should not remain selected.
     */

    setVenue('');

    updateUrl(
      value,
      '',
      cap
    );

    setOpenFilter(null);
  }


  /*
   * ---------------------------------------------------------
   * VENUE
   * ---------------------------------------------------------
   */

  function selectVenue(
    value: string
  ) {
    setVenue(value);

    updateUrl(
      destination,
      value,
      cap
    );

    setOpenFilter(null);
  }


  /*
   * ---------------------------------------------------------
   * GUEST CAPACITY
   * ---------------------------------------------------------
   */

  function selectCapacity(
    value: string
  ) {
    setCap(value);

    updateUrl(
      destination,
      venue,
      value
    );

    setOpenFilter(null);
  }


  /*
   * ---------------------------------------------------------
   * RESET
   * ---------------------------------------------------------
   */

  function resetFilters() {
    setDestination('');
    setVenue('');
    setCap('');
    setOpenFilter(null);

    window.history.replaceState(
      {},
      '',
      '/explore'
    );
  }


  /*
   * ---------------------------------------------------------
   * SELECTED LABELS
   * ---------------------------------------------------------
   */

  const selectedVenue =
    venues.find(
      (v) => v.id === venue
    );

  const guestLabel =
    cap
      ? `${cap}+ guests`
      : 'Guest capacity';


  /*
   * ---------------------------------------------------------
   * PAGE
   * ---------------------------------------------------------
   */

  return (
    <main className="page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <div className="exploreHero">

        <span className="kicker">
          DESTINATION WEDDINGS
        </span>

        <h1>
          Find your venue,
          <em>
            with confidence.
          </em>
        </h1>

        <p>
          Explore verified venues by
          destination, venue and
          guest capacity.
        </p>

      </div>


      {/* =====================================================
          FILTER BAR
      ===================================================== */}

      <div
        className="filterBar"
        ref={filterRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          position: 'relative',
        }}
      >

        {/* ===================================================
            DESTINATION FILTER
        =================================================== */}

        <div
          style={{
            position: 'relative',
            flex: '1 1 220px',
          }}
        >

          <button
            type="button"
            onClick={() =>
              setOpenFilter(
                openFilter ===
                  'destination'
                  ? null
                  : 'destination'
              )
            }
            style={{
              width: '100%',
              height: '58px',
              padding: '0 20px',
              border: '1px solid #dedbd5',
              borderRadius: '12px',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'space-between',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#171717',
            }}
          >

            <span>
              {destination ||
                'Destination'}
            </span>

            <span
              style={{
                fontSize: '14px',
                transform:
                  openFilter ===
                  'destination'
                    ? 'rotate(180deg)'
                    : 'rotate(0deg)',
                transition:
                  'transform 0.2s ease',
              }}
            >
              ▾
            </span>

          </button>


          {openFilter ===
            'destination' && (

            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                width: '100%',
                minWidth: '230px',
                maxHeight: '360px',
                overflowY: 'auto',
                background: '#fff',
                border:
                  '1px solid #e5e2dc',
                borderRadius: '14px',
                boxShadow:
                  '0 18px 45px rgba(0,0,0,0.12)',
                padding: '8px',
                zIndex: 100,
              }}
            >

              <button
                type="button"
                onClick={() =>
                  selectDestination('')
                }
                style={{
                  width: '100%',
                  padding:
                    '13px 14px',
                  border: 'none',
                  borderRadius: '9px',
                  background:
                    !destination
                      ? '#f4f1eb'
                      : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight:
                    !destination
                      ? 600
                      : 400,
                }}
              >
                All destinations
              </button>

              {destinations.map(
                (item) => (

                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      selectDestination(
                        item
                      )
                    }
                    style={{
                      width: '100%',
                      padding:
                        '13px 14px',
                      border: 'none',
                      borderRadius: '9px',
                      background:
                        destination ===
                        item
                          ? '#f4f1eb'
                          : 'transparent',
                      textAlign:
                        'left',
                      cursor:
                        'pointer',
                      fontSize:
                        '15px',
                      fontWeight:
                        destination ===
                        item
                          ? 600
                          : 400,
                    }}
                  >
                    {item}
                  </button>

                )
              )}

            </div>
          )}

        </div>


        {/* ===================================================
            VENUE FILTER
        =================================================== */}

        <div
          style={{
            position: 'relative',
            flex: '1 1 260px',
          }}
        >

          <button
            type="button"
            onClick={() =>
              setOpenFilter(
                openFilter === 'venue'
                  ? null
                  : 'venue'
              )
            }
            style={{
              width: '100%',
              height: '58px',
              padding: '0 20px',
              border: '1px solid #dedbd5',
              borderRadius: '12px',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'space-between',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#171717',
            }}
          >

            <span>
              {selectedVenue?.name ||
                'Venue'}
            </span>

            <span
              style={{
                fontSize: '14px',
                transform:
                  openFilter === 'venue'
                    ? 'rotate(180deg)'
                    : 'rotate(0deg)',
                transition:
                  'transform 0.2s ease',
              }}
            >
              ▾
            </span>

          </button>


          {openFilter ===
            'venue' && (

            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                width: '100%',
                minWidth: '280px',
                maxHeight: '360px',
                overflowY: 'auto',
                background: '#fff',
                border:
                  '1px solid #e5e2dc',
                borderRadius: '14px',
                boxShadow:
                  '0 18px 45px rgba(0,0,0,0.12)',
                padding: '8px',
                zIndex: 100,
              }}
            >

              <button
                type="button"
                onClick={() =>
                  selectVenue('')
                }
                style={{
                  width: '100%',
                  padding:
                    '13px 14px',
                  border: 'none',
                  borderRadius: '9px',
                  background:
                    !venue
                      ? '#f4f1eb'
                      : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight:
                    !venue
                      ? 600
                      : 400,
                }}
              >
                All venues
              </button>

              {destinationVenues.map(
                (v) => (

                  <button
                    key={v.id}
                    type="button"
                    onClick={() =>
                      selectVenue(
                        v.id
                      )
                    }
                    style={{
                      width: '100%',
                      padding:
                        '13px 14px',
                      border: 'none',
                      borderRadius: '9px',
                      background:
                        venue ===
                        v.id
                          ? '#f4f1eb'
                          : 'transparent',
                      textAlign:
                        'left',
                      cursor:
                        'pointer',
                      fontSize:
                        '15px',
                      fontWeight:
                        venue ===
                        v.id
                          ? 600
                          : 400,
                    }}
                  >
                    {v.name}
                  </button>

                )
              )}

            </div>
          )}

        </div>


        {/* ===================================================
            GUEST FILTER
        =================================================== */}

        <div
          style={{
            position: 'relative',
            flex: '0 1 210px',
          }}
        >

          <button
            type="button"
            onClick={() =>
              setOpenFilter(
                openFilter === 'guests'
                  ? null
                  : 'guests'
              )
            }
            style={{
              width: '100%',
              height: '58px',
              padding: '0 20px',
              border: '1px solid #dedbd5',
              borderRadius: '12px',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'space-between',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#171717',
            }}
          >

            <span>
              {guestLabel}
            </span>

            <span
              style={{
                fontSize: '14px',
                transform:
                  openFilter === 'guests'
                    ? 'rotate(180deg)'
                    : 'rotate(0deg)',
                transition:
                  'transform 0.2s ease',
              }}
            >
              ▾
            </span>

          </button>


          {openFilter ===
            'guests' && (

            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                width: '100%',
                minWidth: '210px',
                background: '#fff',
                border:
                  '1px solid #e5e2dc',
                borderRadius: '14px',
                boxShadow:
                  '0 18px 45px rgba(0,0,0,0.12)',
                padding: '8px',
                zIndex: 100,
              }}
            >

              <button
                type="button"
                onClick={() =>
                  selectCapacity('')
                }
                style={{
                  width: '100%',
                  padding:
                    '13px 14px',
                  border: 'none',
                  borderRadius: '9px',
                  background:
                    !cap
                      ? '#f4f1eb'
                      : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight:
                    !cap
                      ? 600
                      : 400,
                }}
              >
                Any guest count
              </button>

              {[
                '50',
                '100',
                '200',
                '400',
                '600',
              ].map(
                (value) => (

                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      selectCapacity(
                        value
                      )
                    }
                    style={{
                      width: '100%',
                      padding:
                        '13px 14px',
                      border: 'none',
                      borderRadius: '9px',
                      background:
                        cap === value
                          ? '#f4f1eb'
                          : 'transparent',
                      textAlign:
                        'left',
                      cursor:
                        'pointer',
                      fontSize:
                        '15px',
                      fontWeight:
                        cap === value
                          ? 600
                          : 400,
                    }}
                  >
                    {value}+ guests
                  </button>

                )
              )}

            </div>
          )}

        </div>


        {/* ===================================================
            RESET
        =================================================== */}

        <button
          type="button"
          className="outlineBtn"
          data-cursor="view"
          onClick={resetFilters}
          style={{
            height: '58px',
            padding:
              '0 20px',
            whiteSpace:
              'nowrap',
          }}
        >
          Reset
        </button>

      </div>


      {/* =====================================================
          RESULT HEADER
      ===================================================== */}

      <div className="resultHead">

        <span>
          <b>
            {filtered.length}
          </b>{' '}
          curated venues
        </span>

        <span>
          {destination
            ? `${destination} · Verified inventory`
            : 'Verified inventory · All destinations'}
        </span>

      </div>


      {/* =====================================================
          VENUES
      ===================================================== */}

      {filtered.length > 0 ? (

        <div className="venueGrid">

          {filtered.map(
            (v) => (
              <VenueCard
                key={v.id}
                v={v}
              />
            )
          )}

        </div>

      ) : (

        <div
          style={{
            textAlign: 'center',
            padding:
              '80px 20px',
          }}
        >

          <span className="kicker">
            NO VENUES FOUND
          </span>

          <h2>
            No venues match
            your filters.
          </h2>

          <p>
            Try another destination,
            venue or guest capacity.
          </p>

          <button
            type="button"
            className="primaryBtn"
            onClick={resetFilters}
          >
            View all venues →
          </button>

        </div>

      )}

    </main>
  );
}