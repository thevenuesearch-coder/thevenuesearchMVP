import { Fragment, type CSSProperties } from 'react';
import Link from 'next/link';

import { imgProps } from '../../lib/image';
import {
  COMPARE_GROUP_LABELS,
  type CompareCell,
  type CompareModel,
  type CompareVariant,
} from '../../lib/compare/types';
import styles from './compare.module.css';

/*
 * The verified-only comparison table, shared by the venue-page widget
 * and the standalone /compare page. Server Component: everything is
 * in the initial HTML for search engines and AI crawlers.
 *
 * Blank is intentional: a cell with no verified value renders
 * nothing -- never "No", "N/A" or "0". A verified yes renders a small
 * check (optionally with a short factual detail, e.g. "Up to 350
 * cars"); there is no "cross" state at all.
 */

const MORE = /^\+\d+ more$/;

function PinIcon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Zm0-9.2a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className={styles.checkIcon}
      viewBox="0 0 20 20"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.14" />
      <path
        d="m5.8 10.4 2.7 2.7 5.7-5.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Cell({
  value,
  variant,
}: {
  value: CompareCell;
  variant: CompareVariant;
}) {
  if (value === null) return null;

  if (variant === 'check') {
    /* `true` = verified available; a string = verified, with a short detail. */
    return (
      <span className={styles.check}>
        <CheckIcon />
        {typeof value === 'string' ? (
          <span className={styles.checkDetail}>{value}</span>
        ) : (
          <span className={styles.srOnly}>Available</span>
        )}
      </span>
    );
  }

  if (value === true) return null;

  if (Array.isArray(value)) {
    if (variant === 'chips') {
      return (
        <ul className={styles.chips}>
          {value.map((item) => (
            <li
              key={item}
              className={MORE.test(item) ? styles.chipMore : styles.chip}
            >
              {item}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <ul className={styles.lines}>
        {value.map((item) => {
          const [name, meta] = item.split(' · ');

          return (
            <li key={item}>
              <span className={MORE.test(item) ? styles.more : styles.lineName}>
                {name}
              </span>
              {meta && <span className={styles.lineMeta}>{meta}</span>}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <span className={variant === 'stat' ? styles.stat : styles.text}>
      {value}
    </span>
  );
}

export function CompareTable({
  model,
  removeHref,
}: {
  model: CompareModel;
  /* /compare page: returns the URL without this venue (renders an "x"). */
  removeHref?: (venueId: string) => string;
}) {
  const { venues, rows } = model;
  const [current, ...others] = venues;

  return (
    <div className={styles.tableRoot}>
      <div className={styles.card}>
        <p className={styles.hint} aria-hidden="true">
          Swipe sideways to compare →
        </p>

        <div
          className={styles.scroller}
          role="region"
          aria-label="Venue comparison table. Scroll sideways on small screens."
          tabIndex={0}
        >
          <table
            className={styles.table}
            style={{ '--cols': venues.length } as CSSProperties}
          >
            <caption className={styles.srOnly}>
              {current.name} compared with {others.length} similar{' '}
              {others.length === 1 ? 'venue' : 'venues'}
            </caption>

            <thead>
              <tr>
                <th scope="col" className={styles.corner}>
                  <span className={styles.cornerTitle}>At a glance</span>
                  <span className={styles.cornerSub}>
                    {venues.length} venues, side by side
                  </span>
                </th>

                {venues.map((venue) => (
                  <th
                    key={venue.id}
                    scope="col"
                    className={styles.venueHead}
                    data-current={venue.isCurrent}
                  >
                    <div className={styles.media}>
                      {venue.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          {...imgProps(venue.image, venue.name, {
                            width: 480,
                            height: 300,
                            sizes: '(max-width: 700px) 210px, 300px',
                          })}
                          className={styles.image}
                        />
                      ) : null}

                      {venue.isCurrent && (
                        <span className={styles.badge}>This venue</span>
                      )}

                      {removeHref && (
                        <Link
                          href={removeHref(venue.id)}
                          scroll={false}
                          className={styles.removeBtn}
                          aria-label={`Remove ${venue.name} from comparison`}
                        >
                          <span aria-hidden="true">×</span>
                        </Link>
                      )}
                    </div>

                    <span className={styles.name}>{venue.name}</span>

                    <span className={styles.location}>
                      {venue.location && (
                        <>
                          <PinIcon />
                          <span>{venue.location}</span>
                        </>
                      )}
                    </span>

                    <span className={styles.metaRow}>
                      {venue.rating && (
                        <span className={styles.rating}>
                          <span aria-hidden="true">★</span> {venue.rating}
                          <span className={styles.srOnly}> out of 5</span>
                        </span>
                      )}

                      {venue.startingPrice && (
                        <span className={styles.price}>
                          {venue.startingPrice}
                        </span>
                      )}
                    </span>

                    {venue.isCurrent ? (
                      <span className={styles.viewing}>
                        You&rsquo;re viewing this venue
                      </span>
                    ) : (
                      <Link
                        href={`/venues/${venue.id}`}
                        className={styles.button}
                      >
                        View Venue <span aria-hidden="true">→</span>
                      </Link>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <Fragment key={row.key}>
                  {(index === 0 || rows[index - 1].group !== row.group) && (
                    <tr className={styles.groupRow}>
                      <th scope="colgroup" colSpan={venues.length + 1}>
                        <span className={styles.groupLabel}>
                          {COMPARE_GROUP_LABELS[row.group]}
                        </span>
                      </th>
                    </tr>
                  )}

                  <tr
                    className={
                      row.variant === 'check' ? styles.rowCompact : undefined
                    }
                  >
                    <th scope="row" className={styles.rowHead}>
                      {row.label}
                    </th>

                    {row.cells.map((cell, cellIndex) => (
                      <td
                        key={venues[cellIndex].id}
                        data-current={venues[cellIndex].isCurrent}
                      >
                        <Cell value={cell} variant={row.variant} />
                      </td>
                    ))}
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className={styles.note}>
        Only verified venue information is shown. Blank fields indicate that
        a verified detail was not available.
      </p>
    </div>
  );
}
