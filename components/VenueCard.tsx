'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase-browser';

export function VenueCard({ v }: { v: any }) {
  const router = useRouter();

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingWishlist, setCheckingWishlist] = useState(true);
  const [dbVenueId, setDbVenueId] = useState<string | null>(null);

  /*
   * --------------------------------------------------------
   * FIND THE SUPABASE VENUE ID
   * --------------------------------------------------------
   *
   * Explore uses the local venue data from lib/data.
   * Supabase uses UUIDs for venue IDs.
   *
   * We first try the local v.id as a Supabase UUID.
   * If that doesn't work, we try the venue slug.
   * Finally, we try the venue name.
   */

  async function resolveVenueId() {
    const supabase = createClient();

    // First: try v.id directly if it looks like a UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (v?.id && uuidRegex.test(String(v.id))) {
      const {
        data,
        error,
      } = await supabase
        .from('venues')
        .select('id')
        .eq('id', v.id)
        .maybeSingle();

      if (!error && data?.id) {
        return data.id;
      }
    }

    // Second: try slug
    if (v?.id) {
      const {
        data,
        error,
      } = await supabase
        .from('venues')
        .select('id')
        .eq('slug', String(v.id))
        .maybeSingle();

      if (!error && data?.id) {
        return data.id;
      }
    }

    // Third: try name
    if (v?.name) {
      const {
        data,
        error,
      } = await supabase
        .from('venues')
        .select('id')
        .eq('name', v.name)
        .maybeSingle();

      if (!error && data?.id) {
        return data.id;
      }
    }

    return null;
  }

  /*
   * --------------------------------------------------------
   * CHECK WHETHER VENUE IS ALREADY SHORTLISTED
   * --------------------------------------------------------
   */

  useEffect(() => {
    let mounted = true;

    async function checkWishlist() {
      try {
        const supabase = createClient();

        const {
          data: {
            user,
          },
        } = await supabase.auth.getUser();

        if (!user) {
          if (mounted) {
            setCheckingWishlist(false);
          }
          return;
        }

        const venueId =
          await resolveVenueId();

        if (!venueId) {
          console.warn(
            'Could not find Supabase venue for:',
            v?.name
          );

          if (mounted) {
            setCheckingWishlist(false);
          }

          return;
        }

        if (mounted) {
          setDbVenueId(venueId);
        }

        const {
          data,
          error,
        } = await supabase
          .from('wishlists')
          .select('id')
          .eq('user_id', user.id)
          .eq('venue_id', venueId)
          .maybeSingle();

        if (error) {
          console.warn(
            'Wishlist check warning:',
            {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
            }
          );

          if (mounted) {
            setSaved(false);
          }
        } else if (mounted) {
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
  }, [v?.id, v?.name]);

  /*
   * --------------------------------------------------------
   * TOGGLE WISHLIST
   * --------------------------------------------------------
   */

  async function toggleWishlist() {
    if (loading) return;

    try {
      setLoading(true);

      const supabase = createClient();

      /*
       * Get current logged-in user
       */

      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      /*
       * User is not logged in
       */

      if (!user) {
        router.push('/login');
        return;
      }

      /*
       * Resolve Supabase venue ID
       */

      let venueId = dbVenueId;

      if (!venueId) {
        venueId =
          await resolveVenueId();

        if (venueId) {
          setDbVenueId(venueId);
        }
      }

      if (!venueId) {
        console.error(
          'Unable to find venue in Supabase:',
          v?.name
        );

        return;
      }

      /*
       * ----------------------------------------------------
       * REMOVE FROM SHORTLIST
       * ----------------------------------------------------
       */

      if (saved) {
        const {
          error,
        } = await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('venue_id', venueId);

        if (error) {
          console.error(
            'Wishlist remove error:',
            {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
            }
          );

          return;
        }

        setSaved(false);

        return;
      }

      /*
       * ----------------------------------------------------
       * ADD TO SHORTLIST
       * ----------------------------------------------------
       */

      const {
        error,
      } = await supabase
        .from('wishlists')
        .insert({
          user_id: user.id,
          venue_id: venueId,
        });

      if (error) {
        console.error(
          'Wishlist insert error:',
          {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
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
   * --------------------------------------------------------
   * VENUE CARD
   * --------------------------------------------------------
   */

  return (
    <article className="venueCard">

      <div className="venueImg">

        <img
          src={v.image}
          alt={v.name}
        />

        <span className="verified">
          ✓ Verified
        </span>

        <button
          className="heart"
          type="button"
          aria-label={
            saved
              ? 'Remove from wishlist'
              : 'Add to wishlist'
          }
          aria-pressed={saved}
          disabled={
            loading || checkingWishlist
          }
          onClick={toggleWishlist}
        >
          {saved ? '♥' : '♡'}
        </button>

      </div>


      <div className="venueBody">

        <div className="eyebrow">
          {v.type} · {v.city}
        </div>


        <Link
          href={`/venues/${v.id}`}
        >
          <h3>
            {v.name}
          </h3>
        </Link>


        <p>
          {v.desc}
        </p>


        <div className="meta">

          <span>
            Up to {v.capacity} guests
          </span>

          <span>
            ★ {v.rating}
          </span>

        </div>


        <div className="venueCtaRow">

          <span className="verifiedLabel">
            Verified venue profile
          </span>

          <Link
            data-cursor="view"
            className="smallBtn"
            href={`/venues/${v.id}`}
          >
            View venue
          </Link>

        </div>

      </div>

    </article>
  );
}