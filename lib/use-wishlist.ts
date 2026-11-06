'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createClient } from './supabase-browser';

/*
 * Favourites for a single venue, using the same `wishlists` table and
 * the same rules as the venue cards: signed-out visitors are sent to
 * /login, and the heart reflects what is actually saved.
 */
export function useWishlist(dbId: string, slug: string) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    async function check() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!alive) return;

        if (!session?.user || !dbId) {
          setSaved(false);
          return;
        }

        const { data } = await supabase
          .from('wishlists')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('venue_id', dbId)
          .maybeSingle();

        if (alive) setSaved(Boolean(data));
      } catch {
        /* A failed check just leaves the heart empty. */
      } finally {
        if (alive) setReady(true);
      }
    }

    check();
    return () => {
      alive = false;
    };
  }, [dbId, slug]);

  const toggle = useCallback(async () => {
    if (busy || !ready) return;

    try {
      setBusy(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/login');
        return;
      }

      if (saved) {
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', session.user.id)
          .eq('venue_id', dbId);

        if (!error) setSaved(false);
        return;
      }

      const { error } = await supabase
        .from('wishlists')
        .insert({ user_id: session.user.id, venue_id: dbId });

      if (!error) setSaved(true);
    } finally {
      setBusy(false);
    }
  }, [busy, ready, saved, dbId, router]);

  return { saved, busy: busy || !ready, toggle };
}
