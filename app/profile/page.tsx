'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase-browser';
import { venues as localVenues } from '../../lib/data';

type LocalVenue = {
  id: string;
  name: string;
  city?: string;
  type?: string;
  tags?: string[];
  capacity?: number;
  image?: string;
  rating?: number;
  desc?: string;
};

type DbVenue = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  type: string | null;
  description: string | null;
  capacity_min: number | null;
  capacity_max: number | null;
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

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(true);

  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const supabase = createClient();

        /*
         * ====================================================
         * GET CURRENT USER
         * ====================================================
         */

        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !currentUser) {
          if (mounted) {
            router.replace('/login');
          }
          return;
        }

        if (!mounted) return;

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

        if (mounted) {
          setProfile(profileData || null);
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
          .from('wishlists')
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
         * GET WISHLIST VENUE IDS
         * ====================================================
         */

        const venueIds = (wishlistData || [])
          .map((item) => item.venue_id)
          .filter(Boolean);

        /*
         * If there are no saved venues
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
         * LOAD VENUES FROM SUPABASE
         * ====================================================
         *
         * IMPORTANT:
         * Only request columns that actually exist in the
         * current public.venues table.
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

          /*
           * Even if the Supabase venue query fails,
           * don't hide the wishlist count.
           */

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
         * BUILD VENUE MAP
         * ====================================================
         */

        const venueMap = new Map<string, DbVenue>();

        (venueData || []).forEach((venue) => {
          venueMap.set(venue.id, venue);
        });

        /*
         * ====================================================
         * COMBINE SUPABASE VENUES WITH LOCAL VENUE DATA
         * ====================================================
         *
         * The website's local data contains presentation
         * information such as images and ratings.
         *
         * Supabase contains the wishlist relationship and
         * database venue information.
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

            /*
             * Match local venue using:
             * 1. slug
             * 2. local id
             * 3. name
             */

            const localVenue = (localVenues as LocalVenue[]).find(
              (local) =>
                local.id === dbVenue.slug ||
                local.id === dbVenue.id ||
                local.name.toLowerCase() ===
                  dbVenue.name.toLowerCase()
            );

            /*
             * Normalize type because Supabase currently
             * stores venue.type as TEXT, not TEXT[].
             */

            const type =
              dbVenue.type ||
              localVenue?.type ||
              localVenue?.tags?.[0] ||
              'Venue';

            /*
             * Use database description first,
             * then local description.
             */

            const description =
              dbVenue.description ||
              localVenue?.desc ||
              '';

            /*
             * Use the local venue image because the current
             * Supabase venues table doesn't have an images
             * column.
             */

            const image =
              localVenue?.image ||
              null;

            /*
             * Use local rating because the current database
             * doesn't have a rating column.
             */

            const rating =
              localVenue?.rating ||
              null;

            /*
             * Capacity fallback:
             *
             * Supabase has min/max.
             * Local data has capacity.
             */

            let capacityMin =
              dbVenue.capacity_min;

            let capacityMax =
              dbVenue.capacity_max;

            if (
              !capacityMax &&
              localVenue?.capacity
            ) {
              capacityMax =
                localVenue.capacity;
            }

            return {
              id: item.id,
              venue_id: item.venue_id,
              created_at: item.created_at,

              venue: {
                id: dbVenue.id,
                name: dbVenue.name,
                city:
                  dbVenue.city ||
                  localVenue?.city ||
                  'India',
                type,
                description,
                capacity_min: capacityMin,
                capacity_max: capacityMax,
                image,
                rating,
              },
            };
          });

        /*
         * ====================================================
         * SAVE DATA
         * ====================================================
         */

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
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
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
        .from('wishlists')
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


          {/* ==================================================
              LOADING
          ================================================== */}

          {wishlistLoading ? (

            <div className="profileShortlistEmpty">

              <p>
                Loading your shortlisted venues...
              </p>

            </div>

          ) : wishlist.length === 0 ? (

            /* ==================================================
               EMPTY
            ================================================== */

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

            /* ==================================================
               VENUE GRID
            ================================================== */

            <div className="profileShortlistGrid">

              {wishlist.map((item) => {

                const venue =
                  item.venue;

                /*
                 * If the wishlist exists but the venue
                 * cannot be found, show a useful message
                 * instead of silently returning null.
                 */

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

                    {/* ==================================================
                        IMAGE
                    ================================================== */}

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


                      {/* Remove button */}

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


                    {/* ==================================================
                        VENUE CONTENT
                    ================================================== */}

                    <div className="profileVenueContent">

                      <span className="profileVenueLocation">

                        {venue.city ||
                          'India'}

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


                      {/* Venue type */}

                      {venue.type && (

                        <div className="profileVenueTags">

                          <span>
                            {venue.type}
                          </span>

                        </div>

                      )}


                      {/* View venue */}

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