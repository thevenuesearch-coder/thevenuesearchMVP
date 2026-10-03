import type { Venue } from '../lib/data';

import { imgProps } from '../lib/image';
import { formatCapacityRange, CAPACITY_UNKNOWN_LABEL } from '../lib/capacity';
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
          <img
            {...imgProps(venue.image, venue.name, {
              width: 640,
              height: 420,
              sizes: '(max-width: 900px) 100vw, 380px',
            })}
          />
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
            {formatCapacityRange(venue.capacityMin, venue.capacity) ??
              CAPACITY_UNKNOWN_LABEL}
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
