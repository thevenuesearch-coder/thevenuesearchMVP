'use client';

import { useEffect, useMemo, useState } from 'react';

type AdminEnquiry = {
  id: string;
  booking_type: 'venue' | 'room' | 'venue_room';
  full_name: string | null;
  email: string | null;
  mobile: string | null;
  event_date: string | null;
  event_type: string | null;
  guest_count: number | null;
  budget: string | null;
  checkin_date: string | null;
  checkout_date: string | null;
  num_rooms: number | null;
  nightly_room_selections:
    | {
        date: string;
        selections: {
          roomId: string;
          roomName: string;
          quantity: number;
        }[];
      }[]
    | null;
  guest_details: string | null;
  message: string | null;
  status: string | null;
  created_at: string;
  venues: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type FilterType = 'all' | 'venue' | 'room' | 'venue_room';

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All Enquiries' },
  { value: 'venue', label: 'Venue' },
  { value: 'room', label: 'Rooms' },
  { value: 'venue_room', label: 'Venue + Rooms' },
];

function bookingTypeLabel(type: AdminEnquiry['booking_type']) {
  if (type === 'room') return 'Rooms Only';
  if (type === 'venue_room') return 'Venue + Rooms';
  return 'Venue';
}

function bookingTypeColor(type: AdminEnquiry['booking_type']) {
  if (type === 'room') return '#8e6bea';
  if (type === 'venue_room') return '#28b9d3';
  return '#2854b8';
}

