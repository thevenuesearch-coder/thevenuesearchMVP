import type { Metadata } from 'next';
import { pageMetadata } from '../../lib/seo';
import Link from 'next/link';

import { fetchVenuesServer } from '../../lib/venues';
import type { Venue } from '../../lib/data';
import { imgProps } from '../../lib/image';

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

/*
 * Server Component: venues are fetched here, server-side, so the
 * collection cards are present in the initial HTML. This page used
 * to be a client component that fetched /api/venues in a
 * useEffect, so the HTML only ever contained "Loading
 * collections…". The markup and styling below are unchanged.
 */
export default async function Collections() {
  let venues: Venue[] = [];

  try {
    venues = await fetchVenuesServer();
  } catch (err) {
    console.error('Failed to load venues:', err);
  }

  const featured = venues.slice(0, 4);

  return (
    <main id="main-content" className="page">
      <div className="centerIntro">
        <span className="kicker">CURATED COLLECTIONS</span>
        <h1>Choose the mood before the menu.</h1>
        <p>
          Destination wedding discovery starts with the
          experience you want guests to remember.
        </p>
      </div>

      {featured.length === 0 ? (
        <div className="emptyState">
          <p>No venues are published yet — check back soon.</p>
        </div>
      ) : (
        <div className="collectionGrid">
          {featured.map((v) => (
            <Link
              className="collectionLarge"
              href={`/venues/${v.id}`}
              key={v.id}
            >
              <img
                {...imgProps(
                  v.image,
                  v.city
                    ? `${v.name}, ${v.city}`
                    : v.name,
                  {
                    width: 900,
                    height: 460,
                    sizes: '(max-width: 900px) 100vw, 50vw',
                  }
                )}
              />
              <div>
                <span className="kicker">COLLECTION</span>
                <h2>{v.name}</h2>
                <p>{v.type}</p>
                <b>Explore →</b>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
