'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { MAX_COMPARE_VENUES, compareHref } from '../../lib/compare/constants';
import styles from './compare-select.module.css';

export type CompareTrayVenue = { id: string; name: string };

/*
 * Sticky bar on /explore showing the venues picked for comparison.
 * "Compare venues" is a plain link to /compare?v=..., so the comparison
 * is the same shareable, server-rendered page the rest of the site uses.
 * Needs at least two venues, because one venue has nothing to compare to.
 */
export function CompareTray({
  venues,
  onRemove,
  onClear,
}: {
  venues: CompareTrayVenue[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const count = venues.length;

  /*
   * The tray is fixed to the bottom of the screen. Lift it by however
   * much of the site footer is on screen, so it never covers the
   * footer's links and copyright line.
   */
  const [lift, setLift] = useState(0);

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => setLift(Math.round(entry.intersectionRect.height)),
      { threshold: Array.from({ length: 51 }, (_, i) => i / 50) }
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  if (count === 0) return null;

  const ready = count >= 2;
  const full = count >= MAX_COMPARE_VENUES;

  const status = ready
    ? `${count} of ${MAX_COMPARE_VENUES} venues selected. ${
        full ? 'Maximum reached.' : 'You can add more.'
      }`
    : `1 venue selected. Select at least one more to compare.`;

  return (
    <section
      className={styles.tray}
      aria-label="Venue comparison"
      style={lift > 0 ? { bottom: lift } : undefined}
    >
      <span className={styles.srOnly} role="status" aria-live="polite">
        {status}
      </span>

      <div className={styles.inner}>
        <p className={styles.count} aria-hidden="true">
          <b>{count}</b> of {MAX_COMPARE_VENUES} selected
          <span className={styles.countHint}>
            {ready
              ? full
                ? 'Maximum reached'
                : 'Add more or compare'
              : 'Select one more venue'}
          </span>
        </p>

        <ul className={styles.chips}>
          {venues.map((v) => (
            <li key={v.id} className={styles.chip}>
              <span>{v.name}</span>
              <button
                type="button"
                className={styles.chipRemove}
                aria-label={`Remove ${v.name} from comparison`}
                onClick={() => onRemove(v.id)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <button type="button" className={styles.clear} onClick={onClear}>
            Clear
          </button>

          {ready ? (
            <Link
              className={styles.go}
              href={compareHref(venues.map((v) => v.id))}
            >
              Compare venues
            </Link>
          ) : (
            <button type="button" className={styles.go} disabled>
              Compare venues
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
