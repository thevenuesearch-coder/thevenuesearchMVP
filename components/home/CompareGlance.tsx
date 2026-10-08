import Link from 'next/link';

import type { Venue } from '../../lib/data';
import { bundledFeatures } from '../../lib/compare/bundled-features';
import { getSelectionComparison } from '../../lib/compare/get-comparison';
import type { CompareGroup, CompareModel } from '../../lib/compare/types';
import { CompareTable } from '../compare/CompareTable';
import { GlanceTabs, type GlanceTab } from './GlanceTabs';
import styles from './glance.module.css';

/*
 * "Compare Venues at a Glance" (home page).
 *
 * This is a preview of the real comparison engine, not a second one:
 *   - the model comes from getSelectionComparison (same loader, same
 *     verified data, same blank-cell rules as /compare);
 *   - each category is the existing <CompareTable> rendered with that
 *     category's rows;
 *   - nothing is hardcoded. The three venues are chosen from the
 *     published venues by how much real data they have.
 *
 * Server Component. The only client code is the tab switcher.
 */

const VENUE_COUNT = 3;

/* How comparing works, in plain words (the live preview below is step 2). */
const STEPS = [
  {
    title: 'Pick venues',
    body: 'Choose up to four venues to compare side by side.',
  },
  {
    title: 'Switch categories',
    body: 'Overview, rooms, event spaces, amenities and services, one at a time.',
  },
  {
    title: 'Open the full comparison',
    body: 'See every verified detail and share the link.',
  },
];

/* Which engine groups each tab shows. Dining sits with amenities; wedding &
   event services sit with hotel services. */
const CATEGORIES: Array<{
  id: string;
  label: string;
  hint: string;
  groups: CompareGroup[];
}> = [
  {
    id: 'overview',
    label: 'Overview',
    hint: 'Type, location, capacity',
    groups: ['overview'],
  },
  {
    id: 'accommodation',
    label: 'Accommodation',
    hint: 'Room categories',
    groups: ['accommodation'],
  },
  {
    id: 'spaces',
    label: 'Event Spaces',
    hint: 'Function, indoor, outdoor',
    groups: ['spaces'],
  },
  {
    id: 'amenities',
    label: 'Amenities',
    hint: 'Pool, spa, parking, dining',
    groups: ['amenities', 'dining'],
  },
  {
    id: 'services',
    label: 'Services',
    hint: 'Wedding and hotel services',
    groups: ['wedding', 'services'],
  },
];

/*
 * Show venues that have the most to compare: a photo, a capacity, event
 * spaces and verified amenities. Ties keep the existing featured order, and
 * the three chosen venues stay in that order.
 */
function pickVenues(venues: Venue[]): Venue[] {
  const score = (venue: Venue) =>
    (venue.image ? 1 : 0) +
    (venue.capacity > 0 ? 1 : 0) +
    (venue.venueSpaces.length > 0 ? 1 : 0) +
    Math.min(bundledFeatures(venue.id).length, 12) / 12;

  return venues
    .map((venue, index) => ({ venue, index, score: score(venue) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, VENUE_COUNT)
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.venue);
}

function buildTabs(model: CompareModel): GlanceTab[] {
  return CATEGORIES.map((category) => {
    const rows = model.rows.filter((row) =>
      category.groups.includes(row.group),
    );

    return {
      id: category.id,
      label: category.label,
      hint: category.hint,
      content:
        rows.length > 0 ? (
          <CompareTable model={{ venues: model.venues, rows }} />
        ) : (
          <p className={styles.empty}>
            Verified details for this category will appear here as they become
            available.
          </p>
        ),
    };
  });
}

export async function CompareGlance({ venues }: { venues: Venue[] }) {
  const model =
    venues.length >= 2
      ? await getSelectionComparison(pickVenues(venues))
      : null;

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

      {model && (
        <>
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

          <GlanceTabs tabs={buildTabs(model)} />
        </>
      )}
    </section>
  );
}
