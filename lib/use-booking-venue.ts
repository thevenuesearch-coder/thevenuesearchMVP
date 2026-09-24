'use client';

import { useEffect, useState } from 'react';
import {
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';

import { createClient } from './supabase-browser';
import { fetchVenueBySlug } from './venues';
import type { Venue } from './data';

/*
 * Every booking route (/book, /book/rooms, /book/review) needs the
 * same three things before it can render anything: confirm the
 * guest is signed in (redirecting to /login and back if not), load
 * the venue by its slug, and know which venue space (if any) was
 * pre-selected. Shared here so the auth check and the redirect
 * target stay consistent across all three routes instead of being
 * re-implemented slightly differently in each one.
 */
export function useBookingVenue() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const venueId = searchParams.get('venue') || '';
  const selectedSpaceId = searchParams.get('space') || '';
  const mode = searchParams.get('mode');

  const [venue, setVenue] = useState<Venue | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          const returnTo = `${pathname}?${searchParams.toString()}`;

          router.replace(
            `/login?redirect=${encodeURIComponent(returnTo)}`
          );

          return;
        }

        if (cancelled) return;

        setUserId(session.user.id);
        setUserEmail(session.user.email || '');

        const venueData = await fetchVenueBySlug(venueId);

        if (cancelled) return;

        setVenue(venueData);
      } catch (err) {
        console.error('Booking auth error:', err);

        if (!cancelled) {
          setError(
            'Unable to load your booking. Please try again.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId, selectedSpaceId, mode]);

  return {
    venue,
    venueId,
    selectedSpaceId,
    mode,
    userId,
    userEmail,
    loading,
    error,
    setError,
  };
}
