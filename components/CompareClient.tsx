'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import type { Venue } from '../lib/data';
import { fetchVenues, fetchVenueBySlug } from '../lib/venues';
import { CompareToggleButton } from './CompareToggleButton';

/* ============================================================
   FORMATTING HELPERS
   ============================================================ */

function formatPrice(value: number | null): string {
  if (!value) return 'On request';

  if (value >= 100000) {
    const lakhs = value / 100000;
    const rounded = Number.isInteger(lakhs) ? lakhs : Math.round(lakhs * 10) / 10;
    return `₹${rounded}L`;
  }

  return `₹${value.toLocaleString('en-IN')}`;
}

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

/**
 * Pulls every amenity/feature-like string a venue exposes -- its
 * own tags, its event spaces' tags, and every room category's
 * amenities/features/technology/services/inclusions -- into one
 * de-duplicated, display-cased list. Nothing here is hardcoded:
 * whatever the venue actually has in Supabase is what shows up.
 */
function collectAmenities(venue: Venue): string[] {
  const pool: string[] = [
    ...venue.tags,
    ...venue.venueSpaces.flatMap((space) => space.tags),
    ...venue.rooms.flatMap((room) => [
      ...room.amenities,
      ...room.features,
      ...room.technology,
      ...room.services,
      ...room.specialInclusions,
    ]),
  ];

  const seen = new Map<string, string>();
  for (const raw of pool) {
    const label = raw.trim();
    if (!label) continue;
    const key = normalizeLabel(label);
    if (!seen.has(key)) seen.set(key, label);
  }

  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
}

/**
 * "Best for" tags -- factual, derived only from real fields
 * (capacity, room count, event space count, venue type). Not a
 * marketing guess: every tag traces back to a specific data point.
 */
function bestForTags(venue: Venue): string[] {
  const tags: string[] = [];

  if (venue.capacity >= 400) tags.push('Large weddings');
  else if (venue.capacity > 0 && venue.capacity <= 150) tags.push('Intimate events');
  else if (venue.capacity > 0) tags.push('Mid-size celebrations');

  if (venue.rooms.length >= 4) tags.push('Accommodation-heavy bookings');
  else if (venue.rooms.length > 0) tags.push('On-site guest stays');

  if (venue.venueSpaces.length >= 3) tags.push('Multi-event weekends');

  if (/resort|palace/i.test(venue.type)) tags.push('Destination weddings');

  return Array.from(new Set(tags));
}

function roomOccupancySummary(venue: Venue): string {
  const values = venue.rooms
    .map((room) => room.maxOccupancy)
    .filter((n): n is number => typeof n === 'number' && n > 0);

  if (values.length === 0) return '—';

  const max = Math.max(...values);
  return `Up to ${max} per room`;
}

function spaceCapacitySummary(venue: Venue): string {
  const values = venue.venueSpaces
    .map((space) => space.capacity)
    .filter((n) => n > 0);

  if (values.length === 0) return '—';
  if (values.length === 1) return `${values[0].toLocaleString('en-IN')} guests`;

  return `${Math.min(...values).toLocaleString('en-IN')}–${Math.max(
    ...values
  ).toLocaleString('en-IN')} guests`;
}

/* ============================================================
   COMPARISON ROW MODEL
   ============================================================ */

type Row = {
  label: string;
  a: string;
  b: string;
  /** Free-text rows (descriptions) skip the diff highlight -- two
   *  venues will always word their story differently; that's not
   *  a meaningful "difference" worth flagging. */
  skipDiff?: boolean;
};

type Category = {
  key: string;
  title: string;
  rows: Row[];
};

