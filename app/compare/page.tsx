import type { Metadata } from 'next';
import Link from 'next/link';

import { CompareExperience } from '../../components/compare/experience/CompareExperience';
import { ComparePersist } from '../../components/compare/experience/ComparePersist';
import styles from '../../components/compare/experience/experience.module.css';
import {
  VenuePicker,
  type PickerOption,
} from '../../components/compare/VenuePicker';
import { MAX_COMPARE_VENUES } from '../../lib/compare/constants';
import { getExperienceComparison } from '../../lib/compare/get-experience';
import {
  shortlistSimilar,
  similarityScore,
} from '../../lib/compare/similarity';
import type { Venue } from '../../lib/data';
import { imgProps } from '../../lib/image';
import { pageMetadata } from '../../lib/seo';
import { fetchVenuesServer } from '../../lib/venues';

/*
 * Standalone comparison page: /compare?v=slug1,slug2,slug3
 *
 * The selection lives in the URL, so every comparison is shareable
 * and the comparison is server-rendered. Rendered per request so it
 * always reflects what is currently published.
 */
export const dynamic = 'force-dynamic';

const MAX_VENUES = MAX_COMPARE_VENUES;

type ComparePageProps = {
  searchParams: Promise<{ v?: string | string[]; clear?: string | string[] }>;
};

function parseSlugs(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value.join(',') : (value ?? '');
  const seen = new Set<string>();

  for (const part of raw.split(',')) {
    const slug = part.trim();
    if (slug) seen.add(slug);
  }

  return [...seen].slice(0, MAX_VENUES);
}

/* An empty selection is an explicit "clear", so it is not restored. */
const hrefFor = (ids: string[]) =>
  ids.length
    ? `/compare?v=${ids.map(encodeURIComponent).join(',')}`
    : '/compare?clear=1';

const placeOf = (v: Venue) => v.city || v.destination || '';

