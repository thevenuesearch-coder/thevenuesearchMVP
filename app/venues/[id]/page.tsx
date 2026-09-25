import type { Metadata } from 'next';

import { fetchVenueBySlugServer } from '../../../lib/venues';
import { VenuePageClient } from '../../../components/VenuePageClient';

/*
 * Rendered per-request rather than statically at build time --
 * see app/page.tsx for why. Applies to generateMetadata too, so a
 * venue's SEO tags stay accurate if its details change.
 */
export const dynamic = 'force-dynamic';

type VenuePageProps = {
  params: Promise<{ id: string }>;
};

/*
 * Per-venue SEO: previously every page on the site shared the
 * same title/description (the root layout's default), so search
 * engines had no way to tell venue pages apart or rank them for
 * venue-specific searches. Built from real venue data -- name,
 * city, type, and a trimmed version of the venue's own
 * description -- never invented.
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

  const location = venue.city || venue.destination || 'India';
  const venueType = venue.type
    ? venue.type.toLowerCase()
    : 'wedding venue';

  const title = `${venue.name}, ${location} — Wedding Venue`;

  const trimmedDesc = venue.desc
    ? venue.desc.length > 140
      ? `${venue.desc.slice(0, 140).trim()}…`
      : venue.desc
    : `A verified ${venueType} in ${location} for destination weddings and celebrations.`;

  const description = `${venue.name} — a verified ${venueType} in ${location}. ${trimmedDesc}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: venue.image ? [venue.image] : undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: venue.image ? [venue.image] : undefined,
    },
  };
}

/*
 * Server Component: the venue is fetched here (server-side) both
 * to power the metadata above and so the page's real content --
 * name, description, spaces, rooms -- is present in the initial
 * HTML rather than only appearing after a client-side fetch.
 */
export default async function VenuePage({
  params,
}: VenuePageProps) {
  const { id } = await params;
  const venue = await fetchVenueBySlugServer(id);

  return <VenuePageClient initialVenue={venue} />;
}
