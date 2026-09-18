import Link from 'next/link';
import { notFound } from 'next/navigation';
import { venues } from '../../../lib/data';

export default async function Venue({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const v = venues.find((x) => x.id === id);

  // If the venue does not exist, show Next.js 404 page
  if (!v) {
    notFound();
  }

  // Use the venue's actual destination.
  // This works with the newer venue data that contains `destination`.
  const destination =
    'destination' in v && v.destination
      ? v.destination
      : v.city;

  return (
    <main className="detail">
      {/* HERO */}
      <div className="detailHero">
        <img src={v.image} alt={v.name} />

        <div className="detailOverlay">
          <span className="kicker">
            ✓ VERIFIED VENUE · {destination.toUpperCase()}
          </span>

          <h1>{v.name}</h1>

          <p>
            {v.type} · {v.city}
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="detailGrid">
        <section>
          {/* INTRO */}
          <div className="detailIntro">
            <div>
              <span className="kicker">
                A PLACE TO REMEMBER
              </span>

              <h2>{v.desc}</h2>
            </div>

            <div className="rating">
              ★ {v.rating}

              <small>
                Verified profile
              </small>
            </div>
          </div>

          {/* VENUE FACTS */}
          <div className="facts">
            <div>
              <b>{v.capacity}</b>
              <span>Max guests</span>
            </div>

            <div>
              <b>Verified</b>
              <span>Venue profile</span>
            </div>

            <div>
              <b>Multi-event</b>
              <span>Celebration format</span>
            </div>

            <div>
              <b>{destination}</b>
              <span>Destination</span>
            </div>
          </div>

          {/* WHY COUPLES SHORTLIST IT */}
          <h3>
            Why couples shortlist it
          </h3>

          <div className="featureList">
            {[
              'Verified capacity & event spaces',
              'Clear venue information',
              `${destination} destination experience`,
              'Multi-event wedding weekend support',
              'Planner-ready venue information',
              'Availability-led enquiry workflow',
            ].map((x) => (
              <div key={x}>
                ✓ {x}
              </div>
            ))}
          </div>
        </section>

        {/* BOOKING CARD */}
        <aside className="bookingCard">
          <span className="kicker">
            PLAN YOUR DATE
          </span>

          <h3>
            Ready to plan your celebration?
          </h3>

          <p>
            Share your date, guest count and event
            requirements. Our team will confirm
            availability and the right next step.
          </p>

          <Link
            data-cursor="open"
            className="primaryBtn full"
            href={`/book?venue=${encodeURIComponent(
              v.id
            )}&mode=enquiry`}
          >
            Book This Venue →
          </Link>

          <Link
            data-cursor="view"
            className="outlineBtn full"
            href={`/book?venue=${encodeURIComponent(
              v.id
            )}&mode=proposal`}
          >
            Get a Proposal →
          </Link>

          <small>
            Booking enquiries are reviewed by the
            Venue Search team. No payment is required
            at this stage.
          </small>
        </aside>
      </div>
    </main>
  );
}