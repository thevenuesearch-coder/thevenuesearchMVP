import type { Metadata } from 'next';

import { fetchVenueBySlugServer } from '../../../lib/venues';
import { VenuePageClient } from '../../../components/VenuePageClient';

/*
 * Rendered per-request rather than statically at build time.
 * This also applies to generateMetadata so that venue SEO data
 * always reflects the latest venue information.
 */
export const dynamic = 'force-dynamic';

type VenuePageProps = {
  params: Promise<{ id: string }>;
};

/*
 * Per-venue SEO metadata.
 *
 * The metadata is generated from the actual venue data:
 * - venue name
 * - city / destination
 * - venue type
 * - venue description
 */
export async function generateMetadata({
  params,
}: VenuePageProps): Promise<Metadata> {
  const { id } = await params;

  const venue = await fetchVenueBySlugServer(id);

  if (!venue) {
    return {
      title: 'Venue not found',
    };
  }

  const location =
    venue.city ||
    venue.destination ||
    'India';

  const venueType = venue.type
    ? venue.type.toLowerCase()
    : 'wedding venue';

  const title =
    `${venue.name}, ${location} — Wedding Venue`;

  const trimmedDesc = venue.desc
    ? venue.desc.length > 140
      ? `${venue.desc.slice(0, 140).trim()}…`
      : venue.desc
    : `A verified ${venueType} in ${location} for destination weddings and celebrations.`;

  const description =
    `${venue.name} — a verified ${venueType} in ${location}. ${trimmedDesc}`;

  return {
    title,
    description,

    openGraph: {
      title,
      description,
      images: venue.image
        ? [venue.image]
        : undefined,
      type: 'website',
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: venue.image
        ? [venue.image]
        : undefined,
    },
  };
}

/*
 * Server Component.
 *
 * The venue is fetched server-side so that:
 * 1. Metadata has access to the real venue data.
 * 2. VenuePageClient receives the venue immediately.
 * 3. Venue content is available during the initial render.
 */
export default async function VenuePage({
  params,
}: VenuePageProps) {
  const { id } = await params;

  const venue = await fetchVenueBySlugServer(id);

  return (
    <VenuePageClient
      initialVenue={venue}
    />
  );
}