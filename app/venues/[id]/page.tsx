import Link from 'next/link';
import { venues } from '../../../lib/data';

export default async function Venue({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = venues.find((x) => x.id === id) || venues[0];

  return (
    <main className="detail">
      <div className="detailHero">
        <img src={v.image} alt={v.name} />
        <div className="detailOverlay">
          <span className="kicker">✓ VERIFIED VENUE · UDAIPUR</span>
          <h1>{v.name}</h1>
          <p>{v.type} · {v.city}</p>
        </div>
      </div>
      <div className="detailGrid">
        <section>
          <div className="detailIntro">
            <div>
              <span className="kicker">A PLACE TO REMEMBER</span>
              <h2>{v.desc}</h2>
            </div>
            <div className="rating">★ {v.rating}<small>Verified profile</small></div>
          </div>
          <div className="facts">
            <div><b>{v.capacity}</b><span>Max guests</span></div>
            <div><b>Verified</b><span>Venue profile</span></div>
            <div><b>Multi-event</b><span>Celebration format</span></div>
            <div><b>Udaipur</b><span>Destination</span></div>
          </div>
          <h3>Why couples shortlist it</h3>
          <div className="featureList">
            {['Verified capacity & event spaces','Clear venue information','Lake / heritage destination experience','Multi-event wedding weekend support','Planner-ready venue information','Availability-led enquiry workflow'].map((x) => <div key={x}>✓ {x}</div>)}
          </div>
        </section>
        <aside className="bookingCard">
          <span className="kicker">PLAN YOUR DATE</span>
          <h3>Ready to plan your celebration?</h3>
          <p>Share your date, guest count and event requirements. Our team will confirm availability and the right next step.</p>
          <Link data-cursor="open" className="primaryBtn full" href={`/book?venue=${v.id}&mode=enquiry`}>Book This Venue →</Link>
          <Link data-cursor="view" className="outlineBtn full" href={`/book?venue=${v.id}&mode=proposal`}>Get a Proposal →</Link>
          <small>Booking enquiries are reviewed by the Venue Search team. No payment is required at this stage.</small>
        </aside>
      </div>
    </main>
  );
}
