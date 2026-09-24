'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useState } from 'react';

import { useBookingVenue } from '../../lib/use-booking-venue';
import { BookingVenueCard } from '../../components/BookingVenueCard';
import {
  type BookingForm,
  type BookingType,
  type EventDetails,
  type RoomBookingDetails,
  createEmptyEvent,
  createEmptyRoomDetails,
  initialBookingForm,
  loadBookingDraft,
  saveBookingDraft,
} from '../../lib/booking-draft';

/* ============================================================
   BOOKING PAGE CONTENT (Step 1 of 3: event details)

   This is the entry point of the booking flow: pick what you're
   booking, give your contact details, and -- for a venue booking
   -- plan each event. Continuing here either goes straight to
   /book/review (venue-only) or to /book/rooms (room or venue+room),
   which is a separate route so the room-selection experience gets
   its own dedicated screen rather than being buried further down
   the same long form.
============================================================ */

function BookPageContent() {
  const router = useRouter();

  const {
    venue,
    venueId,
    selectedSpaceId,
    userEmail,
    loading,
    error: loadError,
  } = useBookingVenue();

  const [form, setForm] = useState<BookingForm>(initialBookingForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [bookingType, setBookingType] =
    useState<BookingType>('venue');

  /*
   * Room selections aren't edited on this page, but if the guest
   * comes back here (e.g. via "Back to event details" from
   * /book/rooms) to tweak something, whatever they'd already
   * chosen for rooms needs to survive the round trip rather than
   * being wiped when this page re-saves the draft.
   */
  const [roomDetails, setRoomDetails] =
    useState<RoomBookingDetails>(createEmptyRoomDetails());

  const includesVenue =
    bookingType === 'venue' || bookingType === 'venue_room';

  const includesRoom =
    bookingType === 'room' || bookingType === 'venue_room';

  /* ==========================================================
     HYDRATE FROM ANY EXISTING DRAFT (or pre-fill email)
  ========================================================== */

  useEffect(() => {
    if (!venue) return;

    const draft = loadBookingDraft(
      venueId,
      selectedSpaceId || null
    );

    if (draft) {
      setBookingType(draft.bookingType);
      setForm(
        draft.form.email
          ? draft.form
          : { ...draft.form, email: userEmail || draft.form.email }
      );
      setRoomDetails(draft.roomDetails);
    } else if (userEmail) {
      setForm((current) => ({ ...current, email: userEmail }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venue, userEmail]);

  /* ==========================================================
     UPDATE CUSTOMER FIELD
  ========================================================== */

  function updateField(
    field: 'fullName' | 'email' | 'mobile',
    value: string
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  }

  /* ==========================================================
     NUMBER OF EVENTS
  ========================================================== */

  function handleEventCountChange(value: string) {
    const count = Number(value);

    if (!count) {
      setForm((current) => ({
        ...current,
        numberOfEvents: '',
        events: [],
      }));

      setError('');
      return;
    }

    setForm((current) => ({
      ...current,
      numberOfEvents: value,

      events: Array.from({ length: count }, (_, index) => {
        if (current.events[index]) {
          return current.events[index];
        }

        const newEvent = createEmptyEvent();

        if (
          index === 0 &&
          selectedSpaceId &&
          venue?.venueSpaces?.some(
            (space) => space.id === selectedSpaceId
          )
        ) {
          newEvent.venueSpace = selectedSpaceId;
        }

        return newEvent;
      }),
    }));

    setError('');
  }

  /* ==========================================================
     UPDATE EVENT FIELD
  ========================================================== */

  function updateEventField(
    index: number,
    field: keyof EventDetails,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      events: current.events.map((event, eventIndex) =>
        eventIndex === index ? { ...event, [field]: value } : event
      ),
    }));

    setError('');
  }

  /* ==========================================================
     CONTINUE
  ========================================================== */

  function handleContinue(event: FormEvent) {
    event.preventDefault();

    setError('');

    if (!venue) {
      setError('The selected venue could not be found.');
      return;
    }

    if (!form.fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!form.email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!form.mobile.trim()) {
      setError('Please enter your mobile number.');
      return;
    }

    if (includesVenue) {
      if (!form.numberOfEvents) {
        setError('Please select the number of events.');
        return;
      }

      if (form.events.length !== Number(form.numberOfEvents)) {
        setError('Please select the number of events again.');
        return;
      }

      for (
        let index = 0;
        index < form.events.length;
        index++
      ) {
        const currentEvent = form.events[index];

        if (!currentEvent.eventType) {
          setError(
            `Please select the event type for Event ${index + 1}.`
          );
          return;
        }

        if (!currentEvent.eventDate) {
          setError(
            `Please select the date for Event ${index + 1}.`
          );
          return;
        }

        if (
          !currentEvent.guestCount ||
          !/^\d+$/.test(currentEvent.guestCount) ||
          Number(currentEvent.guestCount) < 1
        ) {
          setError(
            `Please enter a valid number of guests for Event ${index + 1}.`
          );
          return;
        }

        if (!currentEvent.venueSpace) {
          setError(
            `Please select the venue space for Event ${index + 1}.`
          );
          return;
        }

        if (!currentEvent.mealTiming) {
          setError(
            `Please select the meal timing for Event ${index + 1}.`
          );
          return;
        }

        if (!currentEvent.mealCategory) {
          setError(
            `Please select the meal category for Event ${index + 1}.`
          );
          return;
        }
      }
    }

    setSubmitting(true);

    saveBookingDraft(venueId, selectedSpaceId || null, {
      bookingType,
      form,
      roomDetails,
    });

    const query = `venue=${venueId}&space=${selectedSpaceId}`;

    if (includesRoom) {
      router.push(`/book/rooms?${query}`);
    } else {
      router.push(`/book/review?${query}`);
    }
  }

  /* ==========================================================
     LOADING STATE
  ========================================================== */

  if (loading) {
    return (
      <main className="page">
        <section
          className="section"
          style={{
            minHeight: '70vh',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <p>Loading booking...</p>
        </section>
      </main>
    );
  }

  /* ==========================================================
     VENUE NOT FOUND
  ========================================================== */

  if (!venue) {
    return (
      <main className="page">
        <section className="section">
          <div className="emptyState">
            <span className="kicker">VENUE NOT FOUND</span>

            <h1>We couldn't find this venue.</h1>

            <p>
              Please return to the venue collection and select a
              venue again.
            </p>

            <Link href="/explore" className="primaryBtn">
              Explore venues →
            </Link>
          </div>
        </section>
      </main>
    );
  }

  /* ==========================================================
     PAGE
  ========================================================== */

  const progressSteps: {
    key: 'events' | 'rooms' | 'review';
    label: string;
    small: string;
  }[] = [
    ...(includesVenue
      ? [
          {
            key: 'events' as const,
            label: 'Event details',
            small: 'Your celebration',
          },
        ]
      : []),
    ...(includesRoom
      ? [
          {
            key: 'rooms' as const,
            label: 'Room details',
            small: 'Your stay',
          },
        ]
      : []),
    {
      key: 'review' as const,
      label: 'Review & payment',
      small: 'Confirm and pay',
    },
  ];

  const currentProgressKey: 'events' | 'rooms' | 'review' =
    includesVenue ? 'events' : 'rooms';

  return (
    <main className="page">
      <section className="section bookPage">
        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="bookHeader">
          <Link href={`/venues/${venue.id}`} className="backLink">
            ← Back to venue
          </Link>

          <span className="kicker">BOOK THIS VENUE</span>

          <h1>Start your booking.</h1>

          <p>
            Tell us about your celebration, then continue to room
            booking.
          </p>
        </div>

        {/* ====================================================
            BOOKING STEPS
        ==================================================== */}

        <div className="bookingSteps">
          {progressSteps.map((progressStep, index) => {
            const stepIndex = progressSteps.findIndex(
              (s) => s.key === currentProgressKey
            );

            const status =
              index === stepIndex
                ? 'active'
                : index < stepIndex
                  ? 'complete'
                  : '';

            return (
              <div
                className={`bookingStep ${status}`.trim()}
                key={progressStep.key}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>

                <div>
                  <strong>{progressStep.label}</strong>
                  <small>{progressStep.small}</small>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bookingLayout">
          {/* ==================================================
              VENUE CARD
          ================================================== */}

          <BookingVenueCard venue={venue} />

          {/* ==================================================
              FORM
          ================================================== */}

          <div className="bookingFormCard">
            <form onSubmit={handleContinue}>

                {/* =================================================
                    BOOKING TYPE
                ================================================= */}

                <div className="formSection">

                  <span className="kicker">
                    WHAT ARE YOU BOOKING?
                  </span>

                  <h2>
                    Choose what you need
                  </h2>

                  <div className="bookingTypeRow">

                    {(
                      [
                        {
                          value: 'venue' as const,
                          label: 'Venue Only',
                          desc: 'Book the venue for your event.',
                        },
                        {
                          value: 'room' as const,
                          label: 'Rooms Only',
                          desc: 'Reserve guest rooms for your stay.',
                        },
                        {
                          value: 'venue_room' as const,
                          label: 'Venue + Rooms',
                          desc: 'Book the venue and accommodation together.',
                        },
                      ]
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={
                          bookingType ===
                          option.value
                            ? 'bookingTypeCard active'
                            : 'bookingTypeCard'
                        }
                        onClick={() =>
                          setBookingType(
                            option.value
                          )
                        }
                      >
                        <strong>
                          {option.label}
                        </strong>
                        <span>
                          {option.desc}
                        </span>
                      </button>
                    ))}

                  </div>

                </div>

                {/* =================================================
                    CUSTOMER DETAILS
                ================================================= */}

                <div className="formSection">

                  <span className="kicker">
                    YOUR DETAILS
                  </span>

                  <h2>
                    Tell us who's booking
                  </h2>

                  <div className="formGrid">

                    {/* FULL NAME */}

                    <label>

                      <span>
                        Legal Name *
                      </span>

                      <input
                        type="text"
                        value={
                          form.fullName
                        }
                        onChange={(e) =>
                          updateField(
                            'fullName',
                            e.target.value
                          )
                        }
                        placeholder="Your full name"
                        autoComplete="name"
                      />

                    </label>

                    {/* EMAIL */}

                    <label>

                      <span>
                        Email address *
                      </span>

                      <input
                        type="email"
                        value={
                          form.email
                        }
                        onChange={(e) =>
                          updateField(
                            'email',
                            e.target.value
                          )
                        }
                        placeholder="you@example.com"
                        autoComplete="email"
                      />

                    </label>

                    {/* MOBILE */}

                    <label>

                      <span>
                        Mobile number *
                      </span>

                      <input
                        type="tel"
                        value={
                          form.mobile
                        }
                        onChange={(e) =>
                          updateField(
                            'mobile',
                            e.target.value
                          )
                        }
                        placeholder="+91 98765 43210"
                        autoComplete="tel"
                      />

                    </label>

                  </div>

                </div>

                {/* =================================================
                    EVENT DETAILS (venue booking)
                ================================================= */}

                {(bookingType === 'venue' ||
                  bookingType === 'venue_room') && (

                <div className="formSection">

                  <span className="kicker">
                    EVENT DETAILS
                  </span>

                  <h2>
                    Plan your celebration
                  </h2>

                  {/* =================================================
                      NUMBER OF EVENTS
                  ================================================= */}

                  <div className="formGrid">

                    <label>

                      <span>
                        Number of events *
                      </span>

                      <select
                        value={
                          form.numberOfEvents
                        }
                        onChange={(e) =>
                          handleEventCountChange(
                            e.target.value
                          )
                        }
                      >

                        <option value="">
                          Select number of events
                        </option>

                        <option value="1">
                          1 Event
                        </option>

                        <option value="2">
                          2 Events
                        </option>

                        <option value="3">
                          3 Events
                        </option>

                        <option value="4">
                          4 Events
                        </option>

                        <option value="5">
                          5 Events
                        </option>

                        <option value="6">
                          6 Events
                        </option>

                      </select>

                    </label>

                  </div>

                  {/* =================================================
                      DYNAMIC EVENTS
                  ================================================= */}

                  {form.events.map(
                    (
                      currentEvent,
                      index
                    ) => (

                      <div
                        key={index}
                        className="formSection"
                        style={{
                          marginTop:
                            '28px',
                          paddingTop:
                            '28px',
                          borderTop:
                            '1px solid rgba(0,0,0,0.08)',
                        }}
                      >

                        <span className="kicker">
                          EVENT {index + 1}
                        </span>

                        <h3
                          style={{
                            marginTop:
                              '8px',
                            marginBottom:
                              '20px',
                          }}
                        >
                          Tell us about Event{' '}
                          {index + 1}
                        </h3>

                        <div className="formGrid">

                          {/* =================================================
                              EVENT TYPE
                          ================================================= */}

                          <label>

                            <span>
                              Event type *
                            </span>

                            <select
                              value={
                                currentEvent.eventType
                              }
                              onChange={(e) =>
                                updateEventField(
                                  index,
                                  'eventType',
                                  e.target.value
                                )
                              }
                            >

                              <option value="">
                                Select event type
                              </option>

                              <option value="Pre-Wedding Ritual">
                                Pre-Wedding Ritual
                              </option>

                              <option value="Arrival Meal">
                                Arrival Meal
                              </option>

                              <option value="Haldi">
                                Haldi
                              </option>

                              <option value="Sangeeth">
                                Sangeeth
                              </option>

                              <option value="Mehendi">
                                Mehendi
                              </option>

                              <option value="Wedding">
                                Wedding
                              </option>

                              <option value="Others">
                                Others
                              </option>

                            </select>

                          </label>

                          {/* =================================================
                              EVENT DATE
                          ================================================= */}

                          <label>

                            <span>
                              Event date *
                            </span>

                            <input
                              type="date"
                              value={
                                currentEvent.eventDate
                              }
                              min={
                                new Date()
                                  .toISOString()
                                  .split(
                                    'T'
                                  )[0]
                              }
                              onChange={(e) =>
                                updateEventField(
                                  index,
                                  'eventDate',
                                  e.target.value
                                )
                              }
                            />

                          </label>

                          {/* =================================================
                              GUEST COUNT
                          ================================================= */}

                          <label>

                            <span>
                              Number of Guests *
                            </span>

                            <input
                              type="number"
                              inputMode="numeric"
                              min={1}
                              step={1}
                              placeholder="Enter number"
                              value={
                                currentEvent.guestCount
                              }
                              onChange={(e) => {
                                const raw = e.target.value;

                                // Allow clearing the field, and
                                // reject anything that isn't a
                                // positive whole number.
                                if (
                                  raw === '' ||
                                  /^\d+$/.test(raw)
                                ) {
                                  updateEventField(
                                    index,
                                    'guestCount',
                                    raw
                                  );

                                  // The venue space this event has
                                  // selected may no longer fit --
                                  // clear it so the guest re-picks
                                  // from the filtered list rather
                                  // than silently keeping a space
                                  // that's now too small.
                                  const guests =
                                    Number(raw);

                                  const stillFits =
                                    venue?.venueSpaces?.some(
                                      (space) =>
                                        space.id ===
                                          currentEvent.venueSpace &&
                                        (!space.capacity ||
                                          space.capacity >=
                                            guests)
                                    );

                                  if (
                                    currentEvent.venueSpace &&
                                    !stillFits
                                  ) {
                                    updateEventField(
                                      index,
                                      'venueSpace',
                                      ''
                                    );
                                  }
                                }
                              }}
                              onKeyDown={(e) => {
                                if (
                                  ['-', '+', 'e', 'E', '.'].includes(
                                    e.key
                                  )
                                ) {
                                  e.preventDefault();
                                }
                              }}
                            />

                          </label>

                          {/* =================================================
                              VENUE SPACE
                              Filtered to spaces that can seat the
                              guest count already entered above --
                              only falls back to the full list
                              before a guest count is entered, or
                              if nothing on the venue fits it.
                          ================================================= */}

                          <label>

                            <span>
                              Venue space *
                            </span>

                            <select
                              value={
                                currentEvent.venueSpace
                              }
                              onChange={(e) =>
                                updateEventField(
                                  index,
                                  'venueSpace',
                                  e.target.value
                                )
                              }
                            >

                              <option value="">
                                {currentEvent.guestCount &&
                                (venue.venueSpaces || []).some(
                                  (space) =>
                                    space.capacity &&
                                    space.capacity >=
                                      Number(
                                        currentEvent.guestCount
                                      )
                                )
                                  ? 'Select a space that fits your guest count'
                                  : 'Select venue space'}
                              </option>

                              {(venue.venueSpaces || [])
                                .filter((space) => {
                                  if (!currentEvent.guestCount)
                                    return true;

                                  const fitsAny = (
                                    venue.venueSpaces || []
                                  ).some(
                                    (s) =>
                                      s.capacity &&
                                      s.capacity >=
                                        Number(
                                          currentEvent.guestCount
                                        )
                                  );

                                  // If nothing on the venue can
                                  // actually seat this many guests,
                                  // show every space rather than an
                                  // empty dropdown -- the guest can
                                  // still pick and discuss with the
                                  // venue directly.
                                  if (!fitsAny) return true;

                                  return (
                                    !space.capacity ||
                                    space.capacity >=
                                      Number(
                                        currentEvent.guestCount
                                      )
                                  );
                                })
                                .map((space) => (
                                  <option
                                    key={space.id}
                                    value={space.id}
                                  >
                                    {space.name}
                                    {space.capacity
                                      ? ` (up to ${space.capacity} guests)`
                                      : ''}
                                  </option>
                                ))}

                            </select>

                          </label>

                          {/* =================================================
                              MEAL
                          ================================================= */}

                          <label>

                            <span>
                              Meal Timing*
                            </span>

                            <select
                              value={
                                currentEvent.mealTiming
                              }
                              onChange={(e) =>
                                updateEventField(
                                  index,
                                  'mealTiming',
                                  e.target.value
                                )
                              }
                            >

                              <option value="">
                                Select meal
                              </option>

                              <option value="Breakfast">
                                Breakfast
                              </option>

                              <option value="Lunch">
                                Lunch
                              </option>

                              <option value="HiTea">
                                HiTea
                              </option>

                              <option value="Dinner">
                                Dinner
                              </option>

                            </select>

                          </label>

                          {/* =================================================
                              TYPE OF MEAL
                          ================================================= */}

                          <label>

                            <span>
                              Meal Category *
                            </span>

                            <select
                              value={
                                currentEvent.mealCategory
                              }
                              onChange={(e) =>
                                updateEventField(
                                  index,
                                  'mealCategory',
                                  e.target.value
                                )
                              }
                            >

                              <option value="">
                                Select Meal Category
                              </option>

                              <option value="Basic">
                                Basic
                              </option>

                              <option value="Premium">
                                Premium
                              </option>

                              <option value="Luxury">
                                Luxury
                              </option>

                            </select>

                          </label>

                        </div>

                        {/* =================================================
                            NOTES
                        ================================================= */}

                        <label
                          className="fullWidthField"
                          style={{
                            marginTop:
                              '20px',
                          }}
                        >

                          <span>
                            Special Notes{' '}
                            <small>
                              Optional
                            </small>
                          </span>

                          <textarea
                            value={
                              currentEvent.notes
                            }
                            onChange={(e) =>
                              updateEventField(
                                index,
                                'notes',
                                e.target.value
                              )
                            }
                            placeholder={`Tell us anything important about Event ${index + 1}...`}
                            rows={4}
                          />

                        </label>

                      </div>

                    )
                  )}

                </div>

                )}


              {error && (
                <div className="bookingError">{error}</div>
              )}

              {loadError && (
                <div className="bookingError">{loadError}</div>
              )}

              <div className="bookingActionRow">
                <button
                  type="submit"
                  className="primaryBtn large"
                  disabled={submitting}
                >
                  {includesRoom
                    ? 'Continue to Room Booking →'
                    : 'Review Booking →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={null}>
      <BookPageContent />
    </Suspense>
  );
}
