'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import {
  getCompareList,
  removeFromCompare,
  MIN_COMPARE,
  MAX_COMPARE,
  type CompareEntry,
} from '../lib/compare';

export function CompareBar() {
  const [mounted, setMounted] = useState(false);
  const [entries, setEntries] = useState<CompareEntry[]>([]);

  useEffect(() => {
    setMounted(true);
    setEntries(getCompareList());

    function onChange() {
      setEntries(getCompareList());
    }

    window.addEventListener('tvs-compare-change', onChange);
    window.addEventListener('storage', onChange);

    return () => {
      window.removeEventListener('tvs-compare-change', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  // Avoid a hydration mismatch (localStorage isn't known on the
  // server) and stay invisible until there's something to show.
  if (!mounted || entries.length === 0) return null;

  const ready = entries.length >= MIN_COMPARE;
  const compareHref = ready
    ? `/compare?v=${entries.map((e) => encodeURIComponent(e.id)).join(',')}`
    : undefined;

  return (
    <div className="compareBar" role="region" aria-label="Venue comparison tray">
      <div className="compareBarInner">
        <div className="compareBarSlots">
          {entries.map((entry) => (
            <div className="compareBarSlot" key={entry.id}>
              {entry.image ? (
                <img src={entry.image} alt="" />
              ) : (
                <div className="compareBarSlotFallback" />
              )}
              <div className="compareBarSlotText">
                <b>{entry.name}</b>
                <span>{entry.city}</span>
              </div>
              <button
                type="button"
                className="compareBarRemove"
                aria-label={`Remove ${entry.name} from comparison`}
                onClick={() => removeFromCompare(entry.id)}
              >
                ×
              </button>
            </div>
          ))}

          {entries.length < MAX_COMPARE && (
            <div className="compareBarSlot empty">
              <span>
                {entries.length < MIN_COMPARE
                  ? 'Add one more venue'
                  : `Add up to ${MAX_COMPARE - entries.length} more`}
              </span>
            </div>
          )}
        </div>

        {ready ? (
          <Link data-cursor="open" className="primaryBtn" href={compareHref!}>
            Compare ({entries.length}) →
          </Link>
        ) : (
          <span className="compareBarHint">Pick one more venue</span>
        )}
      </div>
    </div>
  );
}