function buildCategories(a: Venue, b: Venue): Category[] {
  const row = (label: string, av: string, bv: string, skipDiff = false): Row => ({
    label,
    a: av || '—',
    b: bv || '—',
    skipDiff,
  });

  return [
    {
      key: 'overview',
      title: 'Overview',
      rows: [
        row('Property', a.name, b.name),
        row('Venue type', a.type, b.type),
        row('Rating', a.rating ? `${a.rating} ★` : '—', b.rating ? `${b.rating} ★` : '—'),
        row('Verified', a.verified ? 'Verified' : 'Unverified', b.verified ? 'Verified' : 'Unverified'),
        row('About', a.desc, b.desc, true),
      ],
    },
    {
      key: 'venue-details',
      title: 'Venue Details',
      rows: [
        row(
          'Event spaces',
          a.venueSpaces.length ? String(a.venueSpaces.length) : '—',
          b.venueSpaces.length ? String(b.venueSpaces.length) : '—'
        ),
        row(
          'Space names',
          a.venueSpaces.map((s) => s.name).join(', '),
          b.venueSpaces.map((s) => s.name).join(', '),
          true
        ),
      ],
    },
    {
      key: 'capacity',
      title: 'Capacity',
      rows: [
        row(
          'Guest capacity',
          a.capacity ? `Up to ${a.capacity.toLocaleString('en-IN')} guests` : '—',
          b.capacity ? `Up to ${b.capacity.toLocaleString('en-IN')} guests` : '—'
        ),
        row('Per-space capacity', spaceCapacitySummary(a), spaceCapacitySummary(b)),
      ],
    },
    {
      key: 'pricing',
      title: 'Pricing',
      rows: [
        row('Starting price', formatPrice(a.price), formatPrice(b.price)),
        row('Hold / deposit fee', formatPrice(a.hold), formatPrice(b.hold)),
      ],
    },
    {
      key: 'location',
      title: 'Location',
      rows: [
        row('City', a.city, b.city),
        row('Destination', a.destination, b.destination),
        row('Country', a.country, b.country),
      ],
    },
    {
      key: 'rooms',
      title: 'Rooms',
      rows: [
        row(
          'Room categories',
          a.rooms.length ? String(a.rooms.length) : '—',
          b.rooms.length ? String(b.rooms.length) : '—'
        ),
        row('Max occupancy', roomOccupancySummary(a), roomOccupancySummary(b)),
        row(
          'Balcony rooms available',
          a.rooms.some((r) => r.hasBalcony) ? 'Yes' : a.rooms.length ? 'No' : '—',
          b.rooms.some((r) => r.hasBalcony) ? 'Yes' : b.rooms.length ? 'No' : '—'
        ),
      ],
    },
  ];
}

/* ============================================================
   VENUE PICKER (used for both initial selection and "change")
   ============================================================ */