export async function generateMetadata({
  searchParams,
}: ComparePageProps): Promise<Metadata> {
  const { v } = await searchParams;

  const base = pageMetadata({
    title: 'Compare Wedding Venues',
    description:
      'Compare wedding venues side by side: guest capacity, event spaces, rooms, amenities and more. Only published details are shown. Choose up to four venues.',
    path: '/compare',
  });

  /*
   * One indexable landing page. Every ?v= combination is a
   * different "page" for the same content, so those stay out of
   * the index (but their links can still be followed).
   */
  return parseSlugs(v).length > 0
    ? { ...base, robots: { index: false, follow: true } }
    : base;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { v, clear } = await searchParams;
  const slugs = parseSlugs(v);

  const venues = await fetchVenuesServer();
  const bySlug = new Map(venues.map((venue) => [venue.id, venue]));

  /* Unknown or unpublished slugs are ignored; order is preserved. */
  const selected = slugs
    .map((slug) => bySlug.get(slug))
    .filter((venue): venue is Venue => Boolean(venue));
  const selectedIds = selected.map((venue) => venue.id);

  const model = await getExperienceComparison(selected);

  /*
   * Once a first venue is chosen, offer the best matches first
   * (same similarity engine as the venue-page widget).
   */
  const anchor = selected[0];
  const ordered = anchor
    ? venues
        .map((venue) => ({
          venue,
          score: venue.id === anchor.id ? -1 : similarityScore(anchor, venue),
        }))
        .sort(
          (a, b) =>
            b.score - a.score || a.venue.name.localeCompare(b.venue.name)
        )
        .map((x) => x.venue)
    : venues;

  const options: PickerOption[] = ordered.map((venue) => ({
    id: venue.id,
    name: venue.name,
    location: placeOf(venue),
    type: venue.type,
  }));

  /* "Similar to <first venue>" quick-adds, from the same engine. */
  const suggestions =
    selected.length > 0 && selected.length < MAX_VENUES
      ? shortlistSimilar(
          selected[0],
          venues.filter((venue) => !selectedIds.includes(venue.id)),
          4
        )
      : [];

  const emptySlots = Math.max(MAX_VENUES - selected.length, 0);

  const removeHrefs = Object.fromEntries(
    selected.map((venue) => [
      venue.id,
      hrefFor(selectedIds.filter((id) => id !== venue.id)),
    ])
  );

  return (
    <main id="main-content" className={styles.root}>
      <div className={styles.band} aria-hidden="true" />

      <ComparePersist ids={selectedIds} clear={Boolean(clear)} />

      <div className={styles.wrap}>
        <header className={styles.hero}>
          <span className={styles.kicker}>Compare</span>

          <h1 className={styles.title}>
            Compare venues <em>side by side</em>
          </h1>

          <p className={styles.lead}>
            Choose up to {MAX_VENUES} venues and see guest capacity, event
            spaces, rooms and amenities together. Only details the venues have
            published are shown, and anything missing is marked openly.
          </p>
        </header>

        <section className={styles.panel} aria-label="Choose venues to compare">
          <VenuePicker
            options={options}
            selectedIds={selectedIds}
            max={MAX_VENUES}
            rankedBy={anchor?.name}
          />

          <ul className={styles.slots} aria-label="Selected venues">
            {selected.map((venue) => (
              <li key={venue.id} className={styles.slot} data-filled="true">
                {venue.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    {...imgProps(venue.image, '', {
                      width: 104,
                      height: 104,
                      sizes: '52px',
                    })}
                    className={styles.slotImage}
                  />
                ) : (
                  <span className={styles.slotImage} aria-hidden="true" />
                )}

                <span className={styles.slotText}>
                  <span className={styles.slotName}>{venue.name}</span>
                  <span className={styles.slotMeta}>{placeOf(venue)}</span>
                </span>

                <Link
                  href={hrefFor(selectedIds.filter((id) => id !== venue.id))}
                  scroll={false}
                  className={styles.slotRemove}
                  aria-label={`Remove ${venue.name}`}
                >
                  <span aria-hidden="true">×</span>
                </Link>
              </li>
            ))}

            {Array.from({ length: emptySlots }, (_, index) => (
              <li
                key={`empty-${index}`}
                className={styles.slot}
                data-filled="false"
              >
                <span className={styles.slotPlus} aria-hidden="true">
                  +
                </span>
                <span className={styles.slotText}>
                  <span className={styles.slotEmpty}>
                    Venue {selected.length + index + 1}
                  </span>
                  <span className={styles.slotMeta}>
                    {selected.length + index < 2 ? 'Required' : 'Optional'}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {suggestions.length > 0 && (
            <div className={styles.suggest}>
              <span className={styles.suggestLabel}>
                Similar to {selected[0].name}:
              </span>

              <ul className={styles.suggestList}>
                {suggestions.map((venue) => (
                  <li key={venue.id}>
                    <Link
                      href={hrefFor([...selectedIds, venue.id])}
                      scroll={false}
                      className={styles.suggestChip}
                    >
                      <span aria-hidden="true">+</span> {venue.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selected.length > 0 && (
            <div className={styles.panelFoot}>
              <Link
                href={hrefFor([])}
                scroll={false}
                className={styles.btnOutline}
              >
                Clear all
              </Link>
              <Link href="/explore" className={styles.btnGhost}>
                Browse more venues
              </Link>
            </div>
          )}
        </section>

        {model ? (
          <CompareExperience model={model} removeHrefs={removeHrefs} />
        ) : (
          <section className={styles.emptyState} aria-live="polite">
            <h2 className={styles.emptyTitle}>
              {selected.length === 0
                ? 'Choose two or more venues to compare'
                : 'Add one more venue to start comparing'}
            </h2>

            <p className={styles.emptyText}>
              {selected.length === 0
                ? 'Search above and pick your first venue. We’ll suggest similar ones to compare it with.'
                : `You’ve picked ${selected[0].name}. Add at least one more venue to see them side by side.`}
            </p>

            <Link href="/explore" className={styles.btnPrimary}>
              Browse all venues <span aria-hidden="true">→</span>
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
