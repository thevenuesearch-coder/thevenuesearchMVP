import type { CSSProperties } from 'react';
import Link from 'next/link';

import { imgProps } from '../../lib/image';
import type {
  CompareCell,
  CompareModel,
  CompareVariant,
} from '../../lib/compare/types';
import styles from './compare.module.css';

/*
 * The verified-only comparison table, shared by the venue-page widget
 * and the standalone /compare page. Server Component: everything is
 * in the initial HTML for search engines and AI crawlers.
 *
 * Blank is intentional: a cell with no verified value renders
 * nothing -- never "No", "N/A" or "0".
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

function Cell({
  value,
  variant,
}: {
  value: CompareCell;
  variant: CompareVariant;
}) {
  if (value === null) return null;

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
              {rows.map((row) => (
                <tr key={row.key}>
                  <th scope="row" className={styles.rowHead}>
                    {row.label}
                  </th>

                  {row.cells.map((cell, index) => (
                    <td
                      key={venues[index].id}
                      data-current={venues[index].isCurrent}
                    >
                      <Cell value={cell} variant={row.variant} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className={styles.note}>
        A blank cell means we haven&rsquo;t verified that detail yet.
      </p>
    </div>
  );
}