function VenuePicker({
  venues,
  loading,
  excludeId,
  onSelect,
  label,
}: {
  venues: Venue[];
  loading: boolean;
  excludeId?: string;
  onSelect: (slug: string) => void;
  label: string;
}) {
  const options = venues.filter((v) => v.id !== excludeId);

  return (
    <div className="comparePicker">
      <span className="comparePickerLabel">{label}</span>
      <select
        defaultValue=""
        disabled={loading}
        onChange={(event) => {
          if (event.target.value) onSelect(event.target.value);
        }}
      >
        <option value="" disabled>
          {loading ? 'Loading venues…' : 'Choose a venue to compare'}
        </option>
        {options.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name} — {v.city}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ============================================================
   VENUE HEADER CARD (image, property + venue name, change/remove)
   ============================================================ */

function VenueHeaderCard({
  venue,
  venues,
  onChange,
  onRemove,
}: {
  venue: Venue;
  venues: Venue[];
  onChange: (slug: string) => void;
  onRemove: () => void;
}) {
  const primarySpace = venue.venueSpaces[0];

  return (
    <div className="compareHeaderCard">
      <div className="compareHeaderImage">
        {venue.image ? (
          <img src={venue.image} alt={venue.name} loading="lazy" />
        ) : (
          <div className="compareHeaderImageFallback">The Venue Search</div>
        )}
        {venue.verified && <span className="verified">✓ Verified</span>}
        <button
          type="button"
          className="compareRemoveBtn"
          aria-label={`Remove ${venue.name} from comparison`}
          onClick={onRemove}
        >
          ×
        </button>
      </div>

      <div className="compareHeaderBody">
        <span className="compareHeaderProperty">{venue.name}</span>
        {primarySpace && (
          <span className="compareHeaderVenue">{primarySpace.name}</span>
        )}
        <span className="compareHeaderLocation">
          {venue.city}
          {venue.country && venue.country !== venue.city ? `, ${venue.country}` : ''}
        </span>

        <div className="compareBestFor">
          {bestForTags(venue).map((tag) => (
            <span className="compareBestForTag" key={tag}>
              {tag}
            </span>
          ))}
        </div>

        <div className="compareHeaderActions">
          <select
            value={venue.id}
            onChange={(event) => onChange(event.target.value)}
            aria-label={`Change venue (currently ${venue.name})`}
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — {v.city}
              </option>
            ))}
          </select>

          <CompareToggleButton
            id={venue.id}
            name={venue.name}
            image={venue.image}
            city={venue.city}
            label="Comparing"
            activeLabel="Comparing"
          />
        </div>

        <div className="compareHeaderCtas">
          <Link data-cursor="open" className="primaryBtn" href={`/book?venue=${venue.id}`}>
            Check Availability
          </Link>
          <Link className="outlineBtn" href={`/venues/${venue.id}`}>
            View full profile
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN CLIENT COMPONENT
   ============================================================ */

export function CompareClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const slugA = searchParams.get('a') || '';
  const slugB = searchParams.get('b') || '';

  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [venueA, setVenueA] = useState<Venue | null>(null);
  const [venueB, setVenueB] = useState<Venue | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [errorA, setErrorA] = useState('');
  const [errorB, setErrorB] = useState('');

  // Full venue list, for the "choose / change venue" pickers.
  useEffect(() => {
    let mounted = true;

    fetchVenues()
      .then((venues) => {
        if (mounted) setAllVenues(venues);
      })
      .catch(() => {
        if (mounted) setAllVenues([]);
      })
      .finally(() => {
        if (mounted) setLoadingList(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!slugA) {
      setVenueA(null);
      return;
    }

    setLoadingA(true);
    setErrorA('');

    fetchVenueBySlug(slugA)
      .then((venue) => {
        if (!mounted) return;
        if (!venue) setErrorA('That venue could not be found.');
        setVenueA(venue);
      })
      .catch(() => {
        if (mounted) setErrorA('Unable to load this venue right now.');
      })
      .finally(() => {
        if (mounted) setLoadingA(false);
      });

    return () => {
      mounted = false;
    };
  }, [slugA]);

  useEffect(() => {
    let mounted = true;

    if (!slugB) {
      setVenueB(null);
      return;
    }

    setLoadingB(true);
    setErrorB('');

    fetchVenueBySlug(slugB)
      .then((venue) => {
        if (!mounted) return;
        if (!venue) setErrorB('That venue could not be found.');
        setVenueB(venue);
      })
      .catch(() => {
        if (mounted) setErrorB('Unable to load this venue right now.');
      })
      .finally(() => {
        if (mounted) setLoadingB(false);
      });

    return () => {
      mounted = false;
    };
  }, [slugB]);

  function updateParam(key: 'a' | 'b', value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const categories = useMemo(() => {
    if (!venueA || !venueB) return [];
    return buildCategories(venueA, venueB);
  }, [venueA, venueB]);

  const amenityUnion = useMemo(() => {
    if (!venueA || !venueB) return [];
    const a = new Set(collectAmenities(venueA).map(normalizeLabel));
    const b = new Set(collectAmenities(venueB).map(normalizeLabel));
    const display = new Map<string, string>();
    [...collectAmenities(venueA), ...collectAmenities(venueB)].forEach((label) => {
      display.set(normalizeLabel(label), label);
    });
    return Array.from(display.entries())
      .map(([key, label]) => ({
        label,
        a: a.has(key),
        b: b.has(key),
      }))
      .sort((x, y) => x.label.localeCompare(y.label));
  }, [venueA, venueB]);

  const bothReady = Boolean(venueA && venueB);

  return (
    <main className="page compare-page">
      <div className="centerIntro">
        <span className="kicker">SIDE BY SIDE</span>
        <h1>Compare venues.</h1>
        <p>
          Line up two venues — even from different properties — on capacity, pricing,
          amenities, rooms and location, so the right choice is obvious rather than a
          guess.
        </p>
      </div>

      {/* =========================================================
          HEADER ROW -- two cards or pickers
          ========================================================= */}

      <div className="compareHeadRow">
        {venueA ? (
          <VenueHeaderCard
            venue={venueA}
            venues={allVenues}
            onChange={(slug) => updateParam('a', slug)}
            onRemove={() => updateParam('a', null)}
          />
        ) : (
          <div className="comparePickerCard">
            {errorA && <p className="compareError">{errorA}</p>}
            {loadingA ? (
              <p>Loading…</p>
            ) : (
              <VenuePicker
                venues={allVenues}
                loading={loadingList}
                excludeId={slugB}
                label="Choose the first venue"
                onSelect={(slug) => updateParam('a', slug)}
              />
            )}
          </div>
        )}

        {venueB ? (
          <VenueHeaderCard
            venue={venueB}
            venues={allVenues}
            onChange={(slug) => updateParam('b', slug)}
            onRemove={() => updateParam('b', null)}
          />
        ) : (
          <div className="comparePickerCard">
            {errorB && <p className="compareError">{errorB}</p>}
            {loadingB ? (
              <p>Loading…</p>
            ) : (
              <VenuePicker
                venues={allVenues}
                loading={loadingList}
                excludeId={slugA}
                label="Choose the second venue"
                onSelect={(slug) => updateParam('b', slug)}
              />
            )}
          </div>
        )}
      </div>

      {!bothReady && (
        <p className="compareHint">
          Pick a venue on each side to see the full comparison — or use the ⇄ Compare
          button on any venue card while browsing{' '}
          <Link href="/explore">Explore</Link>.
        </p>
      )}

      {/* =========================================================
          FULL COMPARISON -- desktop table + mobile swipe panels
          ========================================================= */}

      {bothReady && venueA && venueB && (
        <>
          {/* ---------- DESKTOP: 3-column table ---------- */}
          <div className="compareTable">
            {categories.map((category) => (
              <section className="compareCategory" key={category.key}>
                <h2>{category.title}</h2>
                {category.rows.map((r) => (
                  <div
                    className={`compareRow${
                      !r.skipDiff && r.a !== r.b ? ' diffRow' : ''
                    }`}
                    key={r.label}
                  >
                    <span className="compareRowLabel">{r.label}</span>
                    <span className="compareRowValue">{r.a}</span>
                    <span className="compareRowValue">{r.b}</span>
                  </div>
                ))}
              </section>
            ))}

            <section className="compareCategory">
              <h2>Amenities</h2>
              {amenityUnion.length === 0 && (
                <p className="compareEmptyNote">No amenity data available for either venue yet.</p>
              )}
              {amenityUnion.map((item) => (
                <div
                  className={`compareRow amenityRow${item.a !== item.b ? ' diffRow' : ''}`}
                  key={item.label}
                >
                  <span className="compareRowLabel">{item.label}</span>
                  <span className={`amenityMark ${item.a ? 'yes' : 'no'}`}>
                    {item.a ? '✓' : '—'}
                  </span>
                  <span className={`amenityMark ${item.b ? 'yes' : 'no'}`}>
                    {item.b ? '✓' : '—'}
                  </span>
                </div>
              ))}
            </section>

            <section className="compareCategory">
              <h2>Event Suitability</h2>
              <div className="compareRow">
                <span className="compareRowLabel">Best for</span>
                <span className="compareRowValue">
                  <div className="compareBestFor">
                    {bestForTags(venueA).map((tag) => (
                      <span className="compareBestForTag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </span>
                <span className="compareRowValue">
                  <div className="compareBestFor">
                    {bestForTags(venueB).map((tag) => (
                      <span className="compareBestForTag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </span>
              </div>
            </section>
          </div>

          {/* ---------- MOBILE: swipeable side panels ---------- */}
          <div className="compareSwipe">
            {[venueA, venueB].map((venue, index) => (
              <div className="compareSwipePanel" key={venue.id}>
                <h3>{venue.name}</h3>

                {categories.map((category) => (
                  <div className="compareSwipeCategory" key={category.key}>
                    <h4>{category.title}</h4>
                    {category.rows.map((r) => (
                      <div className="compareSwipeRow" key={r.label}>
                        <span>{r.label}</span>
                        <b>{index === 0 ? r.a : r.b}</b>
                      </div>
                    ))}
                  </div>
                ))}

                <div className="compareSwipeCategory">
                  <h4>Amenities</h4>
                  {amenityUnion.map((item) => (
                    <div className="compareSwipeRow" key={item.label}>
                      <span>{item.label}</span>
                      <b className={index === 0 ? (item.a ? 'yes' : 'no') : item.b ? 'yes' : 'no'}>
                        {(index === 0 ? item.a : item.b) ? '✓ Available' : '— Not listed'}
                      </b>
                    </div>
                  ))}
                </div>

                <div className="compareSwipeCategory">
                  <h4>Best for</h4>
                  <div className="compareBestFor">
                    {bestForTags(venue).map((tag) => (
                      <span className="compareBestForTag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
