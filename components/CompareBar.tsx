'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import {
  getCompareList,
  removeFromCompare,
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

  const ready = entries.length === MAX_COMPARE;
  const compareHref = ready
    ? `/compare?a=${encodeURIComponent(entries[0].id)}&b=${encodeURIComponent(
        entries[1].id
      )}`
    : undefined;

  return (
    <div className="compareBar" role="region" aria-label="Venue comparison tray">
      <div className="compareBarInner">
        <div className="compareBarSlots">
          {Array.from({ length: MAX_COMPARE }).map((_, index) => {
            const entry = entries[index];

            return (
              <div
                className={`compareBarSlot${entry ? '' : ' empty'}`}
                key={entry?.id || `empty-${index}`}
              >
                {entry ? (
                  <>
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
                  </>
                ) : (
                  <span>Add a venue to compare</span>
                )}
              </div>
            );
          })}
        </div>

        {ready ? (
          <Link data-cursor="open" className="primaryBtn" href={compareHref!}>
            Compare →
          </Link>
        ) : (
          <span className="compareBarHint">Pick one more venue</span>
        )}
      </div>
    </div>
  );
}
