'use client';

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from 'react';
import { useRouter } from 'next/navigation';

import styles from './compare-page.module.css';

export type PickerOption = {
  id: string; /* public slug */
  name: string;
  location: string;
  type: string;
};

const MAX_SHOWN = 40;

/*
 * Searchable venue dropdown (ARIA combobox) for the /compare page.
 *
 * Choosing a venue just navigates to /compare?v=<slugs>. The page is
 * rendered on the server, so every comparison stays a plain,
 * shareable URL. Keyboard: Up/Down to move, Enter to select, Escape
 * to close.
 */
export function VenuePicker({
  options,
  selectedIds,
  max = 4,
  rankedBy,
}: {
  options: PickerOption[];
  selectedIds: string[];
  max?: number;
  /* Name of the venue the options were ranked against, if any. */
  rankedBy?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const baseId = useId();
  const inputId = `${baseId}-input`;
  const listId = `${baseId}-list`;
  const optionId = (index: number) => `${baseId}-opt-${index}`;
  const rootRef = useRef<HTMLDivElement>(null);

  const full = selectedIds.length >= max;

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter(
      (o) =>
        !selectedIds.includes(o.id) &&
        (!q || `${o.name} ${o.location} ${o.type}`.toLowerCase().includes(q))
    );
  }, [options, selectedIds, query]);

  const shown = available.slice(0, MAX_SHOWN);

  useEffect(() => {
    setActive(0);
  }, [query, selectedIds.length]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    if (open) {
      document
        .getElementById(optionId(active))
        ?.scrollIntoView({ block: 'nearest' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, open]);

  function choose(option: PickerOption) {
    const next = [...selectedIds, option.id]
      .slice(0, max)
      .map(encodeURIComponent)
      .join(',');

    startTransition(() => {
      router.push(`/compare?v=${next}`, { scroll: false });
    });

    setQuery('');
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, Math.max(shown.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      if (open && shown[active]) {
        event.preventDefault();
        choose(shown[active]);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={styles.picker}>
      <label htmlFor={inputId} className={styles.pickerLabel}>
        Add a venue to compare
      </label>

      <div className={styles.inputWrap} data-pending={pending}>
        <svg
          className={styles.searchIcon}
          viewBox="0 0 24 24"
          width="18"
          height="18"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        <input
          id={inputId}
          className={styles.input}
          type="text"
          role="combobox"
          aria-expanded={open && !full}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && !full && shown[active] ? optionId(active) : undefined
          }
          autoComplete="off"
          disabled={full}
          placeholder={
            full
              ? `Maximum ${max} venues. Remove one to add another.`
              : 'Search by venue name, city or type…'
          }
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />

        <span className={styles.counter} aria-hidden="true">
          {selectedIds.length}/{max}
        </span>
      </div>

      {open && !full && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Venues"
          className={styles.listbox}
        >
          {rankedBy && !query.trim() && shown.length > 0 && (
            <li role="presentation" className={styles.rankHint}>
              Best matches for {rankedBy} first
            </li>
          )}

          {shown.length === 0 ? (
            <li role="presentation" className={styles.noMatch}>
              No venues match &ldquo;{query}&rdquo;
            </li>
          ) : (
            shown.map((option, index) => (
              <li
                key={option.id}
                id={optionId(index)}
                role="option"
                aria-selected={index === active}
                className={styles.option}
                data-active={index === active}
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(option);
                }}
                onMouseEnter={() => setActive(index)}
              >
                <span className={styles.optionName}>{option.name}</span>
                <span className={styles.optionMeta}>
                  {[option.location, option.type].filter(Boolean).join(' · ')}
                </span>
              </li>
            ))
          )}

          {available.length > shown.length && (
            <li role="presentation" className={styles.moreHint}>
              Showing {shown.length} of {available.length}. Keep typing to
              narrow the list.
            </li>
          )}
        </ul>
      )}

      <span role="status" aria-live="polite" className={styles.srOnly}>
        {pending ? 'Updating comparison' : ''}
      </span>
    </div>
  );
}
