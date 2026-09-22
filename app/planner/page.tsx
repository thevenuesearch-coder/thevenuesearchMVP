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
  user_id: string | null;
  venue_id: string;
  created_at: string;
  event_date: string | null;
  event_type: string | null;
  guest_count: number | null;
  notes: string | null;
  status: string | null;
  payment_order_id: string | null;
  payment_id: string | null;
  booking_type: string | null;
  checkin_date: string | null;
  checkout_date: string | null;
  num_rooms: number | null;
  room_guest_count: number | null;
  room_type: string | null;
  guest_details: unknown;
  full_name: string | null;
  email: string | null;
  mobile: string | null;
  venue_space_id: string | null;
  venue_space_name: string | null;
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
           ALL CUSTOMER BOOKING REQUESTS
           The planner is the admin workspace, so it must load
           booking records from all customers rather than only
           the currently signed-in admin user.
        --------------------------------------------- */

        /*
         * Admin bookings are loaded through a server-side endpoint.
         * The browser's Supabase RLS policies intentionally protect
         * customer booking rows, so the admin page must not try to
         * bypass RLS from the browser.
         */
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        let requestData: any[] = [];
        let requestError: any = null;

        if (currentSession?.access_token) {
          const bookingResponse = await fetch(
            '/api/admin/booking-requests',
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${currentSession.access_token}`,
              },
              cache: 'no-store',
            }
          );

          const bookingResult = await bookingResponse.json();

          if (!bookingResponse.ok) {
            requestError = new Error(
              bookingResult?.error ||
                'Unable to load booking requests.'
            );
          } else {
            requestData = Array.isArray(
              bookingResult?.bookings
            )
              ? bookingResult.bookings
              : [];
          }
        } else {
          requestError = new Error(
            'Admin session is unavailable.'
          );
        }

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
              user_id: item.user_id || null,
              venue_id: item.venue_id,
              created_at: item.created_at,
              event_date: item.event_date,
              event_type: item.event_type,
              guest_count: item.guest_count,
              notes: item.notes,
              status: item.status,
              payment_order_id: item.payment_order_id || null,
              payment_id: item.payment_id || null,
              booking_type: item.booking_type || null,
              checkin_date: item.checkin_date || null,
              checkout_date: item.checkout_date || null,
              num_rooms: item.num_rooms || null,
              room_guest_count: item.room_guest_count || null,
              room_type: item.room_type || null,
              guest_details: item.guest_details ?? null,
              full_name: item.full_name || null,
              email: item.email || null,
              mobile: item.mobile || null,
              venue_space_id: item.venue_space_id || null,
              venue_space_name: item.venue_space_name || null,

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
                  Review paid venue and room bookings before confirming them.
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
                  Paid customer bookings will appear here.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gap: '16px',
                }}
              >
                {requests.map((request) => {
                  const isRoomBooking =
                    request.booking_type === 'room' ||
                    Boolean(request.checkin_date) ||
                    Boolean(request.checkout_date) ||
                    Boolean(request.num_rooms);

                  const displayStatus =
                    String(request.status || '').toLowerCase() === 'confirmed'
                      ? 'Under Review'
                      : request.status || 'Under Review';

                  return (
                    <article
                      key={request.id}
                      style={{
                        border: '1px solid #e7e2da',
                        borderRadius: '18px',
                        padding: '24px',
                        background: '#fff',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '18px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <span className="kicker">
                            {isRoomBooking
                              ? 'ROOM BOOKING'
                              : 'VENUE BOOKING'}
                          </span>

                          <h3
                            style={{
                              margin: '7px 0 5px',
                              fontSize: '24px',
                            }}
                          >
                            {request.venue?.name || 'Venue'}
                          </h3>

                          <p
                            style={{
                              margin: 0,
                              color: '#6b6b6b',
                            }}
                          >
                            {request.venue?.city || 'India'}
                          </p>
                        </div>

                        <span
                          style={{
                            padding: '8px 13px',
                            borderRadius: '999px',
                            background: '#fff7e6',
                            color: '#9a6700',
                            fontWeight: 600,
                            fontSize: '13px',
                          }}
                        >
                          {displayStatus}
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: '20px',
                          display: 'grid',
                          gridTemplateColumns:
                            'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '1px',
                          background: '#e7e2da',
                          border: '1px solid #e7e2da',
                        }}
                      >
                        {!isRoomBooking ? (
                          <>
                            <div style={{ background: '#fff', padding: '15px' }}>
                              <small>Event date</small>
                              <strong style={{ display: 'block', marginTop: '5px' }}>
                                {request.event_date
                                  ? new Date(request.event_date + 'T00:00:00').toLocaleDateString(
                                      'en-IN',
                                      { day: 'numeric', month: 'short', year: 'numeric' }
                                    )
                                  : '—'}
                              </strong>
                            </div>

                            <div style={{ background: '#fff', padding: '15px' }}>
                              <small>Event type</small>
                              <strong style={{ display: 'block', marginTop: '5px' }}>
                                {request.event_type || '—'}
                              </strong>
                            </div>

                            <div style={{ background: '#fff', padding: '15px' }}>
                              <small>Guests</small>
                              <strong style={{ display: 'block', marginTop: '5px' }}>
                                {request.guest_count || '—'}
                              </strong>
                            </div>

                            <div style={{ background: '#fff', padding: '15px' }}>
                              <small>Venue space</small>
                              <strong style={{ display: 'block', marginTop: '5px' }}>
                                {request.venue_space_name || request.venue_space_id || '—'}
                              </strong>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ background: '#fff', padding: '15px' }}>
                              <small>Check-in</small>
                              <strong style={{ display: 'block', marginTop: '5px' }}>
                                {request.checkin_date
                                  ? new Date(request.checkin_date + 'T00:00:00').toLocaleDateString(
                                      'en-IN',
                                      { day: 'numeric', month: 'short', year: 'numeric' }
                                    )
                                  : '—'}
                              </strong>
                            </div>

                            <div style={{ background: '#fff', padding: '15px' }}>
                              <small>Check-out</small>
                              <strong style={{ display: 'block', marginTop: '5px' }}>
                                {request.checkout_date
                                  ? new Date(request.checkout_date + 'T00:00:00').toLocaleDateString(
                                      'en-IN',
                                      { day: 'numeric', month: 'short', year: 'numeric' }
                                    )
                                  : '—'}
                              </strong>
                            </div>

                            <div style={{ background: '#fff', padding: '15px' }}>
                              <small>Rooms</small>
                              <strong style={{ display: 'block', marginTop: '5px' }}>
                                {request.num_rooms || '—'}
                              </strong>
                            </div>

                            <div style={{ background: '#fff', padding: '15px' }}>
                              <small>Room category</small>
                              <strong style={{ display: 'block', marginTop: '5px' }}>
                                {request.room_type || '—'}
                              </strong>
                            </div>

                            <div style={{ background: '#fff', padding: '15px' }}>
                              <small>Guests</small>
                              <strong style={{ display: 'block', marginTop: '5px' }}>
                                {request.room_guest_count || '—'}
                              </strong>
                            </div>
                          </>
                        )}
                      </div>

                      <div
                        style={{
                          marginTop: '18px',
                          display: 'grid',
                          gridTemplateColumns:
                            'repeat(auto-fit, minmax(220px, 1fr))',
                          gap: '14px 24px',
                        }}
                      >
                        <div>
                          <small>Customer</small>
                          <strong style={{ display: 'block', marginTop: '5px' }}>
                            {request.full_name || '—'}
                          </strong>
                        </div>

                        <div>
                          <small>Email</small>
                          <strong style={{ display: 'block', marginTop: '5px' }}>
                            {request.email || '—'}
                          </strong>
                        </div>

                        <div>
                          <small>Mobile</small>
                          <strong style={{ display: 'block', marginTop: '5px' }}>
                            {request.mobile || '—'}
                          </strong>
                        </div>

                        <div>
                          <small>Payment</small>
                          <strong style={{ display: 'block', marginTop: '5px' }}>
                            {request.payment_id
                              ? 'Paid'
                              : request.payment_order_id
                                ? 'Payment pending'
                                : '—'}
                          </strong>
                        </div>

                        <div>
                          <small>Booking ID</small>
                          <strong
                            style={{
                              display: 'block',
                              marginTop: '5px',
                              fontSize: '13px',
                              wordBreak: 'break-all',
                            }}
                          >
                            {request.id}
                          </strong>
                        </div>
                      </div>

                      {request.notes && (
                        <div
                          style={{
                            marginTop: '18px',
                            padding: '14px 16px',
                            background: '#f8f6f2',
                            border: '1px solid #ece9e4',
                            borderRadius: '10px',
                          }}
                        >
                          <small>Notes</small>
                          <p
                            style={{
                              margin: '6px 0 0',
                              lineHeight: 1.6,
                            }}
                          >
                            {request.notes}
                          </p>
                        </div>
                      )}

                      <div
                        style={{
                          marginTop: '22px',
                          display: 'flex',
                          justifyContent: 'flex-end',
                        }}
                      >
                        <button
                          type="button"
                          className="primaryBtn"
                          onClick={() => {
                            /*
                             * Admin confirmation action will be connected
                             * to the existing booking status flow separately.
                             */
                            window.alert(
                              'Booking confirmation action is ready to be connected.'
                            );
                          }}
                        >
                          Confirm
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
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