function formatDate(value: string | null) {
  if (!value) return null;
  /* A plain 'yyyy-mm-dd' string parses as UTC midnight per the
     ES spec, not local midnight -- appending a time forces local
     parsing so the displayed day can't drift a day off in
     timezones behind UTC. */
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminPage() {
  const [enquiries, setEnquiries] = useState<AdminEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    let mounted = true;

    fetch('/api/admin/enquiries')
      .then(async (response) => {
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || 'Unable to load enquiries.'
          );
        }

        if (mounted) setEnquiries(result.data || []);
      })
      .catch((err) => {
        console.error('Admin enquiries load error:', err);
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load enquiries.'
          );
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const counts = useMemo(() => {
    return {
      all: enquiries.length,
      venue: enquiries.filter(
        (e) => e.booking_type === 'venue'
      ).length,
      room: enquiries.filter(
        (e) => e.booking_type === 'room'
      ).length,
      venue_room: enquiries.filter(
        (e) => e.booking_type === 'venue_room'
      ).length,
    };
  }, [enquiries]);

  const filtered = useMemo(() => {
    if (filter === 'all') return enquiries;
    return enquiries.filter(
      (e) => e.booking_type === filter
    );
  }, [enquiries, filter]);

  return (
    <main className="dashboard">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="side">

        <img src="/logo.png" alt="The Venue Search" />

        <b>Admin Console</b>

        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={
              filter === item.value ? 'active' : ''
            }
            onClick={() => setFilter(item.value)}
          >
            {item.label}
            {' '}
            ({counts[item.value]})
          </button>
        ))}

      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <section className="dashMain">

        <div className="dashHead">
          <div>
            <span className="kicker">
              ADMIN CONSOLE
            </span>
            <h1>
              {
                FILTERS.find(
                  (f) => f.value === filter
                )?.label
              }
            </h1>
          </div>
        </div>

        {error && (
          <div className="plannerError">{error}</div>
        )}

        <div className="dashCards">
          <div>
            <span>Total enquiries</span>
            <strong>{counts.all}</strong>
          </div>
          <div>
            <span>Venue only</span>
            <strong>{counts.venue}</strong>
          </div>
          <div>
            <span>Rooms only</span>
            <strong>{counts.room}</strong>
          </div>
          <div>
            <span>Venue + Rooms</span>
            <strong>{counts.venue_room}</strong>
          </div>
        </div>

        <div className="tableCard">

          <div className="plannerSectionHeader">
            <div>
              <h3>Submitted Enquiries</h3>
              <p>
                Every enquiry submitted through the
                venue page, the enquiry form, and the
                booking flow.
              </p>
            </div>
            <span>
              {filtered.length}{' '}
              {filtered.length === 1
                ? 'enquiry'
                : 'enquiries'}
            </span>
          </div>

          {loading ? (
            <div className="plannerEmpty">
              <h3>Loading enquiries…</h3>
            </div>
          ) : filtered.length === 0 ? (
            <div className="plannerEmpty">
              <h3>No enquiries yet</h3>
              <p>
                {filter === 'all'
                  ? 'Submitted enquiries will appear here.'
                  : 'No enquiries of this type yet.'}
              </p>
            </div>
          ) : (
            filtered.map((enquiry) => (
              <div
                className="adminEnquiryCard"
                key={enquiry.id}
              >

                <div className="adminEnquiryHead">
                  <span
                    className="adminBadge"
                    style={{
                      background: bookingTypeColor(
                        enquiry.booking_type
                      ),
                    }}
                  >
                    {bookingTypeLabel(
                      enquiry.booking_type
                    )}
                  </span>

                  <span className="adminEnquiryDate">
                    {formatDate(enquiry.created_at) ||
                      '—'}
                  </span>
                </div>

                <div className="adminEnquiryBody">

                  <div className="adminEnquiryCol">
                    <b>{enquiry.full_name || '—'}</b>
                    <small>{enquiry.email || '—'}</small>
                    <small>{enquiry.mobile || '—'}</small>
                    <small>
                      Venue:{' '}
                      {enquiry.venues?.name || '—'}
                    </small>
                  </div>

                  {(enquiry.booking_type === 'venue' ||
                    enquiry.booking_type ===
                      'venue_room') && (
                    <div className="adminEnquiryCol">
                      <span className="adminColLabel">
                        VENUE DETAILS
                      </span>
                      <small>
                        Date:{' '}
                        {formatDate(
                          enquiry.event_date
                        ) || 'Not specified'}
                      </small>
                      <small>
                        Type:{' '}
                        {enquiry.event_type ||
                          'Not specified'}
                      </small>
                      <small>
                        Guests:{' '}
                        {enquiry.guest_count ??
                          'Not specified'}
                      </small>
                      {enquiry.budget && (
                        <small>
                          Budget: {enquiry.budget}
                        </small>
                      )}
                    </div>
                  )}

                  {(enquiry.booking_type === 'room' ||
                    enquiry.booking_type ===
                      'venue_room') && (
                    <div className="adminEnquiryCol">
                      <span className="adminColLabel">
                        ROOM DETAILS
                      </span>
                      <small>
                        Check-in:{' '}
                        {formatDate(
                          enquiry.checkin_date
                        ) || 'Not specified'}
                      </small>
                      <small>
                        Check-out:{' '}
                        {formatDate(
                          enquiry.checkout_date
                        ) || 'Not specified'}
                      </small>
                      <small>
                        Peak rooms:{' '}
                        {enquiry.num_rooms ??
                          'Not specified'}
                      </small>
                      {enquiry.nightly_room_selections &&
                        enquiry.nightly_room_selections.some(
                          (n) => n.selections.length > 0
                        ) && (
                          <small>
                            By night:
                            <br />
                            {enquiry.nightly_room_selections
                              .filter(
                                (n) => n.selections.length > 0
                              )
                              .map((n) => (
                                <span key={n.date}>
                                  {formatDate(n.date)}:{' '}
                                  {n.selections
                                    .map(
                                      (s) =>
                                        `${s.roomName} × ${s.quantity}`
                                    )
                                    .join(', ')}
                                  <br />
                                </span>
                              ))}
                          </small>
                        )}
                      {enquiry.guest_details && (
                        <small>
                          Guest details:{' '}
                          {enquiry.guest_details}
                        </small>
                      )}
                    </div>
                  )}

                </div>

                {enquiry.message && (
                  <p className="adminEnquiryNotes">
                    "{enquiry.message}"
                  </p>
                )}

                <div className="adminEnquiryFoot">
                  <span>
                    Status: {enquiry.status || 'new'}
                  </span>
                  <a
                    href={`mailto:${enquiry.email}`}
                  >
                    Reply by email →
                  </a>
                </div>

              </div>
            ))
          )}

        </div>

      </section>

    </main>
  );
}
