'use client';

import { useMemo, useState } from 'react';
import type { CollectionVenue } from '../../lib/collections';
import { CollectionCard } from './CollectionCard';
import { Reveal } from './Reveal';
import styles from './collections.module.css';

const ALL = 'All';

/*
 * The full collection with filter pills by venue type (e.g. Luxury Palace,
 * Luxury Hotel). Every venue card is rendered into the server HTML; the
 * filter only hides the ones that don't match, so nothing is lost for
 * crawlers or when JavaScript is off.
 */
export function CollectionsBrowser({
  venues,
  maxCapacity,
}: {
  venues: CollectionVenue[];
  maxCapacity: number;
}) {
  const [filter, setFilter] = useState(ALL);

  const types = useMemo(() => {
    const counts = new Map<string, number>();
    for (const venue of venues) {
      if (venue.type) counts.set(venue.type, (counts.get(venue.type) ?? 0) + 1);
    }
    return [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
  }, [venues]);

  const visible = venues.filter(
    (venue) => filter === ALL || venue.type === filter,
  ).length;

  return (
    <>
      {types.length > 1 && (
        <div
          className={styles.filters}
          role="group"
          aria-label="Filter venues by type"
        >
          {[[ALL, venues.length] as const, ...types].map(([label, count]) => (
            <button
              key={label}
              type="button"
              className={filter === label ? styles.pillActive : styles.pill}
              aria-pressed={filter === label}
              onClick={() => setFilter(label)}
            >
              {label}
              <span className={styles.pillCount}>{count}</span>
            </button>
          ))}
        </div>
      )}

      <p className={styles.srOnly} aria-live="polite">
        Showing {visible} {visible === 1 ? 'venue' : 'venues'}
      </p>

      <div className={styles.grid}>
        {venues.map((venue, i) => (
          <Reveal
            key={venue.id}
            className={
              filter === ALL || venue.type === filter
                ? styles.cardWrap
                : styles.cardHidden
            }
            delay={(i % 2) * 0.1}
          >
            <CollectionCard
              venue={venue}
              maxCapacity={maxCapacity}
              priority={i < 2}
            />
          </Reveal>
        ))}
      </div>
    </>
  );
}
