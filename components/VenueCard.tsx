'use client';

import Link from 'next/link';
import {
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase-browser';
import { imgProps } from '../lib/image';
import { formatCapacityRange, CAPACITY_UNKNOWN_LABEL } from '../lib/capacity';
import compareStyles from './compare/compare-select.module.css';
import exploreStyles from './explore/explore.module.css';
import {
  ArrowRightIcon,
  BedIcon,
  HeartIcon,
  MapPinIcon,
  UsersIcon,
} from './explore/icons';

type VenueCardData = {
  id: string;
  /* Database id (uuid). The shortlist stores this, not the slug in `id`. */
  dbId?: string;
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

/*
 * Optional "Compare" checkbox. Only the Explore page passes this, so
 * cards elsewhere (home page) are unchanged.
 */
export type VenueCardCompare = {
  selected: boolean;
  /* True when four other venues are already selected. */
  disabled: boolean;
  onToggle: () => void;
};

/*
 * The shortlist table stores the venue's database id (uuid). Cards built
 * from venue data carry it as `dbId`; if one does not, look it up by slug
 * so saving still works.
 */
async function resolveVenueDbId(
  supabase: ReturnType<typeof createClient>,
  v: { dbId?: string; slug: string }
): Promise<string | null> {
  if (v.dbId) return v.dbId;

  const { data } = await supabase
    .from('venues')
    .select('id')
    .eq('slug', v.slug)
    .maybeSingle();

  return data?.id ?? null;
}

/*
 * Extra data for the Explore card (redesigned layout). Only the Explore
 * page passes it, so every other card on the site is unchanged.
 */
export type VenueCardExplore = {
  /* "City, State" line under the name. */
  location: string;
  /* Number of published room categories (not a room total). */
  roomCategories: number;
  layout: 'grid' | 'list';
  /* Stagger for the entrance animation, in ms. */
  delay?: number;
  /* True for the first cards: their photo loads eagerly (above the fold). */
  priority?: boolean;
};

export function VenueCard({
  v,
  headingLevel = 3,
  compare,
  onSavedChange,
  explore,
}: {
  v: VenueCardData;
  explore?: VenueCardExplore;
  compare?: VenueCardCompare;
  /* Called after the heart is toggled (used by the shortlist page). */
  onSavedChange?: (saved: boolean) => void;
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

        const venueDbId =
          await resolveVenueDbId(
            supabase,
            v
          );

        if (!mounted) return;

        if (!venueDbId) {
          setSaved(false);
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
              venueDbId
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
  }, [v.id, v.dbId, v.slug]);


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

      const venueDbId =
        await resolveVenueDbId(
          supabase,
          v
        );

      if (!venueDbId) {
        console.error(
          'Wishlist error: venue id not found for',
          v.slug
        );
        return;
      }

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
              venueDbId
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
        onSavedChange?.(false);

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
              venueDbId,
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
          onSavedChange?.(true);
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
      onSavedChange?.(true);
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

  /*
   * ========================================================
   * EXPLORE CARD (redesigned layout)
   * Same wishlist / compare behaviour as the default card;
   * only the markup and styling differ.
   * ========================================================
   */

  if (explore) {
    const capacityText = formatCapacityRange(v.capacityMin, v.capacity);
    const shownTags = v.tags
      .filter((tag) => tag && tag.toLowerCase() !== v.type.toLowerCase())
      .slice(0, 2);

    return (
      <article
        className={`${exploreStyles.card} ${
          explore.priority ? exploreStyles.cardAnimated : ''
        }`}
        style={
          explore.delay
            ? { animationDelay: `${explore.delay}ms` }
            : undefined
        }
      >
        <div className={exploreStyles.media}>
          {v.image ? (
            <img
              {...imgProps(
                v.image,
                v.city ? `${v.name}, ${v.city}` : v.name,
                {
                  width: 800,
                  height: 620,
                  sizes:
                    '(max-width: 640px) 100vw, (max-width: 1280px) 46vw, 410px',
                  priority: explore.priority,
                }
              )}
            />
          ) : (
            <div className={exploreStyles.mediaEmpty}>
              The Venue Search
            </div>
          )}

          {v.type && (
            <span className={exploreStyles.badge}>{v.type}</span>
          )}

          <button
            className={`${exploreStyles.heart} ${
              saved ? exploreStyles.heartOn : ''
            }`}
            type="button"
            aria-label={
              saved
                ? `Remove ${v.name} from shortlist`
                : `Add ${v.name} to shortlist`
            }
            aria-pressed={saved}
            disabled={loading || checkingWishlist}
            onClick={toggleWishlist}
          >
            <HeartIcon size={22} filled={saved} />
          </button>

          {compare && (
            <label
              className={`${compareStyles.toggle} ${exploreStyles.compareTop}`}
              title={
                compare.disabled && !compare.selected
                  ? 'You can compare up to 4 venues. Remove one to add another.'
                  : undefined
              }
            >
              <input
                type="checkbox"
                className={compareStyles.box}
                checked={compare.selected}
                disabled={compare.disabled && !compare.selected}
                onChange={compare.onToggle}
                aria-label={`Compare ${v.name}`}
              />
              Compare
            </label>
          )}
        </div>

        <div className={exploreStyles.body}>
          <Link
            className={exploreStyles.titleLink}
            href={`/venues/${v.slug}`}
          >
            <Heading>{v.name}</Heading>
          </Link>

          {explore.location && (
            <p className={exploreStyles.loc}>
              <MapPinIcon size={18} />
              {explore.location}
            </p>
          )}

          {v.description && (
            <p className={exploreStyles.desc}>{v.description}</p>
          )}

          {shownTags.length > 0 && (
            <ul className={exploreStyles.tags}>
              {shownTags.map((tag) => (
                <li key={tag} className={exploreStyles.tag}>
                  {tag}
                </li>
              ))}
            </ul>
          )}

          <div className={exploreStyles.facts}>
            <span className={exploreStyles.fact}>
              <UsersIcon size={20} />
              {capacityText ?? CAPACITY_UNKNOWN_LABEL}
            </span>

            {explore.roomCategories > 0 && (
              <span className={exploreStyles.fact}>
                <BedIcon size={20} />
                {explore.roomCategories}{' '}
                {explore.roomCategories === 1
                  ? 'room type'
                  : 'room types'}
              </span>
            )}
          </div>

          <Link
            data-cursor="view"
            className={exploreStyles.cta}
            href={`/venues/${v.slug}`}
            aria-label={`View details: ${v.name}`}
          >
            View details
            <ArrowRightIcon size={20} />
          </Link>
        </div>
      </article>
    );
  }

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

        {compare && (
          <label
            className={compareStyles.toggle}
            title={
              compare.disabled && !compare.selected
                ? 'You can compare up to 4 venues. Remove one to add another.'
                : undefined
            }
          >
            <input
              type="checkbox"
              className={compareStyles.box}
              checked={compare.selected}
              disabled={compare.disabled && !compare.selected}
              onChange={compare.onToggle}
              aria-label={`Compare ${v.name}`}
            />
            Compare
          </label>
        )}

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
            {formatCapacityRange(v.capacityMin, v.capacity) ??
              CAPACITY_UNKNOWN_LABEL}
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