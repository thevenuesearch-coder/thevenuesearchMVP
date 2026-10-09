import Link from 'next/link';

import type { CompareModel } from '../../lib/compare/types';
import { CompareTable } from './CompareTable';
import styles from './compare.module.css';

/*
 * "Compare Similar Venues" -- a full-width row directly below the
 * Rooms section of a venue page. Server Component.
 */
export function CompareSimilarVenues({
  model,
}: {
  model: CompareModel | null;
}) {
  if (!model || model.venues.length < 2) return null;

  const [current, ...others] = model.venues;
  const customiseHref = `/compare?v=${model.venues
    .map((v) => encodeURIComponent(v.id))
    .join(',')}`;

  return (
    <section
      className={styles.section}
      aria-labelledby="compare-similar-heading"
    >
      <header className={styles.intro}>
        <span className={styles.kicker}>COMPARE</span>

        <h2 id="compare-similar-heading" className={styles.heading}>
          Compare Similar Venues
        </h2>

        <p className={styles.sub}>
          See how {current.name} stacks up against{' '}
          {others.length === 1 ? 'a similar venue' : 'similar venues'}.
          Only verified details are shown.
        </p>
      </header>

      <CompareTable model={model} />

      <div className={styles.actions}>
        <Link href={customiseHref} className={styles.customise}>
          Choose the custom venues to compare <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
