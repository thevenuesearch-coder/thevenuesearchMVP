'use client';

import Link from 'next/link';
import {
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase-browser';
import { imgProps } from '../lib/image';

type VenueCardData = {
  id: string;
  slug: string;
  name: string;
  city: string;
  type: string;
  capacity: number;
  capacityMin: number | null;
  description: string;
  image: string;
  rating: number | null;
  verified: boolean;
  tags: string[];
};

export function VenueCard({
  v,
  headingLevel = 3,
}: {
  v: VenueCardData;
  /*
   * Heading level for the venue name. 3 suits cards under a section
   * heading (home page); pass 2 where the cards sit directly under
   * the page's <h1> (explore page) so the outline has no gaps.
   */
  headingLevel?: 2 | 3;
}) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3';

  const router = useRouter();

  const [saved, setSaved] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [checkingWishlist, setCheckingWishlist] =
    useState(true);

  /*
   * ========================================================
   * CHECK CURRENT WISHLIST STATE
   * ========================================================
   */

  useEffect(() => {
    let mounted = true;

    async function checkWishlist() {
      try {
        const supabase =
          createClient();

        /*
         * Use the current session rather than
         * assuming the user is logged in.
         */

        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        if (!mounted) return;

        if (!session?.user) {
          setSaved(false);
          setCheckingWishlist(false);
          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from('wishlist')
            .select('id')
            .eq(
              'user_id',
              session.user.id
            )
            .eq(
              'venue_id',
              v.id
            )
            .maybeSingle();

        if (error) {
          console.warn(
            'Wishlist check warning:',
            {
              message:
                error.message,
              details:
                error.details,
              hint:
                error.hint,
              code:
                error.code,
            }
          );

          if (mounted) {
            setSaved(false);
          }

          return;
        }

        if (mounted) {
          setSaved(Boolean(data));
        }
      } catch (error) {
        console.error(
          'Wishlist check error:',
          error
        );
      } finally {
        if (mounted) {
          setCheckingWishlist(false);
        }
      }
    }

    checkWishlist();

    return () => {
      mounted = false;
    };
  }, [v.id]);


  /*
   * ========================================================
   * WISHLIST TOGGLE
   * ========================================================
   */

  async function toggleWishlist(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    /*
     * Prevent the card click from redirecting
     * when the wishlist button is clicked.
     */
    event.preventDefault();
    event.stopPropagation();

    if (
      loading ||
      checkingWishlist
    ) {
      return;
    }

    try {
      setLoading(true);

      const supabase =
        createClient();

      /*
       * Get the current session.
       */

      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      /*
       * User is not authenticated.
       */

      if (!session?.user) {
        router.push('/login');
        return;
      }

      const userId =
        session.user.id;

      /*
       * ====================================================
       * REMOVE
       * ====================================================
       */

      if (saved) {
        const {
          error,
        } =
          await supabase
            .from('wishlist')
            .delete()
            .eq(
              'user_id',
              userId
            )
            .eq(
              'venue_id',
              v.id
            );

        if (error) {
          console.error(
            'Wishlist remove error:',
            {
              message:
                error.message,
              details:
                error.details,
              hint:
                error.hint,
              code:
                error.code,
            }
          );

          return;
        }

        setSaved(false);

        return;
      }

      /*
       * ====================================================
       * ADD
       * ====================================================
       */

      const {
        error,
      } =
        await supabase
          .from('wishlist')
          .insert({
            user_id:
              userId,
            venue_id:
              v.id,
          });

      if (error) {
        /*
         * Handle duplicate wishlist records gracefully.
         */

        if (
          error.code ===
          '23505'
        ) {
          setSaved(true);
          return;
        }

        console.error(
          'Wishlist insert error:',
          {
            message:
              error.message,
            details:
              error.details,
            hint:
              error.hint,
            code:
              error.code,
          }
        );

        return;
      }

      setSaved(true);
    } catch (error) {
      console.error(
        'Wishlist toggle error:',
        error
      );
    } finally {
      setLoading(false);
    }
  }


  /*
   * ========================================================
   * CARD CLICK
   * ========================================================
   */


  /*
   * ========================================================
   * CARD
   * ========================================================
   */

  return (
    <article className="venueCard">

      <div className="venueImg">

        {v.image ? (

          <img
            {...imgProps(
              v.image,
              v.city
                ? `${v.name}, ${v.city}`
                : v.name,
              {
                width: 800,
                height: 620,
                sizes:
                  '(max-width: 600px) 100vw, (max-width: 900px) 50vw, 410px',
              }
            )}
          />

        ) : (

          <div
            style={{
              width: '100%',
              height: '100%',
              minHeight: '300px',
              background:
                '#eeeae3',
              display: 'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              color: '#777',
            }}
          >
            The Venue Search
          </div>

        )}


        {v.verified && (

          <span className="verified">
            ✓ Verified
          </span>

        )}


        <button
          className="heart"
          type="button"
          aria-label={
            saved
              ? `Remove ${v.name} from shortlist`
              : `Add ${v.name} to shortlist`
          }
          aria-pressed={saved}
          disabled={
            loading ||
            checkingWishlist
          }
          onClick={
            toggleWishlist
          }
        >
          {loading
            ? '…'
            : saved
              ? '♥'
              : '♡'}
        </button>

      </div>


      <div className="venueBody">

        <div className="eyebrow">
          {v.type} · {v.city}
        </div>


        {/*
          * The title link is stretched over the whole card with CSS
          * (.venueCardLink::after in globals.css), so clicking
          * anywhere on the card still opens the venue -- without a
          * click handler on a non-interactive element, and with a
          * single keyboard tab stop for the card.
          */}
        <Link
          className="venueCardLink"
          href={`/venues/${v.slug}`}
        >
          <Heading>
            {v.name}
          </Heading>
        </Link>


        <p>
          {v.description}
        </p>


        <div className="meta">

          <span>
            {v.capacityMin
              ? `${v.capacityMin} – `
              : 'Up to '}

            {v.capacity.toLocaleString()}

            {' guests'}
          </span>

          {v.rating && (
            <span>
              ★ {v.rating}
            </span>
          )}

        </div>


        <div className="venueCtaRow">

          <span className="verifiedLabel">
            Verified venue profile
          </span>

          <Link
            data-cursor="view"
            className="smallBtn"
            href={`/venues/${v.slug}`}
            aria-label={`View venue: ${v.name}`}
          >
            View venue
          </Link>

        </div>

      </div>

    </article>
  );
}