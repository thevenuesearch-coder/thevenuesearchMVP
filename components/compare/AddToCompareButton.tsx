'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

import { MAX_COMPARE_VENUES, compareHref } from '../../lib/compare/constants';
import styles from './add-to-compare.module.css';

const STORAGE_KEY = 'vs-compare-venues';

const CHANGE_EVENT = 'vs-compare-change';

function parseIds(raw: string): string[] {
  try {
    const saved: unknown = JSON.parse(raw);
    return Array.isArray(saved)
      ? saved.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

function readIds(): string[] {
  try {
    return parseIds(window.sessionStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

/* The remembered selection, read without a setState-in-effect. */
function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function snapshot(): string {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) ?? '[]';
  } catch {
    return '[]';
  }
}

/*
 * "Compare with other venues" on a venue page. Adds this venue to the
 * same remembered selection the Explore page uses (never twice, never
 * more than the 4-venue limit) and opens the comparison.
 */
export function AddToCompareButton({ venueId }: { venueId: string }) {
  const router = useRouter();
  const raw = useSyncExternalStore(subscribe, snapshot, () => '[]');
  const ids = useMemo(() => parseIds(raw), [raw]);
  const [note, setNote] = useState('');

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

    window.dispatchEvent(new Event(CHANGE_EVENT));
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
