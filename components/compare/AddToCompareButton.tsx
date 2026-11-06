'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { MAX_COMPARE_VENUES, compareHref } from '../../lib/compare/constants';
import styles from './add-to-compare.module.css';

const STORAGE_KEY = 'vs-compare-venues';

function readIds(): string[] {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const saved: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(saved)
      ? saved.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

/*
 * "Compare with other venues" on a venue page. Adds this venue to the
 * same remembered selection the Explore page uses (never twice, never
 * more than the 4-venue limit) and opens the comparison.
 */
export function AddToCompareButton({ venueId }: { venueId: string }) {
  const router = useRouter();
  const [ids, setIds] = useState<string[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    setIds(readIds());
  }, []);

  const inList = ids.includes(venueId);
  const full = !inList && ids.length >= MAX_COMPARE_VENUES;

  function go() {
    const current = readIds();

    if (current.includes(venueId)) {
      router.push(compareHref(current));
      return;
    }

    if (current.length >= MAX_COMPARE_VENUES) {
      setNote(
        `You already have ${MAX_COMPARE_VENUES} venues selected. Remove one on the comparison page to add this one.`
      );
      return;
    }

    const next = [...current, venueId];

    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* The URL still carries the selection. */
    }

    setIds(next);
    router.push(compareHref(next));
  }

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.button} onClick={go}>
        <span>
          {inList
            ? `In your comparison (${ids.length}) · View`
            : ids.length > 0
              ? `Add to comparison (${ids.length} selected)`
              : 'Compare with other venues'}
        </span>
        <span aria-hidden="true">⇄</span>
      </button>

      {(note || full) && (
        <p className={styles.note} role="status">
          {note ||
            `Your comparison is full (${MAX_COMPARE_VENUES} venues). Open it to swap one out.`}
        </p>
      )}
    </div>
  );
}
