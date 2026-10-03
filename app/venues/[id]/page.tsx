import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  fetchVenueResultServer,
  fetchVenuesServer,
} from '../../../lib/venues';
import {
  buildVenueJsonLd,
  fetchVenueLocationServer,
  serializeJsonLd,
} from '../../../lib/structured-data';
import {
  clip,
  pageMetadata,
  socialImage,
} from '../../../lib/seo';
import { VenuePageClient } from '../../../components/VenuePageClient';

/*
 * Rendered per-request so venue data (and therefore SEO metadata)
 * always reflects what is currently published.
 */
export const dynamic = 'force-dynamic';

type VenuePageProps = {
  params: Promise<{ id: string }>;
};

/*
 * Per-venue SEO metadata, generated from the venue's own data:
 * name, city/destination, type and description. Adds the canonical
 * URL and a 1200px social image (the originals are several MB).
 */
export async function generateMetadata({
  params,
}: VenuePageProps): Promise<Metadata> {
  const { id } = await params;

  const { venue } = await fetchVenueResultServer(id);

  if (!venue) {
    return {
      title: 'Venue not found',
      robots: { index: false, follow: true },
    };
  }

  const location = venue.city || venue.destination || 'India';

  const venueType = venue.type
    ? venue.type.toLowerCase()
    : 'wedding venue';

  const intro = venue.desc
    ? clip(venue.desc, 140)
    : `A verified ${venueType} in ${location} for destination weddings and celebrations.`;

  return pageMetadata({
    title: `${venue.name}, ${location} — Wedding Venue`,
    description: clip(
      `${venue.name} — a verified ${venueType} in ${location}. ${intro}`,
      160
    ),
    path: `/venues/${encodeURIComponent(venue.id)}`,
    image: socialImage(
      venue.image,
      `${venue.name}, ${location}`
    ),
  });
}

/*
 * Server Component: the venue is fetched here so metadata and the
 * page body share one (de-duplicated) query, and an unknown slug
 * returns a real HTTP 404 instead of a 200 "not found" page.
 * A failed lookup (Supabase unavailable) is NOT turned into a 404,
 * so a temporary outage can never get a venue de-indexed.
 */
export default async function VenuePage({
  params,
}: VenuePageProps) {
  const { id } = await params;

  const [{ venue, failed }, location, allVenues] =
    await Promise.all([
      fetchVenueResultServer(id),
      fetchVenueLocationServer(id),
      fetchVenuesServer(),
    ]);

  if (!venue && !failed) {
    notFound();
  }

  /*
   * Other venues for the "Explore more venues" links: same
   * destination first, then the rest, max 3.
   */
  const related = venue
    ? [...allVenues]
        .filter((other) => other.id !== venue.id)
        .sort(
          (a, b) =>
            Number(b.destination === venue.destination) -
            Number(a.destination === venue.destination)
        )
        .slice(0, 3)
        .map(({ id, name, city, type }) => ({
          id,
          name,
          city,
          type,
        }))
    : [];

  return (
    <>
      {venue && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(
              buildVenueJsonLd(venue, location)
            ),
          }}
        />
      )}

      <VenuePageClient
        initialVenue={venue}
        relatedVenues={related}
      />
    </>
  );
}
