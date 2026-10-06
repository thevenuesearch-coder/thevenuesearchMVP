import Link from 'next/link';

import { imgProps } from '../../lib/image';
import type { CompareCell, CompareModel } from '../../lib/compare/types';
import styles from './compare.module.css';

/*
 * "Compare Similar Venues" -- rendered right after the Rooms section
 * of a venue page. Server Component: all of the content is in the
 * initial HTML for search engines and AI crawlers.
 *
 * Blank is intentional: a cell with no verified value renders
 * nothing -- never "No", "N/A" or "0".
 */

function Cell({ value }: { value: CompareCell }) {
  if (value === null) return null;

  if (Array.isArray(value)) {
    return (
      <ul className={styles.list}>
        {value.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  return <>{value}</>;
}

export function CompareSimilarVenues({
  model,
}: {
  model: CompareModel | null;
}) {
  if (!model || model.venues.length < 2) return null;

  const { venues, rows } = model;
  const [current, ...others] = venues;

  return (
    <section
      className={styles.section}
      aria-labelledby="compare-similar-heading"
    >
      <span className={styles.kicker}>COMPARE</span>

      <h2 id="compare-similar-heading" className={styles.heading}>
        Compare Similar Venues
      </h2>

      <div
        className={styles.scroller}
        role="region"
        aria-label="Venue comparison table. Scroll sideways on small screens."
        tabIndex={0}
      >
        <table className={styles.table}>
          <caption className={styles.srOnly}>
            {current.name} compared with {others.length} similar{' '}
            {others.length === 1 ? 'venue' : 'venues'}
          </caption>

          <thead>
            <tr>
              <th scope="col" className={styles.corner}>
                <span className={styles.srOnly}>Attribute</span>
              </th>

              {venues.map((venue) => (
                <th
                  key={venue.id}
                  scope="col"
                  className={styles.venueHead}
                  data-current={venue.isCurrent}
                >
                  {venue.isCurrent && (
                    <span className={styles.badge}>This venue</span>
                  )}

                  {venue.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      {...imgProps(venue.image, venue.name, {
                        width: 320,
                        height: 200,
                        sizes: '(max-width: 700px) 180px, 220px',
                      })}
                      className={styles.image}
                    />
                  )}

                  <span className={styles.name}>{venue.name}</span>

                  {venue.location && (
                    <span className={styles.meta}>{venue.location}</span>
                  )}

                  {venue.startingPrice && (
                    <span className={styles.price}>
                      {venue.startingPrice}
                    </span>
                  )}

                  {venue.rating && (
                    <span className={styles.meta}>★ {venue.rating}</span>
                  )}

                  {!venue.isCurrent && (
                    <Link
                      href={`/venues/${venue.id}`}
                      className={styles.button}
                    >
                      View Venue
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
                    <Cell value={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
