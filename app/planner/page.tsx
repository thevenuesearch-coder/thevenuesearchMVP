'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { createClient } from '../../lib/supabase-browser';

type Wedding = {
  id: string;
  title: string;
  city: string | null;
  owner_id: string;
  created_at: string;
};

type ShortlistVenue = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  type: string | null;
  capacity_max: number | null;
  description: string | null;
};

type ShortlistItem = {
  id: string;
  venue_id: string;
  created_at: string;
  venue: ShortlistVenue | null;
};

type BookingVenue = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
};

type BookingRequest = {
  id: string;
  venue_id: string;
  created_at: string;
  event_date: string | null;
  event_type: string | null;
  guest_count: number | null;
  notes: string | null;
  status: string | null;
  venue: BookingVenue | null;
};

type PlannerSection =
  | 'Overview'
  | 'My Weddings'
  | 'Shortlist'
  | 'Requests'
  | 'Calendar';

export default function Planner() {
  const supabase = createClient();

  const [active, setActive] =
    useState<PlannerSection>('Overview');

  const [user, setUser] =
    useState<any>(null);

  const [weddings, setWeddings] =
    useState<Wedding[]>([]);

  const [shortlist, setShortlist] =
    useState<ShortlistItem[]>([]);

  const [requests, setRequests] =
    useState<BookingRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [showWeddingModal, setShowWeddingModal] =
    useState(false);

  const [weddingTitle, setWeddingTitle] =
    useState('');

  const [weddingCity, setWeddingCity] =
    useState('');

  const [creatingWedding, setCreatingWedding] =
    useState(false);

  /* =====================================================
     LOAD PLANNER DATA
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadPlanner() {
      try {
        setLoading(true);
        setError('');

        /* ---------------------------------------------
           CURRENT USER
        --------------------------------------------- */

        const {
          data: {
            user: currentUser,
          },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!currentUser) {
          window.location.href = '/login';
          return;
        }

        if (!mounted) return;

        setUser(currentUser);

        /* ---------------------------------------------
           WEDDINGS
        --------------------------------------------- */

        const {
          data: weddingData,
          error: weddingError,
        } =
          await supabase
            .from('weddings')
            .select(
              `
              id,
              title,
              city,
              owner_id,
              created_at
              `
            )
            .eq(
              'owner_id',
              currentUser.id
            )
            .order(
              'created_at',
              {
                ascending: false,
              }
            );

        if (weddingError) {
          console.warn(
            'Wedding loading warning:',
            weddingError
          );
        }

        /* ---------------------------------------------
           WISHLIST / SHORTLIST
        --------------------------------------------- */

        const {
          data: shortlistData,
          error: shortlistError,
        } =
          await supabase
            .from('wishlists')
            .select(
              `
              id,
              venue_id,
              created_at,
              venue:venues(
                id,
                name,
                slug,
                city,
                type,
                capacity_max,
                description
              )
              `
            )
            .eq(
              'user_id',
              currentUser.id
            )
            .order(
              'created_at',
              {
                ascending: false,
              }
            );

        if (shortlistError) {
          console.warn(
            'Shortlist loading warning:',
            shortlistError
          );
        }

        /* ---------------------------------------------
           NORMALIZE SUPABASE VENUE ARRAY
        --------------------------------------------- */

        const normalizedShortlist: ShortlistItem[] =
          (shortlistData || [])
            .filter((item: any) =>
              Array.isArray(item.venue)
                ? item.venue.length > 0
                : Boolean(item.venue)
            )
            .map((item: any) => ({
              id: item.id,
              venue_id: item.venue_id,
              created_at: item.created_at,

              venue: Array.isArray(item.venue)
                ? item.venue[0] || null
                : item.venue || null,
            }));

        /* ---------------------------------------------
           BOOKING REQUESTS
        --------------------------------------------- */

        const {
          data: requestData,
          error: requestError,
        } =
          await supabase
            .from('booking_requests')
            .select(
              `
              id,
              venue_id,
              created_at,
              event_date,
              event_type,
              guest_count,
              notes,
              status,
              venue:venues(
                id,
                name,
                slug,
                city
              )
              `
            )
            .eq(
              'user_id',
              currentUser.id
            )
            .order(
              'created_at',
              {
                ascending: false,
              }
            );

        if (requestError) {
          console.warn(
            'Booking request loading warning:',
            requestError
          );
        }

        /* ---------------------------------------------
           NORMALIZE BOOKING VENUE ARRAY
        --------------------------------------------- */

        const normalizedRequests: BookingRequest[] =
          (requestData || [])
            .filter((item: any) =>
              Array.isArray(item.venue)
                ? item.venue.length > 0
                : Boolean(item.venue)
            )
            .map((item: any) => ({
              id: item.id,
              venue_id: item.venue_id,
              created_at: item.created_at,
              event_date: item.event_date,
              event_type: item.event_type,
              guest_count: item.guest_count,
              notes: item.notes,
              status: item.status,

              venue: Array.isArray(item.venue)
                ? item.venue[0] || null
                : item.venue || null,
            }));

        /* ---------------------------------------------
           SAVE STATE
        --------------------------------------------- */

        if (!mounted) return;

        setWeddings(
          (weddingData || []) as Wedding[]
        );

        setShortlist(
          normalizedShortlist
        );

        setRequests(
          normalizedRequests
        );
      } catch (err: any) {
        console.error(
          'Planner loading error:',
          err
        );

        if (mounted) {
          setError(
            err?.message ||
              'Unable to load planner data.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPlanner();

    return () => {
      mounted = false;
    };
  }, []);

  /* =====================================================
     CREATE WEDDING
  ===================================================== */

  async function createWedding() {
    if (!user) return;

    if (!weddingTitle.trim()) {
      setError(
        'Please enter a wedding name.'
      );
      return;
    }

    try {
      setCreatingWedding(true);
      setError('');

      const {
        data,
        error: insertError,
      } =
        await supabase
          .from('weddings')
          .insert({
            owner_id: user.id,
            title: weddingTitle.trim(),
            city:
              weddingCity.trim() ||
              null,
          })
          .select(
            'id,title,city,owner_id,created_at'
          )
          .single();

      if (insertError) {
        throw insertError;
      }

      if (data) {
        setWeddings((current) => [
          data as Wedding,
          ...current,
        ]);
      }

      setWeddingTitle('');
      setWeddingCity('');
      setShowWeddingModal(false);
      setActive('My Weddings');
    } catch (err: any) {
      console.error(
        'Create wedding error:',
        err
      );

      setError(
        err?.message ||
          'Unable to create wedding.'
      );
    } finally {
      setCreatingWedding(false);
    }
  }

  /* =====================================================
     DASHBOARD COUNTS
  ===================================================== */

  const stats = useMemo(
    () => ({
      weddings: weddings.length,
      shortlist: shortlist.length,
      requests: requests.length,

      datesHeld: requests.filter(
        (request) =>
          String(
            request.status || ''
          ).toLowerCase() === 'held'
      ).length,
    }),
    [
      weddings,
      shortlist,
      requests,
    ]
  );

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="dashboard">
        <div className="dashboardLoading">
          Loading planner workspace...
        </div>
      </main>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <main className="dashboard">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="side">

        <img
          src="/logo.png"
          alt="The Venue Search"
        />

        <b>
          Planner Workspace
        </b>

        {[
          'Overview',
          'My Weddings',
          'Shortlist',
          'Requests',
          'Calendar',
        ].map((item) => (
          <button
            key={item}
            type="button"
            className={
              active === item
                ? 'active'
                : ''
            }
            onClick={() =>
              setActive(
                item as PlannerSection
              )
            }
          >
            {item}
          </button>
        ))}

      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <section className="dashMain">

        {/* HEADER */}

        <div className="dashHead">

          <div>
            <span className="kicker">
              PLANNER WORKSPACE
            </span>

            <h1>
              {active}
            </h1>
          </div>

          <button
            type="button"
            data-cursor="open"
            className="primaryBtn"
            onClick={() =>
              setShowWeddingModal(true)
            }
          >
            New wedding +
          </button>

        </div>

        {/* ERROR */}

        {error && (
          <div className="plannerError">
            {error}
          </div>
        )}

        {/* =================================================
            OVERVIEW
        ================================================= */}

        {active === 'Overview' && (
          <>
            <div className="dashCards">

              <div>
                <span>
                  Active weddings
                </span>

                <strong>
                  {String(
                    stats.weddings
                  ).padStart(2, '0')}
                </strong>
              </div>

              <div>
                <span>
                  Shortlisted venues
                </span>

                <strong>
                  {String(
                    stats.shortlist
                  ).padStart(2, '0')}
                </strong>
              </div>

              <div>
                <span>
                  Open requests
                </span>

                <strong>
                  {String(
                    stats.requests
                  ).padStart(2, '0')}
                </strong>
              </div>

              <div>
                <span>
                  Dates held
                </span>

                <strong>
                  {String(
                    stats.datesHeld
                  ).padStart(2, '0')}
                </strong>
              </div>

            </div>

            <div className="tableCard">

              <h3>
                Wedding pipeline
              </h3>

              {weddings.length === 0 ? (
                <div className="plannerEmpty">
                  <p>
                    No weddings created yet.
                  </p>

                  <button
                    type="button"
                    className="smallBtn"
                    onClick={() =>
                      setShowWeddingModal(true)
                    }
                  >
                    Create your first wedding
                  </button>
                </div>
              ) : (
                weddings.map(
                  (wedding) => (
                    <div
                      className="row"
                      key={wedding.id}
                    >
                      <span>
                        <b>
                          {wedding.title}
                        </b>

                        <small>
                          {wedding.city ||
                            'Destination not selected'}
                        </small>
                      </span>

                      <em>
                        {
                          shortlist.length
                        }{' '}
                        venues
                      </em>

                      <button
                        type="button"
                        onClick={() =>
                          setActive(
                            'My Weddings'
                          )
                        }
                      >
                        Open →
                      </button>
                    </div>
                  )
                )
              )}

            </div>
          </>
        )}

        {/* =================================================
            MY WEDDINGS
        ================================================= */}

        {active === 'My Weddings' && (
          <div className="tableCard">

            <div className="plannerSectionHeader">
              <div>
                <h3>
                  My Weddings
                </h3>

                <p>
                  Manage your wedding
                  planning workspaces.
                </p>
              </div>

              <button
                type="button"
                className="smallBtn"
                onClick={() =>
                  setShowWeddingModal(true)
                }
              >
                New wedding +
              </button>
            </div>

            {weddings.length === 0 ? (
              <div className="plannerEmpty">
                <h3>
                  No weddings yet
                </h3>

                <p>
                  Create a wedding workspace
                  to begin planning.
                </p>
              </div>
            ) : (
              weddings.map(
                (wedding) => (
                  <div
                    className="row"
                    key={wedding.id}
                  >
                    <span>
                      <b>
                        {wedding.title}
                      </b>

                      <small>
                        {wedding.city ||
                          'Destination not selected'}
                      </small>
                    </span>

                    <em>
                      Created{' '}
                      {new Date(
                        wedding.created_at
                      ).toLocaleDateString()}
                    </em>

                    <button
                      type="button"
                      onClick={() =>
                        setActive(
                          'Shortlist'
                        )
                      }
                    >
                      View →
                    </button>
                  </div>
                )
              )
            )}

          </div>
        )}

        {/* =================================================
            SHORTLIST
        ================================================= */}

        {active === 'Shortlist' && (
          <div className="tableCard">

            <div className="plannerSectionHeader">
              <div>
                <h3>
                  Shortlisted Venues
                </h3>

                <p>
                  Venues saved while
                  exploring.
                </p>
              </div>

              <span>
                {shortlist.length} saved
              </span>
            </div>

            {shortlist.length === 0 ? (
              <div className="plannerEmpty">
                <h3>
                  Your shortlist is empty
                </h3>

                <p>
                  Save venues from the
                  Explore page.
                </p>

                <a
                  className="smallBtn"
                  href="/explore"
                >
                  Explore venues →
                </a>
              </div>
            ) : (
              shortlist.map(
                (item) => (
                  <div
                    className="row"
                    key={item.id}
                  >
                    <span>
                      <b>
                        {item.venue?.name ||
                          'Venue unavailable'}
                      </b>

                      <small>
                        {item.venue?.city ||
                          'Destination'}
                        {' · '}
                        {item.venue?.type ||
                          'Venue'}
                      </small>
                    </span>

                    <em>
                      {item.venue?.capacity_max
                        ? `Up to ${item.venue.capacity_max} guests`
                        : 'Capacity on request'}
                    </em>

                    {item.venue?.slug ? (
                      <a
                        href={`/venues/${item.venue.slug}`}
                      >
                        Open →
                      </a>
                    ) : (
                      <span>
                        —
                      </span>
                    )}
                  </div>
                )
              )
            )}

          </div>
        )}

        {/* =================================================
            REQUESTS
        ================================================= */}

        {active === 'Requests' && (
          <div className="tableCard">

            <div className="plannerSectionHeader">
              <div>
                <h3>
                  Booking Requests
                </h3>

                <p>
                  Track venue enquiries
                  and booking requests.
                </p>
              </div>

              <span>
                {requests.length} requests
              </span>
            </div>

            {requests.length === 0 ? (
              <div className="plannerEmpty">
                <h3>
                  No booking requests
                </h3>

                <p>
                  Your venue enquiries
                  will appear here.
                </p>
              </div>
            ) : (
              requests.map(
                (request) => (
                  <div
                    className="row"
                    key={request.id}
                  >
                    <span>
                      <b>
                        {request.venue?.name ||
                          'Venue'}
                      </b>

                      <small>
                        {request.event_type ||
                          'Event'}
                        {' · '}
                        {request.guest_count ||
                          'Guest count on request'}{' '}
                        guests
                      </small>
                    </span>

                    <em>
                      {request.event_date
                        ? new Date(
                            request.event_date
                          ).toLocaleDateString()
                        : 'Date on request'}
                    </em>

                    <span>
                      {request.status ||
                        'Submitted'}
                    </span>
                  </div>
                )
              )
            )}

          </div>
        )}

        {/* =================================================
            CALENDAR
        ================================================= */}

        {active === 'Calendar' && (
          <div className="tableCard">

            <div className="plannerSectionHeader">
              <div>
                <h3>
                  Calendar
                </h3>

                <p>
                  Upcoming wedding and
                  venue request dates.
                </p>
              </div>
            </div>

            {requests.length === 0 ? (
              <div className="plannerEmpty">
                <h3>
                  No dates yet
                </h3>

                <p>
                  Dates from your venue
                  requests will appear here.
                </p>
              </div>
            ) : (
              requests
                .filter(
                  (request) =>
                    Boolean(
                      request.event_date
                    )
                )
                .sort(
                  (a, b) =>
                    new Date(
                      a.event_date || ''
                    ).getTime() -
                    new Date(
                      b.event_date || ''
                    ).getTime()
                )
                .map(
                  (request) => (
                    <div
                      className="row"
                      key={request.id}
                    >
                      <span>
                        <b>
                          {request.venue?.name ||
                            'Venue'}
                        </b>

                        <small>
                          {request.event_type ||
                            'Event'}
                        </small>
                      </span>

                      <em>
                        {new Date(
                          request.event_date || ''
                        ).toLocaleDateString(
                          undefined,
                          {
                            weekday:
                              'short',
                            year:
                              'numeric',
                            month:
                              'short',
                            day:
                              'numeric',
                          }
                        )}
                      </em>

                      <span>
                        {request.guest_count
                          ? `${request.guest_count} guests`
                          : 'Guests TBD'}
                      </span>
                    </div>
                  )
                )
            )}

          </div>
        )}

      </section>

      {/* =====================================================
          NEW WEDDING MODAL
      ===================================================== */}

      {showWeddingModal && (
        <div
          className="plannerModalOverlay"
          onClick={() =>
            setShowWeddingModal(false)
          }
        >
          <div
            className="plannerModal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="plannerModalClose"
              onClick={() =>
                setShowWeddingModal(false)
              }
              aria-label="Close"
            >
              ×
            </button>

            <span className="kicker">
              NEW WEDDING
            </span>

            <h2>
              Create a wedding workspace
            </h2>

            <p>
              Start a dedicated planning
              workspace for your celebration.
            </p>

            <label>
              Wedding name
            </label>

            <input
              value={weddingTitle}
              onChange={(e) =>
                setWeddingTitle(
                  e.target.value
                )
              }
              placeholder="e.g. Sharma × Mehta"
            />

            <label>
              Destination
            </label>

            <input
              value={weddingCity}
              onChange={(e) =>
                setWeddingCity(
                  e.target.value
                )
              }
              placeholder="e.g. Udaipur"
            />

            <button
              type="button"
              className="primaryBtn"
              disabled={
                creatingWedding
              }
              onClick={createWedding}
            >
              {creatingWedding
                ? 'Creating...'
                : 'Create wedding →'}
            </button>

          </div>
        </div>
      )}

    </main>
  );
}