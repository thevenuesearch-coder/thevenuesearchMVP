import Link from 'next/link';

import styles from './glance.module.css';

/*
 * "Compare Venues at a Glance" (home page).
 *
 * A short introduction to the comparison: what it is, how it works and
 * what it covers, with every route leading into the real comparison on
 * /compare. It shows no venue data of its own, so there is nothing here
 * that can drift out of date or be unverified.
 *
 * Server Component, no client code.
 */

/* How comparing works, in plain words. */
const STEPS = [
  {
    title: 'Pick venues',
    body: 'Choose up to four venues to compare side by side.',
  },
  {
    title: 'Compare by category',
    body: 'Overview, rooms, event spaces, amenities and services.',
  },
  {
    title: 'Open the full comparison',
    body: 'See every verified detail and share the link.',
  },
];

/* What the full comparison covers. */
const CATEGORIES = [
  { label: 'Overview', hint: 'Type, location, capacity' },
  { label: 'Accommodation', hint: 'Room categories' },
  { label: 'Event Spaces', hint: 'Function, indoor, outdoor' },
  { label: 'Amenities', hint: 'Pool, spa, parking, dining' },
  { label: 'Services', hint: 'Wedding and hotel services' },
];

export function CompareGlance() {
  return (
    <section className={styles.section} aria-labelledby="glance-title">
      <div className={styles.head}>
        <span className="kicker">COMPARE AT A GLANCE</span>

        <h2 id="glance-title" className={styles.title}>
          Compare Venues at a Glance
        </h2>

        <p className={styles.lead}>
          See key venue details side by side and find the venue that fits your
          celebration.
        </p>

        <Link href="/compare" className="primaryBtn large">
          Compare Venues
          <span aria-hidden="true">&nbsp;→</span>
        </Link>
      </div>

      <ol className={styles.steps} aria-label="How comparing works">
        {STEPS.map((step, i) => (
          <li key={step.title} className={styles.step}>
            <span className={styles.stepNum} aria-hidden="true">
              {i + 1}
            </span>
            <span>
              <strong>{step.title}</strong>
              <span>{step.body}</span>
            </span>
          </li>
        ))}
      </ol>

      <nav className={styles.shell} aria-label="Comparison categories">
        <ul className={styles.cats}>
          {CATEGORIES.map((category, i) => (
            <li key={category.label}>
              <Link
                href="/compare"
                className={i === 0 ? styles.catFirst : styles.cat}
              >
                <span className={styles.catLabel}>{category.label}</span>
                <span className={styles.catHint}>{category.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
