'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { createClient } from '../../lib/supabase-browser';

type Section =
  | 'Overview'
  | 'My Weddings'
  | 'Shortlist'
  | 'Requests'
  | 'Calendar';

type Wedding = {
  id: string;
  title: string;
  city: string | null;
  created_at: string;
};

type ShortlistItem = {
  id: string;
  venue_id: string;
  created_at: string;
  venue: {
    id: string;
    name: string;
    slug: string;
    city: string | null;
    type: string | null;
    capacity_max: number | null;
    description: string | null;
  } | null;
};

type BookingRequest = {
  id: string;
  venue_id: string;
  event_date: string;
  guest_count: number | null;
  event_type: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  venue: {
    id: string;
    name: string;
    slug: string;
    city: string | null;
  } | null;
};

export default function Planner() {
  const [active, setActive] =
    useState<Section>('Overview');

  const [user, setUser] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [weddings, setWeddings] =
    useState<Wedding[]>([]);

  const [shortlist, setShortlist] =
    useState<ShortlistItem[]>([]);

  const [requests, setRequests] =
    useState<BookingRequest[]>([]);

  const [showNewWedding, setShowNewWedding] =
    useState(false);

  const [weddingTitle, setWeddingTitle] =
    useState('');

  const [weddingCity, setWeddingCity] =
    useState('Udaipur');

  const [creatingWedding, setCreatingWedding] =
    useState(false);

  const [actionMessage, setActionMessage] =
    useState('');

  /*
   * ========================================================
   * LOAD ALL PLANNER DATA
   * ========================================================
   */

  const loadPlannerData = useCallback(
    async () => {
      setLoading(true);
      setError('');

      try {
        const supabase =
          createClient();

        /*
         * ----------------------------------------------------
         * CURRENT USER
         * ----------------------------------------------------
         */

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
          window.location.href =
            '/login';

          return;
        }

        setUser(currentUser);

        /*
         * ----------------------------------------------------
         * WEDDINGS
         * ----------------------------------------------------
         */

        const {
          data: weddingData,
          error: weddingError,
        } =
          await supabase
            .from('weddings')
            .select(
              'id, title, city, created_at'
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
          throw weddingError;
        }

        setWeddings(
          weddingData || []
        );

        /*
         * ----------------------------------------------------
         * SHORTLIST
         * ----------------------------------------------------
         */

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
                venue:venues (
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
            'Planner shortlist loading warning:',
            shortlistError
          );

          setShortlist([]);
        } else {
          setShortlist(
            (shortlistData ||
              []) as ShortlistItem[]
          );
        }

        /*
         * ----------------------------------------------------
         * BOOKING REQUESTS
         * ----------------------------------------------------
         */

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
                event_date,
                guest_count,
                event_type,
                status,
                notes,
                created_at,
                venue:venues (
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
            'Planner requests loading warning:',
            requestError
          );

          setRequests([]);
        } else {
          setRequests(
            (requestData ||
              []) as BookingRequest[]
          );
        }
      } catch (err: any) {
        console.error(
          'Planner loading error:',
          {
            message:
              err?.message,
            details:
              err?.details,
            hint:
              err?.hint,
            code:
              err?.code,
          }
        );

        setError(
          'We could not load your planner workspace. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /*
   * ========================================================
   * INITIAL LOAD
   * ========================================================
   */

  useEffect(() => {
    loadPlannerData();
  }, [loadPlannerData]);

  /*
   * ========================================================
   * CREATE NEW WEDDING
   * ========================================================
   */

  async function createWedding() {
    if (creatingWedding) {
      return;
    }

    const cleanTitle =
      weddingTitle.trim();

    const cleanCity =
      weddingCity.trim() ||
      'Udaipur';

    if (!cleanTitle) {
      setActionMessage(
        'Please enter a wedding name.'
      );

      return;
    }

    try {
      setCreatingWedding(true);
      setActionMessage('');

      const supabase =
        createClient();

      /*
       * Get current user.
       */

      const {
        data: {
          user: currentUser,
        },
      } =
        await supabase.auth.getUser();

      if (!currentUser) {
        window.location.href =
          '/login';

        return;
      }

      /*
       * Insert wedding.
       */

      const {
        data,
        error:
          createError,
      } =
        await supabase
          .from('weddings')
          .insert({
            owner_id:
              currentUser.id,
            title:
              cleanTitle,
            city:
              cleanCity,
          })
          .select(
            'id, title, city, created_at'
          )
          .single();

      if (createError) {
        throw createError;
      }

      /*
       * Add newly created wedding
       * to the beginning of the list.
       */

      if (data) {
        setWeddings(
          (current) => [
            data as Wedding,
            ...current,
          ]
        );
      }

      /*
       * Close modal and reset form.
       */

      setWeddingTitle('');
      setWeddingCity('Udaipur');
      setShowNewWedding(false);

      setActive(
        'My Weddings'
      );

      setActionMessage(
        'Your wedding workspace has been created successfully.'
      );
    } catch (err: any) {
      console.error(
        'Create wedding error:',
        {
          message:
            err?.message,
          details:
            err?.details,
          hint:
            err?.hint,
          code:
            err?.code,
        }
      );

      setActionMessage(
        err?.message ||
          'We could not create the wedding. Please try again.'
      );
    } finally {
      setCreatingWedding(false);
    }
  }

  /*
   * ========================================================
   * COUNTS
   * ========================================================
   */

  const activeWeddingCount =
    weddings.length;

  const shortlistCount =
    shortlist.length;

  const openRequestCount =
    requests.filter(
      (request) =>
        request.status ===
          'requested' ||
        request.status ===
          'payment_pending'
    ).length;

  const heldDateCount =
    requests.filter(
      (request) =>
        request.status ===
          'held'
    ).length;

  /*
   * ========================================================
   * FORMAT DATE
   * ========================================================
   */

  function formatDate(
    value: string
  ) {
    if (!value) {
      return '';
    }

    return new Date(
      value
    ).toLocaleDateString(
      'en-IN',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }
    );
  }

  /*
   * ========================================================
   * STATUS LABEL
   * ========================================================
   */

  function formatStatus(
    status: string
  ) {
    return status
      .replace(/_/g, ' ')
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  }

  /*
   * ========================================================
   * NAVIGATION
   * ========================================================
   */

  function changeSection(
    section: Section
  ) {
    setActive(section);
    setActionMessage('');
  }

  /*
   * ========================================================
   * LOADING STATE
   * ========================================================
   */

  if (loading) {
    return (
      <main className="dashboard">

        <aside className="side">
          <img
            src="/logo.png"
            alt="The Venue Search"
          />

          <b>
            Planner Workspace
          </b>

          <div
            style={{
              marginTop: 30,
              color: '#777',
              fontSize: 14,
            }}
          >
            Loading workspace...
          </div>
        </aside>

        <section className="dashMain">

          <div className="dashHead">

            <div>
              <span className="kicker">
                PLANNER WORKSPACE
              </span>

              <h1>
                Loading...
              </h1>
            </div>

          </div>

        </section>

      </main>
    );
  }

  /*
   * ========================================================
   * ERROR STATE
   * ========================================================
   */

  if (error) {
    return (
      <main className="dashboard">

        <aside className="side">

          <img
            src="/logo.png"
            alt="The Venue Search"
          />

          <b>
            Planner Workspace
          </b>

        </aside>

        <section className="dashMain">

          <div className="dashHead">

            <div>
              <span className="kicker">
                PLANNER WORKSPACE
              </span>

              <h1>
                Something went wrong.
              </h1>

              <p>
                {error}
              </p>
            </div>

            <button
              type="button"
              className="primaryBtn"
              onClick={
                loadPlannerData
              }
            >
              Try again →
            </button>

          </div>

        </section>

      </main>
    );
  }

  /*
   * ========================================================
   * MAIN DASHBOARD
   * ========================================================
   */

  return (
    <main className="dashboard">

      {/* ====================================================
          SIDEBAR
      ==================================================== */}

      <aside className="side">

        <img
          src="/logo.png"
          alt="The Venue Search"
        />

        <b>
          Planner Workspace
        </b>

        <div
          style={{
            marginTop: 6,
            marginBottom: 20,
            fontSize: 12,
            color: '#888',
            wordBreak:
              'break-word',
          }}
        >
          {user?.email}
        </div>

        {(
          [
            'Overview',
            'My Weddings',
            'Shortlist',
            'Requests',
            'Calendar',
          ] as Section[]
        ).map(
          (section) => (
            <button
              key={section}
              type="button"
              className={
                active === section
                  ? 'active'
                  : ''
              }
              onClick={() =>
                changeSection(
                  section
                )
              }
            >
              {section}

              {section ===
                'My Weddings' &&
                weddings.length >
                  0 && (
                  <span
                    style={{
                      marginLeft:
                        'auto',
                      fontSize:
                        12,
                      opacity:
                        0.6,
                    }}
                  >
                    {
                      weddings.length
                    }
                  </span>
                )}

              {section ===
                'Shortlist' &&
                shortlist.length >
                  0 && (
                  <span
                    style={{
                      marginLeft:
                        'auto',
                      fontSize:
                        12,
                      opacity:
                        0.6,
                    }}
                  >
                    {
                      shortlist.length
                    }
                  </span>
                )}

              {section ===
                'Requests' &&
                openRequestCount >
                  0 && (
                  <span
                    style={{
                      marginLeft:
                        'auto',
                      fontSize:
                        12,
                      opacity:
                        0.6,
                    }}
                  >
                    {
                      openRequestCount
                    }
                  </span>
                )}
            </button>
          )
        )}

      </aside>


      {/* ====================================================
          MAIN
      ==================================================== */}

      <section className="dashMain">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="dashHead">

          <div>

            <span className="kicker">
              PLANNER WORKSPACE
            </span>

            <h1>
              {active}
            </h1>

            <p
              style={{
                marginTop:
                  8,
                color:
                  '#777',
              }}
            >
              Plan, shortlist and
              manage your destination
              wedding.
            </p>

          </div>

          <button
            type="button"
            data-cursor="open"
            className="primaryBtn"
            onClick={() =>
              setShowNewWedding(
                true
              )
            }
          >
            New wedding +
          </button>

        </div>


        {/* ==================================================
            SUCCESS / ACTION MESSAGE
        ================================================== */}

        {actionMessage && (

          <div
            style={{
              marginBottom:
                20,
              padding:
                '14px 18px',
              background:
                '#f4f7f2',
              border:
                '1px solid #dce7d8',
              borderRadius:
                10,
              fontSize:
                14,
            }}
          >
            {actionMessage}
          </div>

        )}


        {/* ==================================================
            OVERVIEW
        ================================================== */}

        {active ===
          'Overview' && (

          <>

            <div className="dashCards">

              <div>
                <span>
                  Active weddings
                </span>

                <strong>
                  {activeWeddingCount
                    .toString()
                    .padStart(
                      2,
                      '0'
                    )}
                </strong>
              </div>

              <div>
                <span>
                  Shortlisted venues
                </span>

                <strong>
                  {shortlistCount
                    .toString()
                    .padStart(
                      2,
                      '0'
                    )}
                </strong>
              </div>

              <div>
                <span>
                  Open requests
                </span>

                <strong>
                  {openRequestCount
                    .toString()
                    .padStart(
                      2,
                      '0'
                    )}
                </strong>
              </div>

              <div>
                <span>
                  Dates held
                </span>

                <strong>
                  {heldDateCount
                    .toString()
                    .padStart(
                      2,
                      '0'
                    )}
                </strong>
              </div>

            </div>


            <div className="tableCard">

              <div
                style={{
                  display:
                    'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'space-between',
                  gap: 20,
                  marginBottom:
                    20,
                }}
              >

                <div>
                  <span className="profileCardKicker">
                    YOUR WEDDINGS
                  </span>

                  <h3>
                    Wedding pipeline
                  </h3>
                </div>

                <button
                  type="button"
                  className="outlineBtn"
                  onClick={() =>
                    setActive(
                      'My Weddings'
                    )
                  }
                >
                  View all →
                </button>

              </div>


              {weddings.length ===
              0 ? (

                <div
                  style={{
                    padding:
                      '50px 20px',
                    textAlign:
                      'center',
                  }}
                >

                  <h3>
                    Start planning
                    your wedding.
                  </h3>

                  <p
                    style={{
                      color:
                        '#777',
                      margin:
                        '10px 0 20px',
                    }}
                  >
                    Create your first
                    wedding workspace
                    to begin organising
                    venues and requests.
                  </p>

                  <button
                    type="button"
                    className="primaryBtn"
                    onClick={() =>
                      setShowNewWedding(
                        true
                      )
                    }
                  >
                    Create wedding →
                  </button>

                </div>

              ) : (

                weddings
                  .slice(0, 5)
                  .map(
                    (
                      wedding
                    ) => (
                      <div
                        className="row"
                        key={
                          wedding.id
                        }
                      >

                        <span>

                          <b>
                            {
                              wedding.title
                            }
                          </b>

                          <small>
                            {
                              wedding.city ||
                              'Udaipur'
                            }{' '}
                            · Created{' '}
                            {formatDate(
                              wedding.created_at
                            )}
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


        {/* ==================================================
            MY WEDDINGS
        ================================================== */}

        {active ===
          'My Weddings' && (

          <div className="tableCard">

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
                marginBottom:
                  20,
              }}
            >

              <div>

                <span className="profileCardKicker">
                  WEDDING WORKSPACES
                </span>

                <h3>
                  My weddings
                </h3>

              </div>

              <button
                type="button"
                className="primaryBtn"
                onClick={() =>
                  setShowNewWedding(
                    true
                  )
                }
              >
                New wedding +
              </button>

            </div>


            {weddings.length ===
            0 ? (

              <div
                style={{
                  textAlign:
                    'center',
                  padding:
                    '60px 20px',
                }}
              >

                <h3>
                  No wedding
                  workspaces yet.
                </h3>

                <p
                  style={{
                    color:
                      '#777',
                    margin:
                      '10px 0 22px',
                  }}
                >
                  Create a wedding
                  workspace to start
                  planning.
                </p>

                <button
                  type="button"
                  className="primaryBtn"
                  onClick={() =>
                    setShowNewWedding(
                      true
                    )
                  }
                >
                  Create wedding →
                </button>

              </div>

            ) : (

              weddings.map(
                (wedding) => (
                  <div
                    className="row"
                    key={
                      wedding.id
                    }
                  >

                    <span>

                      <b>
                        {
                          wedding.title
                        }
                      </b>

                      <small>
                        {
                          wedding.city ||
                          'Udaipur'
                        }{' '}
                        · Created{' '}
                        {formatDate(
                          wedding.created_at
                        )}
                      </small>

                    </span>

                    <em>
                      {
                        shortlist.length
                      }{' '}
                      shortlisted
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


        {/* ==================================================
            SHORTLIST
        ================================================== */}

        {active ===
          'Shortlist' && (

          <div className="tableCard">

            <div
              style={{
                marginBottom:
                  24,
              }}
            >

              <span className="profileCardKicker">
                SAVED VENUES
              </span>

              <h3>
                Your shortlist
              </h3>

              <p
                style={{
                  color:
                    '#777',
                  marginTop:
                    8,
                }}
              >
                Venues you have saved
                while exploring The
                Venue Search.
              </p>

            </div>


            {shortlist.length ===
            0 ? (

              <div
                style={{
                  textAlign:
                    'center',
                  padding:
                    '60px 20px',
                }}
              >

                <h3>
                  Your shortlist
                  is empty.
                </h3>

                <p
                  style={{
                    color:
                      '#777',
                    margin:
                      '10px 0 22px',
                  }}
                >
                  Explore venues and
                  save the ones you
                  love.
                </p>

                <a
                  href="/explore"
                  className="primaryBtn"
                >
                  Explore venues →
                </a>

              </div>

            ) : (

              shortlist.map(
                (item) => {

                  const venue =
                    item.venue;

                  if (!venue) {
                    return null;
                  }

                  return (
                    <div
                      className="row"
                      key={
                        item.id
                      }
                    >

                      <span>

                        <b>
                          {
                            venue.name
                          }
                        </b>

                        <small>
                          {
                            venue.type ||
                            'Venue'
                          }{' '}
                          ·{' '}
                          {
                            venue.city ||
                            'Udaipur'
                          }
                        </small>

                      </span>

                      <em>
                        {venue.capacity_max
                          ? `Up to ${venue.capacity_max} guests`
                          : 'Capacity on request'}
                      </em>

                      <a
                        href={`/venues/${venue.slug}`}
                      >
                        Open →
                      </a>

                    </div>
                  );
                }
              )

            )}

          </div>

        )}


        {/* ==================================================
            REQUESTS
        ================================================== */}

        {active ===
          'Requests' && (

          <div className="tableCard">

            <div
              style={{
                marginBottom:
                  24,
              }}
            >

              <span className="profileCardKicker">
                VENUE REQUESTS
              </span>

              <h3>
                Your requests
              </h3>

              <p
                style={{
                  color:
                    '#777',
                  marginTop:
                    8,
                }}
              >
                Track your venue
                availability and
                booking requests.
              </p>

            </div>


            {requests.length ===
            0 ? (

              <div
                style={{
                  textAlign:
                    'center',
                  padding:
                    '60px 20px',
                }}
              >

                <h3>
                  No requests yet.
                </h3>

                <p
                  style={{
                    color:
                      '#777',
                    margin:
                      '10px 0 22px',
                  }}
                >
                  When you request
                  a venue, it will
                  appear here.
                </p>

                <a
                  href="/explore"
                  className="primaryBtn"
                >
                  Explore venues →
                </a>

              </div>

            ) : (

              requests.map(
                (request) => (
                  <div
                    className="row"
                    key={
                      request.id
                    }
                  >

                    <span>

                      <b>
                        {
                          request
                            .venue
                            ?.name ||
                          'Venue request'
                        }
                      </b>

                      <small>
                        {request.event_type ||
                          'Wedding / Event'}
                        {' · '}
                        {formatDate(
                          request.event_date
                        )}
                        {request.guest_count
                          ? ` · ${request.guest_count} guests`
                          : ''}
                      </small>

                    </span>

                    <em>
                      {formatStatus(
                        request.status
                      )}
                    </em>

                    <a
                      href={
                        request.venue
                          ?.slug
                          ? `/venues/${request.venue.slug}`
                          : '/explore'
                      }
                    >
                      Open →
                    </a>

                  </div>
                )
              )

            )}

          </div>

        )}


        {/* ==================================================
            CALENDAR
        ================================================== */}

        {active ===
          'Calendar' && (

          <div className="tableCard">

            <div
              style={{
                marginBottom:
                  24,
              }}
            >

              <span className="profileCardKicker">
                IMPORTANT DATES
              </span>

              <h3>
                Wedding calendar
              </h3>

              <p
                style={{
                  color:
                    '#777',
                  marginTop:
                    8,
                }}
              >
                Your held and requested
                venue dates.
              </p>

            </div>


            {requests.length ===
            0 ? (

              <div
                style={{
                  textAlign:
                    'center',
                  padding:
                    '60px 20px',
                }}
              >

                <h3>
                  No dates to show.
                </h3>

                <p
                  style={{
                    color:
                      '#777',
                    marginTop:
                    10,
                  }}
                >
                  Dates will appear
                  here when you make
                  venue requests or
                  place a hold.
                </p>

              </div>

            ) : (

              requests.map(
                (request) => (
                  <div
                    className="row"
                    key={
                      request.id
                    }
                  >

                    <span>

                      <b>
                        {
                          request
                            .venue
                            ?.name ||
                          'Venue'
                        }
                      </b>

                      <small>
                        {
                          request.event_type ||
                          'Wedding / Event'
                        }
                        {' · '}
                        {
                          request
                            .guest_count ||
                          'Guest count pending'
                        }{' '}
                        guests
                      </small>

                    </span>

                    <em>
                      {formatDate(
                        request.event_date
                      )}
                    </em>

                    <button
                      type="button"
                      onClick={() =>
                        setActive(
                          'Requests'
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

      </section>


      {/* ====================================================
          NEW WEDDING MODAL
      ==================================================== */}

      {showNewWedding && (

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-wedding-title"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowNewWedding(
                false
              );
            }
          }}
          style={{
            position:
              'fixed',
            inset: 0,
            zIndex: 1000,
            background:
              'rgba(0,0,0,0.48)',
            display:
              'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            padding: 20,
          }}
        >

          <div
            style={{
              width:
                '100%',
              maxWidth:
                520,
              background:
                '#fff',
              borderRadius:
                18,
              padding:
                '34px',
              boxShadow:
                '0 30px 80px rgba(0,0,0,0.18)',
            }}
          >

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'flex-start',
                gap: 20,
                marginBottom:
                  26,
              }}
            >

              <div>

                <span className="kicker">
                  NEW WORKSPACE
                </span>

                <h2
                  id="new-wedding-title"
                  style={{
                    marginTop:
                      8,
                    marginBottom:
                      8,
                  }}
                >
                  Create your wedding.
                </h2>

                <p
                  style={{
                    color:
                      '#777',
                    margin: 0,
                    lineHeight:
                      1.6,
                  }}
                >
                  Start a dedicated
                  workspace for your
                  wedding planning.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowNewWedding(
                    false
                  )
                }
                aria-label="Close"
                style={{
                  border:
                    'none',
                  background:
                    'transparent',
                  fontSize:
                    24,
                  cursor:
                    'pointer',
                  lineHeight:
                    1,
                }}
              >
                ×
              </button>

            </div>


            <label
              style={{
                display:
                  'block',
                marginBottom:
                  18,
              }}
            >

              <span
                style={{
                  display:
                    'block',
                  fontSize:
                    13,
                  fontWeight:
                    600,
                  marginBottom:
                    8,
                }}
              >
                Wedding name
              </span>

              <input
                type="text"
                value={
                  weddingTitle
                }
                onChange={(event) =>
                  setWeddingTitle(
                    event.target
                      .value
                  )
                }
                placeholder="e.g. Sharma × Mehta"
                autoFocus
                disabled={
                  creatingWedding
                }
                style={{
                  width:
                    '100%',
                  boxSizing:
                    'border-box',
                  padding:
                    '14px 16px',
                  border:
                    '1px solid #ddd',
                  borderRadius:
                    10,
                  fontSize:
                    15,
                  outline:
                    'none',
                }}
              />

            </label>


            <label
              style={{
                display:
                  'block',
                marginBottom:
                  24,
              }}
            >

              <span
                style={{
                  display:
                    'block',
                  fontSize:
                    13,
                  fontWeight:
                    600,
                  marginBottom:
                    8,
                }}
              >
                Destination
              </span>

              <input
                type="text"
                value={
                  weddingCity
                }
                onChange={(event) =>
                  setWeddingCity(
                    event.target
                      .value
                  )
                }
                placeholder="Udaipur"
                disabled={
                  creatingWedding
                }
                style={{
                  width:
                    '100%',
                  boxSizing:
                    'border-box',
                  padding:
                    '14px 16px',
                  border:
                    '1px solid #ddd',
                  borderRadius:
                    10,
                  fontSize:
                    15,
                  outline:
                    'none',
                }}
              />

            </label>


            {actionMessage &&
              !creatingWedding && (

              <div
                style={{
                  marginBottom:
                    18,
                  padding:
                    '12px 14px',
                  background:
                    '#fff6f4',
                  border:
                    '1px solid #f0d7d1',
                  borderRadius:
                    8,
                  fontSize:
                    13,
                }}
              >
                {actionMessage}
              </div>

            )}


            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'flex-end',
                gap: 10,
              }}
            >

              <button
                type="button"
                className="outlineBtn"
                disabled={
                  creatingWedding
                }
                onClick={() =>
                  setShowNewWedding(
                    false
                  )
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="primaryBtn"
                disabled={
                  creatingWedding ||
                  !weddingTitle.trim()
                }
                onClick={
                  createWedding
                }
              >
                {creatingWedding
                  ? 'Creating...'
                  : 'Create wedding →'}
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}