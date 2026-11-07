import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';

import { VenueCard } from '../../../components/VenueCard';
import {
  MIN_VENUES_TO_INDEX,
  buildDestinations,
  destinationDescription,
  destinationIntro,
  destinationTitle,
  groupVenues,
} from '../../../lib/destinations';
import {
  buildBreadcrumbJsonLd,
  buildDestinationJsonLd,
  serializeJsonLd,
} from '../../../lib/structured-data';
import { pageMetadata, socialImage } from '../../../lib/seo';
import { fetchVenuesResultServer, toVenueSummary } from '../../../lib/venues';

/*
 * Destination landing page, e.g. /wedding-venues/hyderabad.
 *
 * A page exists for every destination that has published venues, and
 * its title, description, copy and venue list all come from those
 * venue records. Rendered on first request, then refreshed hourly.
 */
export const revalidate = 3600;

type Props = { params: Promise<{ destination: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { destination: slug } = await params;
  const { venues, failed } = await fetchVenuesResultServer();

  /* A database outage must not publish "not found" metadata. */
  if (failed) {
    return { title: 'Wedding venues', robots: { index: false, follow: true } };
  }

  const destination = buildDestinations(venues).find((d) => d.slug === slug);

  if (!destination) {
    return {
      title: 'Destination not found',
      robots: { index: false, follow: true },
    };
  }

  const first = destination.venues.find((v) => v.image);
  const base = pageMetadata({
    title: destinationTitle(destination),
    description: destinationDescription(destination),
    path: `/wedding-venues/${destination.slug}`,
    image: socialImage(first?.image, `Wedding venues in ${destination.name}`),
  });

  /* Thin pages stay reachable but are not offered to search engines. */
  return destination.venues.length < MIN_VENUES_TO_INDEX
    ? { ...base, robots: { index: false, follow: true } }
    : base;
}

export default async function DestinationPage({ params }: Props) {
  const { destination: slug } = await params;
  const { venues, failed } = await fetchVenuesResultServer();

  /*
   * Could not reach the database: answer with a server error (which
   * search engines retry) rather than a page that looks empty or a 404.
   */
  if (failed) {
    throw new Error('Venue data is temporarily unavailable.');
  }

  const destinations = buildDestinations(venues);
  const destination = destinations.find((d) => d.slug === slug);

  if (!destination) {
    /* Same place, different spelling or case: one canonical URL. */
    const normal = slug.toLowerCase();
    if (normal !== slug && destinations.some((d) => d.slug === normal)) {
      permanentRedirect(`/wedding-venues/${normal}`);
    }
    notFound();
  }

  const path = `/wedding-venues/${destination.slug}`;
  const groups = groupVenues(destination);
  const intro = destinationIntro(destination);
  const others = destinations.filter(
    (d) => d.slug !== destination.slug && d.venues.length >= MIN_VENUES_TO_INDEX
  );

  const where =
    destination.state && destination.state !== destination.name
      ? `${destination.name}, ${destination.state}`
      : destination.name;

  return (
    <main id="main-content" className="page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildBreadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'Wedding venues', path: '/wedding-venues' },
              { name: destination.name, path },
            ])
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildDestinationJsonLd({
              name: destination.name,
              path,
              description: destinationDescription(destination),
              venues: destination.venues,
            })
          ),
        }}
      />

      <nav aria-label="Breadcrumb" style={{ fontSize: 14, marginBottom: 18 }}>
        <Link href="/">Home</Link> <span aria-hidden="true">/</span>{' '}
        <Link href="/wedding-venues">Wedding venues</Link>{' '}
        <span aria-hidden="true">/</span>{' '}
        <span aria-current="page">{destination.name}</span>
      </nav>

      <header className="centerIntro">
        <span className="kicker">
          WEDDING VENUES IN {destination.name.toUpperCase()}
        </span>
        <h1>Wedding venues in {where}</h1>
        {intro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            className="primaryBtn"
            href={`/explore?destination=${encodeURIComponent(
              destination.state || destination.name
            )}`}
          >
            Filter these venues →
          </Link>
          <Link className="outlineBtn" href="/compare">
            Compare venues
          </Link>
        </div>
      </header>

      {groups.map((group) => (
        <section
          key={group.key}
          style={{ padding: '48px 0 0' }}
          aria-labelledby={`group-${group.key}`}
        >
          <h2 id={`group-${group.key}`}>{group.heading}</h2>

          <div className="venueGrid">
            {group.venues.map((venue) => (
              <VenueCard
                key={venue.id}
                v={{
                  ...toVenueSummary(venue),
                  slug: venue.id,
                  description: venue.desc,
                }}
              />
            ))}
          </div>
        </section>
      ))}

      <section style={{ padding: '56px 0 0' }}>
        <h2>Planning a wedding in {destination.name}</h2>
        <p>
          Open any venue to see its event spaces, guest-room categories and
          amenities, then send an enquiry or place an Instant Hold. To weigh
          several {destination.name} venues against each other, use{' '}
          <Link href="/compare">compare venues</Link>, or read{' '}
          <Link href="/how-it-works">how it works</Link>.
        </p>
      </section>

      {others.length > 0 && (
        <nav
          aria-label="Other wedding destinations"
          style={{ padding: '40px 0 0' }}
        >
          <h2>Wedding venues in other destinations</h2>
          <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: 0, listStyle: 'none' }}>
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  className="outlineBtn"
                  href={`/wedding-venues/${other.slug}`}
                >
                  {other.name} ({other.venues.length})
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <section className="trustPanel" style={{ marginTop: 56 }}>
        <h2>Ready to shortlist venues in {destination.name}?</h2>
        <p>
          Browse every venue on The Venue Search, or see how other
          destinations compare in our curated collections.
        </p>
        <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', marginTop: 20 }}>
          <Link className="primaryBtn" href="/explore">
            Explore all venues
          </Link>
          <Link className="outlineBtn" href="/collections">
            Browse collections
          </Link>
        </div>
      </section>
    </main>
  );
}
