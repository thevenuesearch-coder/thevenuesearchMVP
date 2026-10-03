import type { Venue, RoomCategory } from '../lib/data';
import {
  formatCapacityMax,
  formatCapacityRange,
  formatGuests,
} from '../lib/capacity';

/*
 * Public, crawler- and assistant-readable venue content.
 *
 * Why this file exists
 * --------------------
 * The venue page is already server-rendered, but several important
 * facts were only reachable after a user interaction:
 *   - every event space except the currently selected one
 *     (the others were just a name + "Up to N" button),
 *   - the full room description, highlights, amenities, technology,
 *     services, dining, bathroom and inclusions (modal on click),
 *   - venue-level facts (type, maximum capacity, booking options).
 *
 * These components render that same data as plain semantic HTML in
 * the initial response. They use the `vs-sr-only` utility (see
 * styles/globals.css), so the visual design is unchanged. The text
 * mirrors what a user can already reach through the spaces selector
 * and the room modal -- nothing here is extra or different content.
 *
 * Only public columns are used (the same ones the public Supabase
 * policies already expose for published venues).
 */

/*
 * Starting prices (`venues.indicative_price`) exist in the public
 * data but are NOT shown anywhere in the current UI. Publishing
 * rates is a commercial decision (many premium venues do not allow
 * it), so this stays off until the founders confirm each venue has
 * agreed. Flip to `true` to expose a "Starting price" fact.
 */
export const SHOW_PUBLIC_STARTING_PRICE = false;

function unique(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const value of values) {
    const v = (value || '').trim();
    if (v && !seen.has(v.toLowerCase())) {
      seen.add(v.toLowerCase());
      out.push(v);
    }
  }

  return out;
}

function formatInr(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

/*
 * Venue-level facts: location, type, capacity, rooms, booking options.
 */
export function VenueFacts({ venue }: { venue: Venue }) {
  const location = unique([
    venue.city,
    venue.destination,
    venue.country,
  ]).join(', ');

  const spaces = venue.venueSpaces || [];

  return (
    <section
      className="vs-sr-only"
      aria-labelledby="venue-facts-heading"
    >
      <h2 id="venue-facts-heading">
        {venue.name} at a glance
      </h2>

      <dl>
        {location && (
          <>
            <dt>Location</dt>
            <dd>{location}</dd>
          </>
        )}

        {venue.type && (
          <>
            <dt>Venue type</dt>
            <dd>{venue.type}</dd>
          </>
        )}

        {formatCapacityRange(venue.capacityMin, venue.capacity) && (
          <>
            <dt>
              {/* "Maximum" only when the text really is a maximum ("Up to N guests"). */}
              {formatCapacityRange(venue.capacityMin, venue.capacity) ===
              formatCapacityMax(venue.capacity)
                ? 'Maximum guest capacity'
                : 'Guest capacity'}
            </dt>
            <dd>
              {formatCapacityRange(venue.capacityMin, venue.capacity)}
            </dd>
          </>
        )}

        {spaces.length > 0 && (
          <>
            <dt>Event spaces</dt>
            <dd>
              {spaces.length}{' '}
              {spaces.length === 1 ? 'space' : 'spaces'}:{' '}
              {spaces.map((s) => s.name).join(', ')}
            </dd>
          </>
        )}

        {venue.rooms.length > 0 && (
          <>
            <dt>Guest rooms</dt>
            <dd>
              {venue.rooms.length} room{' '}
              {venue.rooms.length === 1 ? 'category' : 'categories'}:{' '}
              {venue.rooms.map((r) => r.name).join(', ')}
            </dd>
          </>
        )}

        {SHOW_PUBLIC_STARTING_PRICE && venue.price > 0 && (
          <>
            <dt>Starting price</dt>
            <dd>From {formatInr(venue.price)}</dd>
          </>
        )}

        <dt>Booking options</dt>
        <dd>
          Book the venue online (sign-in required) or send an
          enquiry. The Venue Search team assists with the next
          steps.
        </dd>
      </dl>
    </section>
  );
}

/*
 * Every event space with its description, capacity and tags -- not
 * just the one currently selected in the spaces showcase.
 */
export function AllVenueSpaces({ venue }: { venue: Venue }) {
  const spaces = venue.venueSpaces || [];

  if (spaces.length === 0) return null;

  return (
    <section
      className="vs-sr-only"
      aria-labelledby="venue-spaces-heading"
    >
      <h3 id="venue-spaces-heading">
        Event spaces at {venue.name}
      </h3>

      {spaces.map((space) => (
        <article key={space.id}>
          <h4>{space.name}</h4>

          {formatGuests(space.capacity) && (
            <p>
              Capacity: up to {formatGuests(space.capacity)}
            </p>
          )}

          {space.description && <p>{space.description}</p>}

          {space.tags && space.tags.length > 0 && (
            <ul>
              {space.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </section>
  );
}

function TextList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) return null;

  return (
    <>
      <p>{title}:</p>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  );
}

/*
 * Full room information, mirroring the room details modal.
 */
export function RoomFullDetails({
  room,
}: {
  room: RoomCategory;
}) {
  return (
    <div className="vs-sr-only">
      {room.description && <p>{room.description}</p>}

      {room.view && (
        <p>
          View: {room.view}
          {room.hasBalcony ? ' (with balcony)' : ''}
        </p>
      )}

      {room.floorLocation && (
        <p>Location: {room.floorLocation}</p>
      )}

      <TextList title="Highlights" items={room.features} />

      {room.bathroomDetails && (
        <p>Bathroom: {room.bathroomDetails}</p>
      )}

      <TextList
        title="In-room amenities"
        items={room.amenities}
      />

      <TextList title="Technology" items={room.technology} />

      {room.diningDetails && (
        <p>Dining and refreshments: {room.diningDetails}</p>
      )}

      <TextList title="Services" items={room.services} />

      <TextList
        title="Special inclusions"
        items={room.specialInclusions}
      />
    </div>
  );
}
