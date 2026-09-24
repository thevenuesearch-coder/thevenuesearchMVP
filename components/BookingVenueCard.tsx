import type { Venue } from '../lib/data';

type BookingVenueCardProps = {
  venue: Venue;
};

export function BookingVenueCard({
  venue,
}: BookingVenueCardProps) {
  return (
    <aside className="bookingVenueCard">
      <div className="bookingVenueImage">
        {venue.image ? (
          <img src={venue.image} alt={venue.name} />
        ) : (
          <div>The Venue Search</div>
        )}
      </div>

      <div className="bookingVenueBody">
        <span className="eyebrow">
          {venue.type}
          {' · '}
          {venue.city}
        </span>

        <h2>{venue.name}</h2>

        <p>{venue.desc}</p>

        <div className="bookingVenueMeta">
          <span>
            Up to {venue.capacity.toLocaleString()} guests
          </span>

          {venue.rating && <span>★ {venue.rating}</span>}
        </div>

        {venue.verified && (
          <span className="bookingVerified">
            ✓ Verified venue
          </span>
        )}
      </div>
    </aside>
  );
}
