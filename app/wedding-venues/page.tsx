import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wedding Venues in India & Hyderabad',
  description:
    'Find and book verified wedding venues, banquet halls, luxury hotels and destination wedding venues across India and Hyderabad. Transparent pricing, instant holds, and a booking journey built around certainty.',
  alternates: {
    canonical: '/wedding-venues',
  },
  openGraph: {
    title: 'Wedding Venues in India & Hyderabad | The Venue Search',
    description:
      'Discover verified wedding venues, banquet halls and destination wedding venues across India. Compare, hold, and book with transparent pricing.',
    url: '/wedding-venues',
  },
};

const faqs: [string, string][] = [
  [
    'How do I find the right wedding venue on The Venue Search?',
    'Use the destination, venue and guest-count filters on the explore page to narrow down verified wedding venues by city, capacity and budget. Every listed venue includes verified pricing, capacity and amenity details so you can compare without back-and-forth calls.',
  ],
  [
    'Does The Venue Search cover destination wedding venues outside Hyderabad?',
    'Yes. While the Hyderabad network is the most established, The Venue Search is built around destination weddings more broadly, including palace and resort venues in other parts of India. New destinations are added as venue partners are verified.',
  ],
  [
    "What does a 'verified' venue listing mean?",
    'A verified listing has been checked for accurate capacity, authentic images, transparent pricing structures, and clear policies such as blackout dates and cancellation terms — removing the guesswork that comes from unverified broker listings.',
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

const hyderabadVenues: [string, string, string][] = [
  ['Park Hyatt Hyderabad', 'Banjara Hills', '/venues/hyderabad-10'],
  ['Hyderabad Marriott Hotel & Convention Centre', 'Tank Bund', '/venues/hyderabad-9'],
  ['Taj Krishna', 'Banjara Hills', '/venues/hyderabad-8'],
  ['The Westin Hyderabad Mindspace', 'Hitec City', '/venues/hyderabad-7'],
];

export default function WeddingVenuesPage() {
  return (
    <main className="page narrow">
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

      <section style={{ padding: '60px 0' }}>
        <h2>Wedding venues in Hyderabad</h2>
        <p>
          Hyderabad is home to some of India&rsquo;s most sought-after wedding venues, from the
          landmark ballrooms of Banjara Hills and Tank Bund to convention-scale properties built
          for large, multi-day celebrations. Our verified Hyderabad network includes properties
          such as Park Hyatt Hyderabad, Hyderabad Marriott Hotel &amp; Convention Centre, Taj
          Krishna and The Westin Hyderabad Mindspace — each with verified capacity, pricing and
          amenity details.
        </p>
        <div className="featureList">
          {hyderabadVenues.map(([name, area, href]) => (
            <div key={name}>
              <Link href={href}>
                <b>{name}</b>
                <br />
                <small>{area}, Hyderabad</small>
              </Link>
            </div>
          ))}
        </div>
        <Link href="/explore?destination=Hyderabad">View all wedding venues in Hyderabad →</Link>
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
            ['01', 'Discover', 'Filter verified wedding venues by destination, guest count and budget.'],
            ['02', 'Compare', 'Review standardised pricing, capacity and amenity details side by side.'],
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
          India — with transparent pricing and a clear path from discovery to confirmed booking.
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
