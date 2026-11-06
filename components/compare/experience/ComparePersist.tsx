'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { compareHref } from '../../../lib/compare/constants';
import { MAX_COMPARE_VENUES } from '../../../lib/compare/constants';

/* Same key the Explore page uses, so both stay in step. */
const STORAGE_KEY = 'vs-compare-venues';

/*
 * Keeps the visitor's picks across navigation and refreshes without
 * giving up the shareable URL:
 *  - a comparison opened from the URL is remembered for this tab;
 *  - opening /compare with no venues restores the remembered picks;
 *  - "Clear" (?clear=1) forgets them.
 */
export function ComparePersist({
  ids,
  clear,
}: {
  ids: string[];
  clear: boolean;
}) {
  const router = useRouter();
  const key = ids.join(',');

  useEffect(() => {
    try {
      if (clear) {
        window.sessionStorage.removeItem(STORAGE_KEY);
        router.replace('/compare', { scroll: false });
        return;
      }

      if (ids.length > 0) {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
        return;
      }

      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      const saved: unknown = raw ? JSON.parse(raw) : [];

      if (Array.isArray(saved)) {
        const restored = saved
          .filter((id): id is string => typeof id === 'string' && id.length > 0)
          .slice(0, MAX_COMPARE_VENUES);

        if (restored.length > 0) {
          router.replace(compareHref(restored), { scroll: false });
        }
      }
    } catch {
      /* Storage unavailable: the URL alone still works. */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, clear]);

  return null;
}
