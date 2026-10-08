import type { Metadata } from 'next';
import { pageMetadata } from '../../lib/seo';

import { fetchVenuesServer } from '../../lib/venues';
import type { Venue } from '../../lib/data';
import {
  buildCollectionVenues,
  fetchCollectionRooms,
} from '../../lib/collections';
import {
  fetchPublishedFeatures,
  withBundledFallback,
} from '../../lib/compare/get-comparison';
import { MotionRoot } from '../../components/collections/MotionRoot';
import { Reveal } from '../../components/collections/Reveal';
import { CollectionsBrowser } from '../../components/collections/CollectionsBrowser';
import { VenueShowcase } from '../../components/collections/VenueShowcase';
import styles from '../../components/collections/collections.module.css';

export const metadata: Metadata = pageMetadata({
  title: 'Curated Wedding Venue Collections',
  description:
    'Browse curated collections of verified destination wedding venues in Hyderabad and across India, from palaces to luxury hotels and resorts.',
  path: '/collections',
});

/*
 * Rendered per-request so the collections always reflect the
 * venues currently published in Supabase (same approach as
 * app/page.tsx and app/explore/page.tsx).
 */
export const dynamic = 'force-dynamic';

/* Every published venue is in the collection, up to this many. */
const MAX_VENUES = 24;

/*
 * Server Component: venues, room photos and verified amenities are loaded
 * here, so every card and every showcase panel is in the initial HTML.
 * Only the gallery, counters, reveal and showcase tabs are client
 * components, and they receive plain serialisable data.
 */
export default async function Collections() {
  let venues: Venue[] = [];

  try {
    venues = await fetchVenuesServer();
  } catch (err) {
    console.error('Failed to load venues:', err);
  }

  const shown = venues.slice(0, MAX_VENUES);

  const [roomsByVenue, featuresFromDb] = await Promise.all([
    fetchCollectionRooms(shown.map((v) => v.dbId)),
    fetchPublishedFeatures(shown.map((v) => v.dbId)),
  ]);

  const collection = buildCollectionVenues(
    shown,
    roomsByVenue,
    withBundledFallback(shown, featuresFromDb),
  );

  const maxCapacity = Math.max(0, ...collection.map((v) => v.capacity ?? 0));

  return (
    /* The outer wrapper clips stray horizontal overflow (no sideways scroll on
       mobile) while still letting the showcase band run edge to edge. */
    <div className={styles.shell}>
      <main id="main-content" className="page">
        {/* Keep revealed content visible when JavaScript is off. */}
        <noscript>
          <style>
            {'[data-reveal]{opacity:1!important;transform:none!important}'}
          </style>
        </noscript>

        <MotionRoot>
          <Reveal>
            <div className="centerIntro">
              <span className="kicker">CURATED COLLECTIONS</span>
              <h1>Choose the mood before the menu.</h1>
              <p>
                Destination wedding discovery starts with the experience you
                want guests to remember.
              </p>
            </div>
          </Reveal>

          {collection.length === 0 ? (
            <div className="emptyState">
              <p>No venues are published yet — check back soon.</p>
            </div>
          ) : (
            <>
              <section aria-labelledby="collection-title">
                <h2 id="collection-title" className={styles.sectionTitle}>
                  Explore the collection
                </h2>

                <CollectionsBrowser
                  venues={collection}
                  maxCapacity={maxCapacity}
                />
              </section>

              <section className={styles.band} aria-labelledby="showcase-title">
                <div className={styles.bandInner}>
                  <Reveal>
                    <div className={styles.bandIntro}>
                      <p className={styles.kicker}>Venue showcase</p>
                      <h2 id="showcase-title">
                        Step inside, one venue at a time.
                      </h2>
                      <p>
                        Choose a venue to browse its photos and see its key
                        facts at a glance.
                      </p>
                    </div>
                  </Reveal>

                  <Reveal>
                    <VenueShowcase venues={collection} />
                  </Reveal>
                </div>
              </section>
            </>
          )}
        </MotionRoot>
      </main>
    </div>
  );
}
