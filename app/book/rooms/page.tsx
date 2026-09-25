'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { useBookingVenue } from '../../../lib/use-booking-venue';
import { BookingVenueCard } from '../../../components/BookingVenueCard';
import {
  RoomQuantitySelector,
  type RoomSelection,
} from '../../../components/RoomQuantitySelector';
import {
  type BookingDraft,
  type RoomBookingDetails,
  computeNights,
  createEmptyRoomDetails,
  draftHasRequiredEvents,
  formatShortDate,
  loadBookingDraft,
  saveBookingDraft,
} from '../../../lib/booking-draft';

const MAX_ROOMS_PER_CATEGORY = 18;

// Keep date validation in the user's local timezone so the booking date
// does not shift because of UTC conversion (e.g. around midnight in India).
function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTomorrowDateString() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getNextDateString(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const nextDate = new Date(year, month - 1, day);
  nextDate.setDate(nextDate.getDate() + 1);

  return `${nextDate.getFullYear()}-${String(
    nextDate.getMonth() + 1
  ).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
}

function normalizeRoomSelections(
  selections: RoomSelection[]
): RoomSelection[] {
  return selections
    .map((selection) => ({
      ...selection,
      quantity: Math.min(
        Math.max(Number(selection.quantity) || 0, 0),
        MAX_ROOMS_PER_CATEGORY
      ),
    }))
    .filter((selection) => selection.quantity > 0);
}
/* ============================================================
   ROOM BOOKING PAGE (Step 2 of 3: rooms)

   Loads the draft saved by /book from sessionStorage -- if it's
   missing, or this is a venue+room booking whose event details
   aren't done yet, sends the guest back to /book rather than
   showing a room-selection screen with nothing to attach it to.
============================================================ */

function RoomsPageContent() {
  const router = useRouter();

  const {
    venue,
    venueId,
    selectedSpaceId,
    userId,
    loading,
    error: loadError,
  } = useBookingVenue();

  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [draftChecked, setDraftChecked] = useState(false);

  const [roomDetails, setRoomDetails] =
    useState<RoomBookingDetails>(createEmptyRoomDetails());

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const bookingType = draft?.bookingType || 'room';

  const includesVenue =
    bookingType === 'venue' || bookingType === 'venue_room';

  const includesRoom =
    bookingType === 'room' || bookingType === 'venue_room';

  /* ==========================================================
     LOAD + VALIDATE THE DRAFT
  ========================================================== */

  useEffect(() => {
    if (!venue) return;

    const loaded = loadBookingDraft(
      venueId,
      selectedSpaceId || null
    );

    const query = `venue=${venueId}&space=${selectedSpaceId}`;

    if (!loaded) {
      router.replace(`/book?${query}`);
      return;
    }

    if (!draftHasRequiredEvents(loaded)) {
      router.replace(`/book?${query}`);
      return;
    }

    // This page only applies to a room or venue+room booking --
    // if a venue-only draft somehow lands here (e.g. a manually
    // edited URL), there's nothing for it to do here.
    if (
      loaded.bookingType !== 'room' &&
      loaded.bookingType !== 'venue_room'
    ) {
      router.replace(`/book/review?${query}`);
      return;
    }

    setDraft(loaded);

    const today = getTodayDateString();
    const savedCheckIn = loaded.roomDetails.checkInDate;
    const savedCheckOut = loaded.roomDetails.checkOutDate;

    // Do not allow an old saved draft to reintroduce today or a past date.
    const safeCheckIn =
      savedCheckIn && savedCheckIn > today ? savedCheckIn : '';

    const safeCheckOut =
      savedCheckOut &&
      savedCheckOut > today &&
      (!safeCheckIn || savedCheckOut > safeCheckIn)
        ? savedCheckOut
        : '';

    setRoomDetails({
      ...loaded.roomDetails,
      checkInDate: safeCheckIn,
      checkOutDate: safeCheckOut,
      nightlySelections:
        loaded.roomDetails.nightlySelections.map((night) => ({
          ...night,
          selections: normalizeRoomSelections(
            night.selections
          ),
        })),
    });

    setDraftChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venue, venueId, selectedSpaceId]);

  function updateRoomField(
    field: keyof RoomBookingDetails,
    value: string
  ) {
    setRoomDetails((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateNightSelections(
    nightDate: string,
    selections: RoomSelection[]
  ) {
    const normalizedSelections =
      normalizeRoomSelections(selections);

    setRoomDetails((current) => ({
      ...current,
      nightlySelections: current.nightlySelections.map(
        (night) =>
          night.date === nightDate
            ? {
                ...night,
                selections: normalizedSelections,
              }
            : night
      ),
    }));
  }

  /*
   * "Same rooms every night" is the common case for a stay -- this
   * lets the guest set it once instead of repeating the same
   * numbers on every night's card.
   */
  const [sameEveryNight, setSameEveryNight] = useState(false);

  function applySelectionsToAllNights(
    selections: RoomSelection[]
  ) {
    const normalizedSelections =
      normalizeRoomSelections(selections);

    setRoomDetails((current) => ({
      ...current,
      nightlySelections: current.nightlySelections.map(
        (night) => ({
          ...night,
          selections: normalizedSelections,
        })
      ),
    }));
  }

  function toggleSameEveryNight(checked: boolean) {
    setSameEveryNight(checked);

    if (checked) {
      applySelectionsToAllNights(
        roomDetails.nightlySelections[0]?.selections || []
      );
    }
  }

  /* ==========================================================
     KEEP THE PER-NIGHT ROOM ROWS IN SYNC WITH THE DATE RANGE
     Regenerates one row per night whenever check-in/check-out
     changes, carrying over any selections already made for a
     night that's still in range.
  ========================================================== */

  useEffect(() => {
    const nights = computeNights(
      roomDetails.checkInDate,
      roomDetails.checkOutDate
    );

    setRoomDetails((current) => {
      const existingByDate = new Map(
        current.nightlySelections.map((n) => [
          n.date,
          n.selections,
        ])
      );

      const fallbackSelections = sameEveryNight
        ? current.nightlySelections[0]?.selections || []
        : [];

      const nextNightly = nights.map((n) => ({
        date: n.start,
        selections:
          existingByDate.get(n.start) || fallbackSelections,
      }));

      const unchanged =
        nextNightly.length ===
          current.nightlySelections.length &&
        nextNightly.every(
          (n, i) =>
            n.date === current.nightlySelections[i]?.date &&
            n.selections ===
              current.nightlySelections[i]?.selections
        );

      return unchanged
        ? current
        : { ...current, nightlySelections: nextNightly };
    });
  }, [
    roomDetails.checkInDate,
    roomDetails.checkOutDate,
    sameEveryNight,
  ]);

  /* ==========================================================
     CONTINUE
  ========================================================== */

  function handleContinue(event: React.FormEvent) {
    event.preventDefault();

    setError('');

    if (!venue || !draft) {
      setError('The selected venue could not be found.');
      return;
    }

    const today = getTodayDateString();

    if (!roomDetails.checkInDate) {
      setError('Please select a check-in date.');
      return;
    }

    if (roomDetails.checkInDate <= today) {
      setError('Check-in date must be after today.');
      return;
    }

    if (!roomDetails.checkOutDate) {
      setError('Please select a check-out date.');
      return;
    }

    if (roomDetails.checkOutDate <= today) {
      setError('Check-out date must be after today.');
      return;
    }

    if (roomDetails.checkOutDate <= roomDetails.checkInDate) {
      setError('Check-out date must be after the check-in date.');
      return;
    }

    if (
      (venue.rooms?.length || 0) > 0 &&
      roomDetails.nightlySelections.some(
        (night) => night.selections.length === 0
      )
    ) {
      setError(
        'Please select at least one room category for every night of the stay.'
      );
      return;
    }

    const hasExceededRoomLimit =
      roomDetails.nightlySelections.some(
        (night) =>
          night.selections.some(
            (selection) =>
              Number(selection.quantity) >
              MAX_ROOMS_PER_CATEGORY
          )
      );

    if (hasExceededRoomLimit) {
      setError(
        'You can select a maximum of 18 rooms in each room category per night.'
      );
      return;
    }

    setSubmitting(true);

    saveBookingDraft(venueId, selectedSpaceId || null, {
      bookingType: draft.bookingType,
      form: draft.form,
      roomDetails,
    });

    router.push(
      `/book/review?venue=${venueId}&space=${selectedSpaceId}`
    );
  }

  /* ==========================================================
     LOADING STATE
  ========================================================== */

  if (loading || !draftChecked) {
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

  if (!venue || !draft) {
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
    {
      key: 'rooms' as const,
      label: 'Room details',
      small: 'Your stay',
    },
    {
      key: 'review' as const,
      label: 'Review & payment',
      small: 'Confirm and pay',
    },
  ];

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

          <span className="kicker">RESERVE YOUR ROOMS</span>

          <h1>Plan your stay.</h1>

          <p>
            Choose your dates and rooms for each night of the stay.
          </p>
        </div>

        {/* ====================================================
            BOOKING STEPS
        ==================================================== */}

        <div className="bookingSteps">
          {progressSteps.map((progressStep, index) => {
            const status =
              progressStep.key === 'rooms'
                ? 'active'
                : progressStep.key === 'events'
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
              <div className="formSection">

                {includesVenue && (
                  <button
                    type="button"
                    className="backToEventsBtn"
                    onClick={() => {
                      router.push(
                        `/book?venue=${venueId}&space=${selectedSpaceId}`
                      );
                    }}
                  >
                    &larr; Back to event details
                  </button>
                )}

                <span className="kicker">ROOM DETAILS</span>

                <h2>Plan your stay</h2>

                <div className="formGrid">
                      {/* CHECK-IN DATE */}

                      <label>
                        <span>
                          Check-in date *
                        </span>
                        <input
                          type="date"
                          min={getTomorrowDateString()}
                          value={roomDetails.checkInDate}
                          onChange={(e) => {
                            const nextCheckIn = e.target.value;
                            const today = getTodayDateString();

                            if (nextCheckIn <= today) {
                              setError('Check-in date must be after today.');
                              return;
                            }

                            setError('');

                            setRoomDetails((current) => ({
                              ...current,
                              checkInDate: nextCheckIn,
                              // A checkout date must be after the new
                              // check-in date. Clear it if it is no longer valid.
                              checkOutDate:
                                current.checkOutDate &&
                                current.checkOutDate > nextCheckIn
                                  ? current.checkOutDate
                                  : '',
                            }));
                          }}
                        />
                      </label>

                      {/* CHECK-OUT DATE */}

                      <label>
                        <span>
                          Check-out date *
                        </span>
                        <input
                          type="date"
                          min={
                            roomDetails.checkInDate
                              ? getNextDateString(roomDetails.checkInDate)
                              : getTomorrowDateString()
                          }
                          value={roomDetails.checkOutDate}
                          onChange={(e) => {
                            const nextCheckOut = e.target.value;
                            const today = getTodayDateString();
                            const minimumCheckOut =
                              roomDetails.checkInDate
                                ? getNextDateString(roomDetails.checkInDate)
                                : getTomorrowDateString();

                            if (nextCheckOut < minimumCheckOut) {
                              setError(
                                roomDetails.checkInDate
                                  ? 'Check-out date must be after the check-in date.'
                                  : 'Check-out date must be after today.'
                              );
                              return;
                            }

                            setError('');
                            updateRoomField(
                              'checkOutDate',
                              nextCheckOut
                            );
                          }}
                        />
                      </label>

                    </div>

                    {/* ROOM CATEGORY SELECTION, PER NIGHT */}

                    {(venue?.rooms?.length || 0) > 0 &&
                      roomDetails.nightlySelections.length > 0 && (
                        <div style={{ marginTop: '18px' }}>
                          <div className="nightlyRoomsHeader">
                            <span>
                              {roomDetails.nightlySelections.length}{' '}
                              night
                              {roomDetails.nightlySelections
                                .length === 1
                                ? ''
                                : 's'}{' '}
                              of the stay
                            </span>

                            {roomDetails.nightlySelections.length >
                              1 && (
                              <label className="nightlySameToggle">
                                <input
                                  type="checkbox"
                                  checked={sameEveryNight}
                                  onChange={(e) =>
                                    toggleSameEveryNight(
                                      e.target.checked
                                    )
                                  }
                                />
                                Same rooms every night
                              </label>
                            )}
                          </div>

                          {sameEveryNight &&
                          roomDetails.nightlySelections.length >
                            1 ? (
                            <RoomQuantitySelector
                              rooms={venue?.rooms || []}
                              selections={
                                roomDetails.nightlySelections[0]
                                  ?.selections || []
                              }
                              onChange={
                                applySelectionsToAllNights
                              }
                            />
                          ) : (
                            <div className="nightlyRoomsList">
                              {computeNights(
                                roomDetails.checkInDate,
                                roomDetails.checkOutDate
                              ).map((night, index) => {
                                const nightSelection =
                                  roomDetails.nightlySelections[
                                    index
                                  ];

                                if (!nightSelection) return null;

                                return (
                                  <div
                                    className="nightlyRoomsNight"
                                    key={night.start}
                                  >
                                    <div className="nightlyRoomsNightHead">
                                      <h4>
                                        {formatShortDate(
                                          night.start
                                        )}{' '}
                                        &rarr;{' '}
                                        {formatShortDate(
                                          night.end
                                        )}
                                      </h4>

                                      {index === 0 &&
                                        roomDetails
                                          .nightlySelections
                                          .length > 1 &&
                                        nightSelection.selections
                                          .length > 0 && (
                                          <button
                                            type="button"
                                            className="nightlyCopyBtn"
                                            onClick={() =>
                                              applySelectionsToAllNights(
                                                nightSelection.selections
                                              )
                                            }
                                          >
                                            Copy to every night
                                          </button>
                                        )}
                                    </div>

                                    <RoomQuantitySelector
                                      rooms={venue?.rooms || []}
                                      selections={
                                        nightSelection.selections
                                      }
                                      onChange={(selections) =>
                                        updateNightSelections(
                                          nightSelection.date,
                                          selections
                                        )
                                      }
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                    {/* GUEST DETAILS */}

                    <label className="fullWidthField">
                      <span>
                        Guest details (optional)
                      </span>
                      <textarea
                        value={
                          roomDetails.guestDetails
                        }
                        onChange={(e) =>
                          updateRoomField(
                            'guestDetails',
                            e.target.value
                          )
                        }
                        placeholder="Names, ages, or any specific guest arrangements..."
                        rows={3}
                      />
                    </label>

                    {/* ADDITIONAL REQUIREMENTS */}

                    <label className="fullWidthField">
                      <span>
                        Additional requirements (optional)
                      </span>
                      <textarea
                        value={
                          roomDetails.notes
                        }
                        onChange={(e) =>
                          updateRoomField(
                            'notes',
                            e.target.value
                          )
                        }
                        placeholder="Early check-in, connecting rooms, accessibility needs..."
                        rows={3}
                      />
                    </label>

              </div>

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
                  Review Booking →
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function RoomsPage() {
  return (
    <Suspense fallback={null}>
      <RoomsPageContent />
    </Suspense>
  );
}
