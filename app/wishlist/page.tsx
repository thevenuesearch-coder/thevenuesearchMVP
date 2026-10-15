'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase-browser';
import { fetchVenues } from '../../lib/venues';
import type { Venue } from '../../lib/data';
import { VenueCard } from '../../components/VenueCard';

export default function Wishlist() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (!user) {
          setLoading(false);
          return;
        }

        setUser(user);

        /*
         * The user's saved venues, newest first. Row-level security
         * limits this to their own rows.
         */
        const { data: rows, error } = await supabase
          .from('wishlists')
          .select('venue_id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Shortlist loading warning:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });

          if (mounted) {
            setLoadFailed(true);
            setLoading(false);
          }

          return;
        }

        const savedIds = (rows || [])
          .map((row) => row.venue_id as string)
          .filter(Boolean);

        if (savedIds.length === 0) {
          if (mounted) {
            setVenues([]);
            setLoading(false);
          }

          return;
        }

        /*
         * Reuse the same venue data and card as Explore so a saved
         * venue looks exactly as it does there.
         */
        const allVenues = await fetchVenues();

        const byDbId = new Map(
          allVenues.map((venue) => [venue.dbId, venue])
        );

        const saved = savedIds
          .map((id) => byDbId.get(id))
          .filter((venue): venue is Venue => Boolean(venue));

        if (mounted) {
          setVenues(saved);
          setLoading(false);
        }
      } catch (error) {
        console.error('Shortlist loading error:', error);

        if (mounted) {
          setLoadFailed(true);
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * Loading state
   */
  if (loading) {
    return (
      <main id="main-content" className="page narrow">
        <div className="centerIntro">
          <span className="kicker">YOUR SHORTLIST</span>
          <h1>Loading your shortlist.</h1>
          <p>
            Just a moment while we load your saved venues.
          </p>
        </div>
      </main>
    );
  }

  /*
   * User is NOT logged in
   */
  if (!user) {
    return (
      <main id="main-content" className="page narrow">
        <div className="centerIntro">
          <span className="kicker">
            YOUR SHORTLIST
          </span>

          <h1>
            Keep the places that feel right.
          </h1>

          <p>
            Sign in to save venues, compare them
            and bring them into a wedding workspace.
          </p>

          <Link
            data-cursor="open"
            className="primaryBtn"
            href="/login"
          >
            Sign in to continue →
          </Link>
        </div>
      </main>
    );
  }

  /*
   * Saved venues could not be loaded
   */
  if (loadFailed) {
    return (
      <main id="main-content" className="page narrow">
        <div className="centerIntro">
          <span className="kicker">
            YOUR SHORTLIST
          </span>

          <h1>
            We could not load your saved places.
          </h1>

          <p>
            Please refresh the page and try again.
          </p>
        </div>
      </main>
    );
  }

  /*
   * User IS logged in, nothing saved yet
   */
  if (venues.length === 0) {
    return (
      <main id="main-content" className="page narrow">
        <div className="centerIntro">

          <span className="kicker">
            YOUR SHORTLIST
          </span>

          <h1>
            Your saved places.
          </h1>

          <p>
            Your shortlisted venues will appear here
            as you explore The Venue Search. Tap the
            heart on any venue to save it.
          </p>

          <Link
            data-cursor="open"
            className="primaryBtn"
            href="/explore"
          >
            Explore venues →
          </Link>

        </div>
      </main>
    );
  }

  /*
   * User IS logged in, with saved venues
   */
  return (
    <main id="main-content" className="page">
      <div className="centerIntro">

        <span className="kicker">
          YOUR SHORTLIST
        </span>

        <h1>
          Your saved places.
        </h1>

        <p>
          {venues.length === 1
            ? '1 saved venue.'
            : `${venues.length} saved venues.`}{' '}
          Tap the heart on a card to remove it.
        </p>

      </div>

      <div className="venueGrid">
        {venues.map((venue) => (
          <VenueCard
            headingLevel={2}
            key={venue.id}
            v={{
              ...venue,

              /*
               * VenueCard expects these
               * database-style properties.
               */
              slug: venue.id,
              description: venue.desc,
            }}
            onSavedChange={(saved) => {
              if (!saved) {
                setVenues((current) =>
                  current.filter(
                    (item) => item.id !== venue.id
                  )
                );
              }
            }}
          />
        ))}
      </div>
    </main>
  );
}
