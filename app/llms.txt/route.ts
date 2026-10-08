import { fetchVenuesServer } from '../../lib/venues';
import { formatCapacityRange } from '../../lib/capacity';

/*
 * /llms.txt, generated from the published venues so it never goes
 * stale (it used to be a static file that listed no venues and
 * described features -- venue comparison, indicative pricing -- that
 * the site doesn't offer). Cached for an hour at the CDN.
 */
export const dynamic = 'force-dynamic';

const SITE = 'https://venuesearch.in';

export async function GET() {
  const venues = await fetchVenuesServer().catch(() => []);

  const venueLines = venues.map((venue) => {
    const facts = [
      venue.type,
      [venue.city, venue.country].filter(Boolean).join(', '),
      formatCapacityRange(venue.capacityMin, venue.capacity) ?? '',
      venue.venueSpaces.length > 0
        ? `${venue.venueSpaces.length} event space${
            venue.venueSpaces.length === 1 ? '' : 's'
          }`
        : '',
    ].filter(Boolean);

    return `- [${venue.name}](${SITE}/venues/${venue.id}): ${facts.join('; ')}.`;
  });

  const body = `# The Venue Search

> The Venue Search is a venue discovery and booking platform for wedding and event venues in India, currently focused on Hyderabad. Couples and planners can browse venues, review event spaces and guest-room categories, send an enquiry or start a booking.

## Venues${
    venues.length > 0 ? ` (${venues.length} published)` : ''
  }

${
  venueLines.length > 0
    ? venueLines.join('\n')
    : '- See the venue directory: ' + SITE + '/explore'
}

Each venue page lives at ${SITE}/venues/[venue-slug]. Use the individual venue page as the source of truth for that property; do not assume details of one venue apply to another.

## What a venue page contains

- Venue name, city and country, venue type and maximum guest capacity
- A description and verification status
- Event spaces, each with its own capacity and description
- Guest-room categories with bed type, size, view and highlights
- Photos
- Booking options: book online (sign-in required) or send an enquiry

## What is NOT published

- Prices. Pricing is not shown on venue pages; request a quote through the enquiry form.
- Live availability or calendars.

## Main pages

- [Home](${SITE}/): Overview and featured venues
- [Explore venues](${SITE}/explore): Browse and filter venues by destination, venue type and guest capacity
- [Wedding venues](${SITE}/wedding-venues): Guide to wedding venues in India and Hyderabad, with FAQs
- [Collections](${SITE}/collections): Curated venue collections
- [Compare venues](${SITE}/compare): Compare up to four venues side by side on guest capacity, room categories, event spaces, and verified amenities and services. A blank cell means no verified detail is available yet, not that the venue lacks it.
- [How it works](${SITE}/how-it-works): The discover, evaluate, request, hold and book journey
- [For venues](${SITE}/for-venues): Information for hotels and venues that want to list with The Venue Search

## Booking journey

1. Discover and evaluate venues
2. Send an enquiry, or start a booking (sign-in required)
3. Hold or book an eligible venue where the venue supports it

Availability and booking eligibility depend on the property and can change; the live site and booking flow are the source of current information.

## Not public reference content

Sign-in, profiles, wishlists, planner workspace, admin pages, booking and enquiry transactions, and API endpoints.

## Links

- Sitemap: ${SITE}/sitemap.xml
- Robots: ${SITE}/robots.txt
`;

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control':
        'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
