import Link from 'next/link';
import type { Metadata } from 'next';
import { pageMetadata } from '../../lib/seo';
import { MIN_VENUES_TO_INDEX, buildDestinations } from '../../lib/destinations';
import { fetchVenuesResultServer } from '../../lib/venues';
 
const baseMetadata = pageMetadata({
  title: 'Wedding Venues in India & Hyderabad',
  description:
    'Browse verified wedding venues, hotels, resorts and palaces across India and Hyderabad. Compare spaces and capacity, then enquire or hold a date.',
  path: '/wedding-venues',
});

/* Keeps this page's original, shorter social-share description. */
const ogDescription =
  'Discover verified wedding venues, hotels, resorts and palaces across India. Compare event spaces and capacity, then enquire or hold a date.';

export const metadata: Metadata = {
  ...baseMetadata,
  openGraph: {
    ...baseMetadata.openGraph,
    description: ogDescription,
  },
  twitter: {
    ...baseMetadata.twitter,
    description: ogDescription,
  },
};

/* Destination links come from the venue list, so render per request. */
export const dynamic = 'force-dynamic';

const faqs: [string, string][] = [
  [
    'How do I find the right wedding venue on The Venue Search?',
    'Use the destination, venue type and guest-count filters on the explore page to narrow down verified wedding venues by place and capacity. Every venue page lists its event spaces, capacity and amenities so you can compare without back-and-forth calls.',
  ],
  [
    'Does The Venue Search cover destination wedding venues outside Hyderabad?',
    'Yes. While the Hyderabad network is the most established, The Venue Search is built around destination weddings more broadly, including palace and resort venues in other parts of India. New destinations are added as venue partners are verified.',
  ],
  [
    "What does a 'verified' venue listing mean?",
    'A verified listing has been checked for accurate capacity and authentic images, so you can compare venues without the guesswork that comes from unverified broker listings.',
  ],
  [
    'Can I book accommodation for wedding guests along with the venue?',
    'Many hotel and resort partners offer guest room blocks alongside the event space, which is especially useful for destination weddings. Room availability is shown on the individual venue page where applicable.',
  ],
  [
    "What's the difference between an Instant Hold and Instant Book?",
    'An Instant Hold lets you provisionally reserve a date on your primary venue while you finalise decisions. Instant Book is used for eligible smaller sub-events, such as mehendi, sangeet or haldi spaces, where confirmation can happen immediately.',
  ],
  [
    'Is there a fee for using The Venue Search to find a venue?',
    'Browsing, comparing and shortlisting venues is free for couples and planners. The Venue Search earns a commission from venue partners on confirmed bookings, so the incentive is aligned with helping you find and confirm the right venue.',
  ],
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(([q, a]) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default async function WeddingVenuesPage() {
  /*
   * Destinations and the Hyderabad venue links come from the
   * published venue records, so they can never point at a venue
   * that no longer exists.
   */
  const { venues } = await fetchVenuesResultServer();
  /* Only destinations with enough venues to have an indexable page. */
  const destinations = buildDestinations(venues).filter(
    (d) => d.venues.length >= MIN_VENUES_TO_INDEX
  );
  const hyderabad = destinations.find((d) => d.slug === 'hyderabad');
  const hyderabadVenues = (hyderabad?.venues ?? []).slice(0, 4);

  return (
    <main id="main-content" className="page narrow">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="centerIntro">
        <span className="kicker">WEDDING VENUES &amp; DESTINATION WEDDING VENUES</span>
        <h1>Find verified wedding venues in India and Hyderabad.</h1>
        <p>
          From intimate banquet halls to grand destination wedding palaces, The Venue Search
          brings together verified wedding venues, event venues and luxury hotel ballrooms
          across India in one transparent, bookable place.
        </p>
        <Link data-cursor="open" className="primaryBtn large" href="/explore">
          Explore Venues →
        </Link>
      </div>

      <section style={{ padding: '60px 0' }}>
        <h2>Wedding venues in India</h2>
        <p>
          Planning a wedding in India means choosing between hundreds of possible venue types —
          five-star hotel ballrooms, heritage palaces, destination resorts, garden lawns and
          dedicated banquet halls. Each comes with different capacity limits, seasonal pricing
          and policies around vendor access, decor and catering. The Venue Search standardises
          this information across every listed venue, so couples and planners can compare
          wedding venues on equal footing instead of chasing separate quotes from each property.
        </p>
        <Link href="/explore">Browse all wedding venues in India →</Link>
      </section>

      {destinations.length > 0 && (
        <section style={{ padding: '60px 0' }} aria-labelledby="by-destination">
          <h2 id="by-destination">Wedding venues by destination</h2>
          <p>
            Browse the wedding venues listed in each destination, from lake
            palaces and desert forts to hill resorts and city hotels.
          </p>
          <ul
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              padding: 0,
              listStyle: 'none',
            }}
          >
            {destinations.map((destination) => (
              <li key={destination.slug}>
                <Link
                  className="outlineBtn"
                  href={`/wedding-venues/${destination.slug}`}
                >
                  {destination.name} ({destination.venues.length})
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section style={{ padding: '60px 0' }}>
        <h2>Wedding venues in Hyderabad</h2>
        <p>
          Hyderabad is home to some of India&rsquo;s most sought-after wedding venues, from the
          landmark hotel ballrooms to convention-scale properties built for large, multi-day
          celebrations. {hyderabadVenues.length > 0 ? (
            <>
              Our Hyderabad network includes{' '}
              {hyderabadVenues.map((v) => v.name).join(', ')}
              {hyderabad && hyderabad.venues.length > hyderabadVenues.length
                ? ` and ${hyderabad.venues.length - hyderabadVenues.length} more`
                : ''}
              . Each venue page lists its event spaces, capacity and amenities.
            </>
          ) : (
            <>Each venue page lists its event spaces, capacity and amenities.</>
          )}
        </p>
        {hyderabadVenues.length > 0 && (
          <div className="featureList">
            {hyderabadVenues.map((venue) => (
              <div key={venue.id}>
                <Link href={`/venues/${venue.id}`}>
                  <b>{venue.name}</b>
                  <br />
                  <small>{[venue.city, venue.type].filter(Boolean).join(' · ')}</small>
                </Link>
              </div>
            ))}
          </div>
        )}
        <Link href={hyderabad ? '/wedding-venues/hyderabad' : '/explore?destination=Hyderabad'}>
          View all wedding venues in Hyderabad →
        </Link>
      </section>

      <section style={{ padding: '60px 0' }}>
        <h2>Banquet halls for weddings and receptions</h2>
        <p>
          For couples looking for a dedicated banquet hall rather than a full hotel takeover, our
          listings include standalone banquet spaces sized for everything from a 50-guest
          engagement to a 600-plus guest reception. Filter by guest count on the explore page to
          see banquet halls that genuinely fit your headcount — no under- or over-booking a space
          based on a vague verbal estimate.
        </p>
      </section>

      <section style={{ padding: '60px 0' }}>
        <h2>Luxury hotels and resorts</h2>
        <p>
          Luxury hotel and resort venues offer more than a ballroom — on-site guest
          accommodation, multiple event spaces for mehendi, sangeet and haldi functions, and
          in-house catering and event teams. This is often the simplest option for multi-day
          wedding celebrations or destination weddings, since guests can stay where the events
          are happening.
        </p>
      </section>

      <section style={{ padding: '60px 0' }}>
        <h2>Destination wedding venues</h2>
        <p>
          Destination weddings add logistical layers that a local wedding doesn&rsquo;t have —
          guest travel, multi-day accommodation blocks, and vendor coordination across a location
          the couple may not know well. Every destination wedding venue listing includes guest
          capacity across multiple event spaces, room-block availability where offered, and
          clear seasonality and blackout-date information so you&rsquo;re not surprised late in
          planning.
        </p>
      </section>

      <section style={{ padding: '60px 0' }}>
        <h2>Venue booking and guest room booking</h2>
        <p>
          Once you&rsquo;ve shortlisted a venue, The Venue Search supports two booking paths
          depending on where you are in the decision: an <strong>Instant Hold</strong> to
          provisionally lock your primary venue date while you finalise other decisions, and{' '}
          <strong>Instant Book</strong> for smaller confirmed sub-events. Where a venue offers
          guest accommodation, room-block details for wedding guests are shown alongside the
          event space.
        </p>
      </section>

      <section style={{ padding: '60px 0' }}>
        <h2>How The Venue Search works</h2>
        <div className="steps">
          {[
            ['01', 'Discover', 'Filter verified wedding venues by destination, venue type and guest count.'],
            ['02', 'Compare', 'Review capacity, event spaces and amenity details side by side.'],
            ['03', 'Hold', 'Place an Instant Hold on your primary venue date while you decide.'],
            ['04', 'Confirm', 'Move from hold to confirmed booking with support at every step.'],
          ].map((s) => (
            <div className="step" key={s[0]}>
              <span>{s[0]}</span>
              <div>
                <h3>{s[1]}</h3>
                <p>{s[2]}</p>
              </div>
            </div>
          ))}
        </div>
        <Link href="/how-it-works">Read the full how-it-works guide →</Link>
      </section>

      <section style={{ padding: '60px 0' }}>
        <h2>What to check before booking a wedding venue</h2>
        <ul>
          <li><strong>Guest capacity vs. your headcount</strong> — confirm both seated and standing capacity for each function.</li>
          <li><strong>Total pricing, not a starting quote</strong> — ask what&rsquo;s included (catering, decor, taxes) versus billed separately.</li>
          <li><strong>Blackout dates and seasonality</strong> — peak wedding season pricing and availability can shift significantly.</li>
          <li><strong>Vendor policies</strong> — whether outside caterers, decorators and photographers are permitted.</li>
          <li><strong>Guest accommodation</strong> — room-block availability and rates if guests are travelling in.</li>
          <li><strong>Cancellation and hold terms</strong> — how long a date can be held before it needs to be confirmed.</li>
        </ul>
      </section>

      <section style={{ padding: '60px 0' }}>
        <h2>Frequently asked questions</h2>
        {faqs.map(([q, a]) => (
          <div key={q} style={{ marginBottom: 24 }}>
            <h3>{q}</h3>
            <p>{a}</p>
          </div>
        ))}
      </section>

      <section className="trustPanel">
        <h2>Ready to find your wedding venue?</h2>
        <p>
          Search verified wedding venues, banquet halls and destination wedding venues across
          India, with a clear path from discovery to a confirmed booking.
        </p>
        <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', marginTop: 20 }}>
          <Link data-cursor="open" className="primaryBtn" href="/explore">Find Your Venue</Link>
          <Link className="outlineBtn" href="/collections">Browse Collections</Link>
          <Link className="outlineBtn" href="/for-venues">List Your Venue</Link>
        </div>
      </section>
    </main>
  );
}
