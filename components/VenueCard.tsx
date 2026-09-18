'use client';

import Link from 'next/link';
import {
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase-browser';

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
}: {
  v: VenueCardData;
}) {
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
            .from('wishlists')
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

  async function toggleWishlist() {
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
            .from('wishlists')
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
          .from('wishlists')
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
   * CARD
   * ========================================================
   */

  return (
    <article className="venueCard">

      <div className="venueImg">

        {v.image ? (

          <img
            src={v.image}
            alt={v.name}
            loading="lazy"
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


        <Link
          href={`/venues/${v.slug}`}
        >
          <h3>
            {v.name}
          </h3>
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
          >
            View venue
          </Link>

        </div>

      </div>

    </article>
  );
}