'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase-browser';

type DbVenue = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  type: string | null;
  description: string | null;
  capacity_min: number | null;
  capacity_max: number | null;
  hero_image: string | null;
  rating: number | null;
  status: string | null;
};

type DisplayVenue = {
  id: string;
  name: string;
  city: string;
  type: string;
  description: string;
  capacity_min: number | null;
  capacity_max: number | null;
  image: string | null;
  rating: number | null;
};

type WishlistItem = {
  id: string;
  venue_id: string;
  created_at: string;
  venue: DisplayVenue | null;
};

type BookingRow = {
  id: string;
  wedding_id: string | null;
  venue_id: string | null;
  user_id: string | null;
  event_date: string | null;
  guest_count: number | null;
  event_type: string | null;
  mode: string | null;
  notes: string | null;
  status: string | null;
  payment_order_id: string | null;
  payment_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  booking_type?: string | null;
  checkin_date?: string | null;
  checkout_date?: string | null;
  num_rooms?: number | null;
  room_guest_count?: number | null;
  room_type?: string | null;
  guest_details?: unknown;
};

type BookingDisplay = BookingRow & {
  venue: DisplayVenue | null;
};

function formatBookingDate(date: string | null | undefined) {
  if (!date) return '—';

  const parsed = new Date(date + 'T00:00:00');

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatBookingStatus(status: string | null | undefined) {
  const normalized = (status || '').replace(/_/g, ' ').trim();

  if (!normalized) return 'Under Review';

  /*
   * A successful payment currently moves the booking row to
   * "confirmed" in the existing payment workflow. The customer
   * dashboard must not present that as final venue confirmation,
   * because the venue/admin still needs to review the booking.
   *
   * This is display-only: it does not change the booking,
   * payment, availability, or admin workflow.
   */
  if (normalized.toLowerCase() === 'confirmed') {
    return 'Under Review';
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function isRoomBooking(booking: BookingRow) {
  return (
    booking.booking_type === 'room' ||
    Boolean(booking.checkin_date) ||
    Boolean(booking.checkout_date) ||
    Boolean(booking.num_rooms)
  );
}


export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [bookings, setBookings] = useState<BookingDisplay[]>([]);

  const [loading, setLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const supabase = createClient();

    /*
     * ========================================================
     * LOAD PROFILE + WISHLIST
     * ========================================================
     */

    async function loadProfile(currentUser: any) {
      if (!currentUser || !mounted) return;

      try {
        setUser(currentUser);

        /*
         * ====================================================
         * LOAD PROFILE
         * ====================================================
         */

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from('profiles')
          .select(
            'full_name, email, mobile, role, created_at'
          )
          .eq('id', currentUser.id)
          .maybeSingle();

        if (profileError) {
          console.warn(
            'Profile loading warning:',
            {
              message: profileError.message,
              details: profileError.details,
              hint: profileError.hint,
              code: profileError.code,
            }
          );
        }

        if (!mounted) return;

        setProfile(profileData || null);


        /*
         * ====================================================
         * LOAD MY BOOKINGS
         * ====================================================
         *
         * The existing payment flow already creates rows in
         * booking_requests with the authenticated user's
         * user_id. This section only reads those rows for the
         * dashboard. It does not change payment, availability,
         * duplicate-booking, venue, or room-booking workflows.
         */

        const {
          data: bookingData,
          error: bookingError,
        } = await supabase
          .from('booking_requests')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', {
            ascending: false,
          });

        if (bookingError) {
          console.warn(
            'Bookings loading warning:',
            {
              message: bookingError.message,
              details: bookingError.details,
              hint: bookingError.hint,
              code: bookingError.code,
            }
          );

          if (mounted) {
            setBookings([]);
            setBookingsLoading(false);
          }
        } else {
          const bookingRows = (bookingData || []) as BookingRow[];

          const bookingVenueIds = Array.from(
            new Set(
              bookingRows
                .map((booking) => booking.venue_id)
                .filter(Boolean)
            )
          ) as string[];

          let bookingVenues: DbVenue[] = [];

          if (bookingVenueIds.length > 0) {
            const {
              data: venueData,
              error: bookingVenueError,
            } = await supabase
              .from('venues')
              .select(
                `
                  id,
                  name,
                  slug,
                  city,
                  type,
                  description,
                  capacity_min,
                  capacity_max,
                  hero_image,
                  rating,
                  status
                `
              )
              .in('id', bookingVenueIds);

            if (bookingVenueError) {
              console.warn(
                'Booking venue loading warning:',
                {
                  message: bookingVenueError.message,
                  details: bookingVenueError.details,
                  hint: bookingVenueError.hint,
                  code: bookingVenueError.code,
                }
              );
            } else {
              bookingVenues = (venueData || []) as DbVenue[];
            }
          }

          const bookingVenueMap = new Map<string, DbVenue>();

          bookingVenues.forEach((venue) => {
            bookingVenueMap.set(venue.id, venue);
          });

          const combinedBookings: BookingDisplay[] =
            bookingRows.map((booking) => {
              const dbVenue = booking.venue_id
                ? bookingVenueMap.get(booking.venue_id)
                : undefined;

              return {
                ...booking,
                venue: dbVenue
                  ? {
                      id: dbVenue.id,
                      name: dbVenue.name,
                      city: dbVenue.city || 'India',
                      type: dbVenue.type || 'Venue',
                      description: dbVenue.description || '',
                      capacity_min: dbVenue.capacity_min,
                      capacity_max: dbVenue.capacity_max,
                      image: dbVenue.hero_image,
                      rating: dbVenue.rating,
                    }
                  : null,
              };
            });

          if (mounted) {
            setBookings(combinedBookings);
            setBookingsLoading(false);
          }
        }

        /*
         * ====================================================
         * LOAD WISHLIST
         * ====================================================
         */

        const {
          data: wishlistData,
          error: wishlistError,
        } = await supabase
          .from('wishlist')
          .select(
            'id, venue_id, created_at'
          )
          .eq('user_id', currentUser.id)
          .order('created_at', {
            ascending: false,
          });

        if (wishlistError) {
          console.warn(
            'Wishlist loading warning:',
            {
              message: wishlistError.message,
              details: wishlistError.details,
              hint: wishlistError.hint,
              code: wishlistError.code,
            }
          );

          if (mounted) {
            setWishlist([]);
            setWishlistLoading(false);
            setLoading(false);
          }

          return;
        }

        /*
         * ====================================================
         * GET VENUE IDS
         * ====================================================
         */

        const venueIds = (wishlistData || [])
          .map((item) => item.venue_id)
          .filter(Boolean);

        /*
         * No shortlisted venues
         */

        if (venueIds.length === 0) {
          if (mounted) {
            setWishlist([]);
            setWishlistLoading(false);
            setLoading(false);
          }

          return;
        }

        /*
         * ====================================================
         * LOAD VENUES
         * ====================================================
         */

        const {
          data: venueData,
          error: venueError,
        } = await supabase
          .from('venues')
          .select(
            `
              id,
              name,
              slug,
              city,
              type,
              description,
              capacity_min,
              capacity_max,
              hero_image,
              rating,
              status
            `
          )
          .in('id', venueIds);

        if (venueError) {
          console.warn(
            'Venue loading warning:',
            {
              message: venueError.message,
              details: venueError.details,
              hint: venueError.hint,
              code: venueError.code,
            }
          );

          if (mounted) {
            setWishlist(
              (wishlistData || []).map((item) => ({
                id: item.id,
                venue_id: item.venue_id,
                created_at: item.created_at,
                venue: null,
              }))
            );

            setWishlistLoading(false);
            setLoading(false);
          }

          return;
        }

        /*
         * ====================================================
         * VENUE MAP
         * ====================================================
         */

        const venueMap = new Map<string, DbVenue>();

        (venueData || []).forEach((venue) => {
          venueMap.set(venue.id, venue);
        });

        /*
         * ====================================================
         * COMBINE DATABASE + LOCAL VENUE DATA
         * ====================================================
         */

        const combinedWishlist: WishlistItem[] =
          (wishlistData || []).map((item) => {
            const dbVenue = venueMap.get(item.venue_id);

            if (!dbVenue) {
              return {
                id: item.id,
                venue_id: item.venue_id,
                created_at: item.created_at,
                venue: null,
              };
            }

            return {
              id: item.id,
              venue_id: item.venue_id,
              created_at: item.created_at,

              venue: {
                id: dbVenue.id,
                name: dbVenue.name,
                city: dbVenue.city || 'India',
                type: dbVenue.type || 'Venue',
                description: dbVenue.description || '',
                capacity_min: dbVenue.capacity_min,
                capacity_max: dbVenue.capacity_max,
                image: dbVenue.hero_image,
                rating: dbVenue.rating,
              },
            };
          });

        if (mounted) {
          setWishlist(combinedWishlist);
          setWishlistLoading(false);
          setLoading(false);
        }

        /*
         * ====================================================
         * SCROLL TO SHORTLIST
         * ====================================================
         */

        if (
          typeof window !== 'undefined' &&
          window.location.hash === '#shortlist'
        ) {
          setTimeout(() => {
            document
              .getElementById('shortlist')
              ?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
          }, 300);
        }
      } catch (error) {
        console.error(
          'Profile loading error:',
          error
        );

        if (mounted) {
          setLoading(false);
          setWishlistLoading(false);
          setBookingsLoading(false);
        }
      }
    }

    /*
     * ========================================================
     * AUTHENTICATION
     * ========================================================
     *
     * IMPORTANT:
     * Use getSession() first instead of immediately
     * redirecting based on getUser().
     */

    async function initializeAuth() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          console.warn(
            'Session loading warning:',
            sessionError.message
          );
        }

        /*
         * If session exists, load the profile.
         */

        if (session?.user) {
          await loadProfile(session.user);
          return;
        }

        /*
         * Give Supabase a moment to restore the browser
         * session before redirecting.
         */

        setTimeout(async () => {
          if (!mounted) return;

          const {
            data: {
              session: restoredSession,
            },
          } = await supabase.auth.getSession();

          if (!mounted) return;

          if (restoredSession?.user) {
            await loadProfile(
              restoredSession.user
            );
          } else {
            router.replace('/login');
          }
        }, 500);
      } catch (error) {
        console.error(
          'Authentication initialization error:',
          error
        );

        if (mounted) {
          setLoading(false);
          setWishlistLoading(false);
        }
      }
    }

    /*
     * ========================================================
     * AUTH STATE LISTENER
     * ========================================================
     */

    const {
      data: {
        subscription,
      },
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (
          session?.user &&
          (
            event === 'SIGNED_IN' ||
            event === 'INITIAL_SESSION' ||
            event === 'TOKEN_REFRESHED'
          )
        ) {
          await loadProfile(
            session.user
          );
        }

        if (
          event === 'SIGNED_OUT'
        ) {
          router.replace('/login');
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  /*
   * ========================================================
   * REMOVE FROM SHORTLIST
   * ========================================================
   */

  async function removeFromShortlist(
    wishlistId: string
  ) {
    try {
      setRemovingId(wishlistId);

      const supabase = createClient();

      const {
        error,
      } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', wishlistId);

      if (error) {
        console.warn(
          'Remove shortlist warning:',
          {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          }
        );

        return;
      }

      setWishlist((currentWishlist) =>
        currentWishlist.filter(
          (item) =>
            item.id !== wishlistId
        )
      );
    } catch (error) {
      console.error(
        'Remove shortlist error:',
        error
      );
    } finally {
      setRemovingId(null);
    }
  }

  /*
   * ========================================================
   * LOADING
   * ========================================================
   */

  if (loading) {
    return (
      <main className="profilePage">
        <div className="profilePageLoading">
          Loading your profile...
        </div>
      </main>
    );
  }

  /*
   * ========================================================
   * USER DETAILS
   * ========================================================
   */

  const name =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.username ||
    'Guest';

  const email =
    profile?.email ||
    user?.email ||
    '';

  const mobile =
    profile?.mobile ||
    user?.user_metadata?.mobile ||
    user?.user_metadata?.phone ||
    'Not added';

  /*
   * ========================================================
   * PAGE
   * ========================================================
   */

  return (
    <main className="profilePage">

      <div className="profilePageInner">

        {/* ==================================================
            PROFILE INTRO
        ================================================== */}

        <div className="profilePageIntro">

          <span className="kicker">
            YOUR ACCOUNT
          </span>

          <h1>
            Welcome, {name.split(' ')[0]}.
          </h1>

          <p>
            Manage your account and keep track of
            the venues you're considering.
          </p>

        </div>


        {/* ==================================================
            PROFILE GRID
        ================================================== */}

        <div className="profileGrid">

          {/* ==================================================
              PERSONAL DETAILS
          ================================================== */}

          <section className="profileCard">

            <div className="profileCardHeading">

              <div>

                <span className="profileCardKicker">
                  ACCOUNT
                </span>

                <h2>
                  Personal details
                </h2>

              </div>

              <div className="profilePageAvatar">

                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="8"
                    r="3.5"
                  />

                  <path
                    d="M5 20c.8-3.8 3.2-5.8 7-5.8s6.2 2 7 5.8"
                  />
                </svg>

              </div>

            </div>


            <div className="profileDetails">

              <div className="profileDetail">

                <span>
                  Full name
                </span>

                <strong>
                  {name}
                </strong>

              </div>


              <div className="profileDetail">

                <span>
                  Email address
                </span>

                <strong>
                  {email}
                </strong>

              </div>


              <div className="profileDetail">

                <span>
                  Mobile number
                </span>

                <strong>
                  {mobile}
                </strong>

              </div>

            </div>

          </section>


          {/* ==================================================
              SHORTLIST SUMMARY
          ================================================== */}

          <section className="profileCard profileShortlistCard">

            <div className="profileCardHeading">

              <div>

                <span className="profileCardKicker">
                  YOUR VENUES
                </span>

                <h2>
                  Your shortlist
                </h2>

              </div>

              <span className="profileHeart">
                ♡
              </span>

            </div>


            <p className="profileCardDescription">

              {wishlist.length > 0
                ? `${wishlist.length} venue${
                    wishlist.length === 1
                      ? ''
                      : 's'
                  } saved to your shortlist.`
                : 'Your saved venues will appear here as you explore The Venue Search.'
              }

            </p>


            <Link
              href="/profile#shortlist"
              className="primaryBtn"
            >
              View my shortlist →
            </Link>

          </section>

        </div>



        {/* ==================================================
            MY BOOKINGS
        ================================================== */}

        <section
          id="bookings"
          className="profileShortlistSection"
          style={{
            marginTop: '36px',
          }}
        >

          <div className="profileSectionHeader">

            <div>

              <span className="profileCardKicker">
                BOOKING HISTORY
              </span>

              <h2>
                My Bookings
              </h2>

              <p>
                Your venue and room bookings, including dates, room details and payment status.
              </p>

            </div>

            <span className="profileShortlistCount">
              {bookings.length}
            </span>

          </div>


          {bookingsLoading ? (

            <div className="profileShortlistEmpty">
              <p>
                Loading your bookings...
              </p>
            </div>

          ) : bookings.length === 0 ? (

            <div className="profileShortlistEmpty">

              <div className="profileEmptyIcon">
                ◷
              </div>

              <h3>
                No bookings yet
              </h3>

              <p>
                Your venue and room bookings will appear here after you complete a booking.
              </p>

              <Link
                href="/explore"
                className="primaryBtn"
              >
                Explore venues →
              </Link>

            </div>

          ) : (

            <div
              style={{
                display: 'grid',
                gap: '18px',
              }}
            >

              {bookings.map((booking) => {

                const roomBooking = isRoomBooking(booking);
                const status = formatBookingStatus(booking.status);

                return (
                  <article
                    key={booking.id}
                    className="profileCard"
                    style={{
                      padding: '26px',
                    }}
                  >

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '20px',
                        flexWrap: 'wrap',
                      }}
                    >

                      <div>

                        <span className="profileCardKicker">
                          {roomBooking
                            ? 'ROOM BOOKING'
                            : 'VENUE BOOKING'}
                        </span>

                        <h3
                          style={{
                            margin: '7px 0 5px',
                            fontSize: '24px',
                          }}
                        >
                          {booking.venue?.name || 'Venue booking'}
                        </h3>

                        <p
                          style={{
                            margin: 0,
                            color: '#6b6b6b',
                          }}
                        >
                          {booking.venue?.city || 'India'}
                          {booking.venue?.type
                            ? ' · ' + booking.venue.type
                            : ''}
                        </p>

                      </div>

                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '8px 13px',
                          borderRadius: '999px',
                          background:
                            booking.status === 'confirmed'
                              ? '#fff7e6'
                              : '#f6f3ed',
                          color:
                            booking.status === 'confirmed'
                              ? '#9a6700'
                              : '#5f574d',
                          fontSize: '13px',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {status}
                      </span>

                    </div>


                    <div
                      style={{
                        marginTop: '22px',
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '1px',
                        background: '#ece9e4',
                        border: '1px solid #ece9e4',
                      }}
                    >

                      {!roomBooking && (
                        <>
                          <div
                            style={{
                              background: '#fff',
                              padding: '16px',
                            }}
                          >
                            <small
                              style={{
                                display: 'block',
                                color: '#8a857d',
                                marginBottom: '5px',
                              }}
                            >
                              Event date
                            </small>
                            <strong>
                              {formatBookingDate(booking.event_date)}
                            </strong>
                          </div>

                          <div
                            style={{
                              background: '#fff',
                              padding: '16px',
                            }}
                          >
                            <small
                              style={{
                                display: 'block',
                                color: '#8a857d',
                                marginBottom: '5px',
                              }}
                            >
                              Event type
                            </small>
                            <strong>
                              {booking.event_type || '—'}
                            </strong>
                          </div>

                          <div
                            style={{
                              background: '#fff',
                              padding: '16px',
                            }}
                          >
                            <small
                              style={{
                                display: 'block',
                                color: '#8a857d',
                                marginBottom: '5px',
                              }}
                            >
                              Guests
                            </small>
                            <strong>
                              {booking.guest_count
                                ? booking.guest_count.toLocaleString()
                                : '—'}
                            </strong>
                          </div>
                        </>
                      )}

                      {roomBooking && (
                        <>
                          <div
                            style={{
                              background: '#fff',
                              padding: '16px',
                            }}
                          >
                            <small
                              style={{
                                display: 'block',
                                color: '#8a857d',
                                marginBottom: '5px',
                              }}
                            >
                              Check-in
                            </small>
                            <strong>
                              {formatBookingDate(booking.checkin_date)}
                            </strong>
                          </div>

                          <div
                            style={{
                              background: '#fff',
                              padding: '16px',
                            }}
                          >
                            <small
                              style={{
                                display: 'block',
                                color: '#8a857d',
                                marginBottom: '5px',
                              }}
                            >
                              Check-out
                            </small>
                            <strong>
                              {formatBookingDate(booking.checkout_date)}
                            </strong>
                          </div>

                          <div
                            style={{
                              background: '#fff',
                              padding: '16px',
                            }}
                          >
                            <small
                              style={{
                                display: 'block',
                                color: '#8a857d',
                                marginBottom: '5px',
                              }}
                            >
                              Rooms
                            </small>
                            <strong>
                              {booking.num_rooms || '—'}
                            </strong>
                          </div>

                          <div
                            style={{
                              background: '#fff',
                              padding: '16px',
                            }}
                          >
                            <small
                              style={{
                                display: 'block',
                                color: '#8a857d',
                                marginBottom: '5px',
                              }}
                            >
                              Room category
                            </small>
                            <strong>
                              {booking.room_type || '—'}
                            </strong>
                          </div>

                          <div
                            style={{
                              background: '#fff',
                              padding: '16px',
                            }}
                          >
                            <small
                              style={{
                                display: 'block',
                                color: '#8a857d',
                                marginBottom: '5px',
                              }}
                            >
                              Guests
                            </small>
                            <strong>
                              {booking.room_guest_count || '—'}
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
                        <span
                          style={{
                            display: 'block',
                            color: '#8a857d',
                            fontSize: '12px',
                            marginBottom: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                          }}
                        >
                          Booking ID
                        </span>
                        <strong
                          style={{
                            fontSize: '13px',
                            wordBreak: 'break-all',
                          }}
                        >
                          {booking.id}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={{
                            display: 'block',
                            color: '#8a857d',
                            fontSize: '12px',
                            marginBottom: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                          }}
                        >
                          Payment
                        </span>
                        <strong>
                          {booking.payment_id
                            ? 'Paid'
                            : booking.payment_order_id
                              ? 'Payment pending'
                              : 'Not available'}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={{
                            display: 'block',
                            color: '#8a857d',
                            fontSize: '12px',
                            marginBottom: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                          }}
                        >
                          Booked on
                        </span>
                        <strong>
                          {formatBookingDate(
                            booking.created_at
                              ? booking.created_at.slice(0, 10)
                              : null
                          )}
                        </strong>
                      </div>

                    </div>


                    {booking.notes && (
                      <div
                        style={{
                          marginTop: '18px',
                          padding: '14px 16px',
                          background: '#f8f6f2',
                          border: '1px solid #ece9e4',
                        }}
                      >
                        <small
                          style={{
                            display: 'block',
                            color: '#8a857d',
                            marginBottom: '5px',
                          }}
                        >
                          Notes
                        </small>
                        <span
                          style={{
                            color: '#4f4b46',
                            lineHeight: 1.6,
                          }}
                        >
                          {booking.notes}
                        </span>
                      </div>
                    )}

                  </article>
                );
              })}

            </div>
          )}

        </section>


        {/* ==================================================
            SHORTLIST SECTION
        ================================================== */}

        <section
          id="shortlist"
          className="profileShortlistSection"
        >

          <div className="profileSectionHeader">

            <div>

              <span className="profileCardKicker">
                SAVED VENUES
              </span>

              <h2>
                Your shortlisted venues
              </h2>

              <p>
                Venues you've saved while exploring
                The Venue Search.
              </p>

            </div>


            <span className="profileShortlistCount">
              {wishlist.length}
            </span>

          </div>


          {wishlistLoading ? (

            <div className="profileShortlistEmpty">

              <p>
                Loading your shortlisted venues...
              </p>

            </div>

          ) : wishlist.length === 0 ? (

            <div className="profileShortlistEmpty">

              <div className="profileEmptyIcon">
                ♡
              </div>

              <h3>
                Your shortlist is empty
              </h3>

              <p>
                Save venues you love while exploring
                and they'll appear here.
              </p>

              <Link
                href="/explore"
                className="primaryBtn"
              >
                Explore venues →
              </Link>

            </div>

          ) : (

            <div className="profileShortlistGrid">

              {wishlist.map((item) => {

                const venue = item.venue;

                if (!venue) {
                  return (
                    <article
                      key={item.id}
                      className="profileVenueCard"
                    >

                      <div className="profileVenueContent">

                        <span className="profileVenueLocation">
                          Saved venue
                        </span>

                        <h3>
                          Venue unavailable
                        </h3>

                        <p>
                          This venue is no longer
                          available in the venue database.
                        </p>

                        <button
                          type="button"
                          className="smallBtn"
                          onClick={() =>
                            removeFromShortlist(
                              item.id
                            )
                          }
                          disabled={
                            removingId === item.id
                          }
                        >
                          {removingId === item.id
                            ? 'Removing…'
                            : 'Remove'}
                        </button>

                      </div>

                    </article>
                  );
                }

                return (
                  <article
                    key={item.id}
                    className="profileVenueCard"
                  >

                    <div className="profileVenueImage">

                      {venue.image ? (

                        <img
                          src={venue.image}
                          alt={venue.name}
                          loading="lazy"
                        />

                      ) : (

                        <div className="profileVenueImagePlaceholder">
                          The Venue Search
                        </div>

                      )}

                      <button
                        type="button"
                        className="profileVenueRemove"
                        onClick={() =>
                          removeFromShortlist(
                            item.id
                          )
                        }
                        disabled={
                          removingId === item.id
                        }
                        aria-label={`Remove ${venue.name} from shortlist`}
                      >
                        {removingId === item.id
                          ? '…'
                          : '♥'}
                      </button>

                    </div>


                    <div className="profileVenueContent">

                      <span className="profileVenueLocation">
                        {venue.city || 'India'}
                      </span>

                      <h3>
                        {venue.name}
                      </h3>

                      {venue.description && (
                        <p>
                          {venue.description}
                        </p>
                      )}

                      <div className="profileVenueMeta">

                        {(
                          venue.capacity_min ||
                          venue.capacity_max
                        ) && (

                          <span>

                            {venue.capacity_min
                              ? venue.capacity_min.toLocaleString()
                              : '—'}

                            {' – '}

                            {venue.capacity_max
                              ? venue.capacity_max.toLocaleString()
                              : '—'}

                            {' guests'}

                          </span>

                        )}

                        {venue.rating &&
                          venue.rating > 0 && (

                          <span>
                            ★ {venue.rating}
                          </span>

                        )}

                      </div>


                      {venue.type && (

                        <div className="profileVenueTags">

                          <span>
                            {venue.type}
                          </span>

                        </div>

                      )}


                      <Link
                        href={`/venues/${venue.id}`}
                        className="smallBtn"
                        data-cursor="view"
                      >
                        View venue →
                      </Link>

                    </div>

                  </article>
                );
              })}

            </div>
          )}

        </section>


        {/* ==================================================
            QUICK ACTIONS
        ================================================== */}

        <section className="profileQuickActions">

          <Link
            href="/profile#shortlist"
            className="profileQuickAction"
          >

            <span>
              ♡
            </span>

            <div>

              <strong>
                Shortlisted venues
              </strong>

              <small>
                View venues you've saved
              </small>

            </div>

            <b>
              →
            </b>

          </Link>


          <Link
            href="/book"
            className="profileQuickAction"
          >

            <span>
              ◷
            </span>

            <div>

              <strong>
                My enquiries
              </strong>

              <small>
                View your venue enquiries
              </small>

            </div>

            <b>
              →
            </b>

          </Link>


          <Link
            href="/explore"
            className="profileQuickAction"
          >

            <span>
              ⌕
            </span>

            <div>

              <strong>
                Explore venues
              </strong>

              <small>
                Discover your next venue
              </small>

            </div>

            <b>
              →
            </b>

          </Link>

        </section>

      </div>

    </main>
  );
}