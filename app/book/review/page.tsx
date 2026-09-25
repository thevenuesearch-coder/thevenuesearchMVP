'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { useBookingVenue } from '../../../lib/use-booking-venue';
import { BookingVenueCard } from '../../../components/BookingVenueCard';
import {
  type BookingDraft,
  BOOKING_FEE_INR,
  clearBookingDraft,
  computeNights,
  draftHasRequiredEvents,
  draftHasRequiredRooms,
  formatDate,
  formatShortDate,
  loadBookingDraft,
} from '../../../lib/booking-draft';

/* ============================================================
   RAZORPAY TYPES
============================================================ */

declare global {
  interface Window {
    Razorpay: new (
      options: RazorpayOptions
    ) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler?: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/* ============================================================
   REVIEW & PAYMENT PAGE (Step 3 of 3)

   Loads the draft saved by /book (and /book/rooms, if the booking
   included rooms) from sessionStorage. If the draft is missing or
   incomplete for what this booking type needs, sends the guest
   back to finish that step rather than showing a broken review.
============================================================ */

function ReviewPageContent() {
  const router = useRouter();

  const {
    venue,
    venueId,
    selectedSpaceId,
    mode,
    userId,
    loading,
    error: loadError,
  } = useBookingVenue();

  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [draftChecked, setDraftChecked] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [documentRequestSubmitting, setDocumentRequestSubmitting] =
    useState(false);
  const [documentRequestSuccess, setDocumentRequestSuccess] =
    useState(false);

  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [bookingReference, setBookingReference] = useState('');

  const bookingType = draft?.bookingType || 'venue';

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

    if (!draftHasRequiredRooms(loaded)) {
      router.replace(`/book/rooms?${query}`);
      return;
    }

    setDraft(loaded);
    setDraftChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venue, venueId, selectedSpaceId]);

  /* ==========================================================
     SEND BOOKING DATA
  ========================================================== */

  async function sendBookingEmail(
    stage:
      | 'review'
      | 'payment'
  ) {
    if (!venue || !draft) {
      throw new Error(
        'The selected venue could not be found.'
      );
    }

    const form = draft.form;

    const response =
      await fetch(
        '/api/booking-payment',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            venueName:
              venue.name,

            venueId,

            mode,

            fullName:
              form.fullName,

            email:
              form.email,

            mobile:
              form.mobile,

            numberOfEvents:
              form.numberOfEvents,

            events:
              form.events,

            bookingFee:
              BOOKING_FEE_INR,

            stage,
          }),
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
          'Unable to send booking details.'
      );
    }

    return result;
  }

  /* ==========================================================
     REQUEST VENUE BOOKING DOCUMENT
  ========================================================== */

  async function handleDocumentRequest() {
    if (!userId || !venue || !draft) {
      setError(
        'Your session or venue information is unavailable.'
      );
      return;
    }

    const form = draft.form;

    setDocumentRequestSubmitting(true);
    setError('');

    try {
      const response = await fetch(
        '/api/venue-booking-document-request',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            venueName: venue.name,
            venueId,
            venueCity: venue.city,
            venueDestination: venue.destination,
            mode,
            fullName: form.fullName,
            email: form.email,
            mobile: form.mobile,
            numberOfEvents: form.numberOfEvents,
            events: form.events.map((event) => ({
              ...event,
              venueSpaceName:
                venue.venueSpaces?.find(
                  (space) => space.id === event.venueSpace
                )?.name || event.venueSpace,
            })),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Unable to submit the document request.'
        );
      }

      setDocumentRequestSuccess(true);
    } catch (err) {
      console.error(
        'Venue booking document request error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setDocumentRequestSubmitting(false);
    }
  }

  /* ==========================================================
     LOAD RAZORPAY CHECKOUT SCRIPT
  ========================================================== */

  function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }

      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script =
        document.createElement('script');

      script.src =
        'https://checkout.razorpay.com/v1/checkout.js';

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  }

  /* ==========================================================
     PROCEED TO PAYMENT
  ========================================================== */

  async function handlePayment() {
    if (
      !userId ||
      !venue ||
      !draft
    ) {
      setError(
        'Your session or venue information is unavailable.'
      );

      return;
    }

    const form = draft.form;
    const roomDetails = draft.roomDetails;

    setSubmitting(true);
    setError('');

    try {
      /* ------------------------------------------------------
         1. CREATE THE RAZORPAY ORDER
         The server checks venue-date availability here, and
         creates the booking as 'payment_pending' immediately
         -- rejecting first if a date is already held/booked.
      ------------------------------------------------------ */

      const orderResponse =
        await fetch(
          '/api/razorpay/create-order',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              venueId: venue.dbId,
              venueName: venue.name,
              venueCity: venue.city,
              userId,
              fullName: form.fullName,
              email: form.email,
              mobile: form.mobile,
              bookingType,
              events:
                includesVenue
                  ? form.events.map((event) => ({
                      ...event,
                      venueSpaceName:
                        venue.venueSpaces?.find(
                          (space) => space.id === event.venueSpace
                        )?.name || event.venueSpace,
                    }))
                  : [],

              checkinDate:
                includesRoom
                  ? roomDetails.checkInDate
                  : undefined,
              checkoutDate:
                includesRoom
                  ? roomDetails.checkOutDate
                  : undefined,
              nightlySelections:
                includesRoom
                  ? roomDetails.nightlySelections
                  : undefined,
              guestDetails:
                includesRoom
                  ? roomDetails.guestDetails
                  : undefined,
              roomNotes:
                includesRoom
                  ? roomDetails.notes
                  : undefined,
            }),
          }
        );

      const orderResult =
        await orderResponse.json();

      if (
        !orderResponse.ok ||
        !orderResult.success
      ) {
        throw new Error(
          orderResult.error ||
            'Unable to start payment. Please try again.'
        );
      }

      const bookingIds: string[] =
        orderResult.bookingIds || [];

      /* ------------------------------------------------------
         2. NOTIFY ADMIN (best-effort — booking still proceeds
         even if this notification fails)
      ------------------------------------------------------ */

      try {
        await sendBookingEmail('payment');
      } catch (notifyError) {
        console.error(
          'Booking notification email failed:',
          notifyError
        );
      }

      /* ------------------------------------------------------
         3. LOAD RAZORPAY CHECKOUT
      ------------------------------------------------------ */

      const scriptLoaded =
        await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error(
          'Unable to load the payment gateway. Please check your connection and try again.'
        );
      }

      /* ------------------------------------------------------
         4. OPEN CHECKOUT
      ------------------------------------------------------ */

      const razorpay = new window.Razorpay({
        key: orderResult.keyId,
        amount: orderResult.amount,
        currency: orderResult.currency,
        name: 'The Venue Search',
        description: `Booking — ${venue.name}`,
        order_id: orderResult.orderId,

        prefill: {
          name: form.fullName,
          email: form.email,
          contact: form.mobile,
        },

        theme: {
          color: '#151515',
        },

        handler: async (
          response: RazorpayResponse
        ) => {
          await handlePaymentSuccess(
            response,
            bookingIds
          );
        },

        modal: {
          ondismiss: () => {
            setSubmitting(false);

            setError(
              'Payment was cancelled before it completed. You can try again whenever you are ready.'
            );

            /*
             * Best-effort — free the reserved date rather than
             * leaving it payment_pending until the 45-minute
             * expiry job catches it.
             */
            fetch('/api/razorpay/cancel-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: orderResult.orderId,
                bookingIds,
              }),
            }).catch((cancelError) => {
              console.error(
                'Cancel-order notification failed:',
                cancelError
              );
            });
          },
        },
      });

      razorpay.open();
    } catch (err) {
      console.error(
        'Payment error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );

      setSubmitting(false);
    }
  }

  /* ==========================================================
     PAYMENT SUCCEEDED — CONFIRM THE BOOKING
  ========================================================== */

  async function handlePaymentSuccess(
    response: RazorpayResponse,
    bookingIds: string[]
  ) {
    if (!venue || !userId || !draft) {
      setError(
        'Your session or venue information is unavailable.'
      );

      setSubmitting(false);
      return;
    }

    const form = draft.form;

    try {
      const verifyResponse =
        await fetch(
          '/api/razorpay/verify-payment',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              razorpay_order_id:
                response.razorpay_order_id,
              razorpay_payment_id:
                response.razorpay_payment_id,
              razorpay_signature:
                response.razorpay_signature,
              bookingIds,
              fullName: form.fullName,
              email: form.email,
              mobile: form.mobile,
            }),
          }
        );

      const verifyResult =
        await verifyResponse.json();

      if (
        !verifyResponse.ok ||
        !verifyResult.success
      ) {
        throw new Error(
          verifyResult.error ||
            'Your payment succeeded, but we could not confirm the booking. Please contact us with your payment ID: ' +
              response.razorpay_payment_id
        );
      }

      const reference =
        (verifyResult.weddingId || bookingIds[0] || '')
          .replace(/-/g, '')
          .slice(0, 8)
          .toUpperCase();

      setBookingReference(
        reference ? `VS-${reference}` : ''
      );

      // The booking is confirmed -- clear the draft so a future
      // booking attempt for this venue doesn't pick up stale
      // selections from this completed one.
      clearBookingDraft(venueId, selectedSpaceId || null);

      setPaymentSuccess(true);
    } catch (err) {
      console.error(
        'Payment verification error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while confirming your booking. Please contact us with your payment ID: ' +
              response.razorpay_payment_id
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ==========================================================
     FORMAT DATE

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

  const form = draft.form;
  const roomDetails = draft.roomDetails;

  /* ==========================================================
     PAGE
  ========================================================== */

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

          <span className="kicker">REVIEW YOUR BOOKING</span>

          <h1>Review your booking.</h1>

          <p>Review all your details before proceeding to payment.</p>
        </div>

        {/* ====================================================
            BOOKING STEPS
        ==================================================== */}

        <div className="bookingSteps">
          {(
            [
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
            ]
          ).map((progressStep, index) => {
            const status =
              progressStep.key === 'review'
                ? 'active'
                : 'complete';

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
              REVIEW
          ================================================== */}

          <div className="bookingFormCard">
            <div className="reviewContent">

                {/* =================================================
                    BOOKING SUMMARY
                ================================================= */}

                <div className="formSection">

                  <span className="kicker">
                    BOOKING SUMMARY
                  </span>

                  <h2>
                    Check everything before payment
                  </h2>

                  <div className="reviewRows">

                    <div>

                      <span>
                        Booking Type
                      </span>

                      <strong>
                        {bookingType === 'room'
                          ? 'Rooms Only'
                          : bookingType === 'venue_room'
                            ? 'Venue + Rooms'
                            : 'Venue'}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Venue
                      </span>

                      <strong>
                        {venue.name}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Location
                      </span>

                      <strong>
                        {venue.city}

                        {venue.destination
                          ? `, ${venue.destination}`
                          : ''}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Guest
                      </span>

                      <strong>
                        {form.fullName}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Email
                      </span>

                      <strong>
                        {form.email}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Mobile
                      </span>

                      <strong>
                        {form.mobile}
                      </strong>

                    </div>

                    {includesVenue && (
                      <div>

                        <span>
                          Number of events
                        </span>

                        <strong>
                          {form.numberOfEvents}
                        </strong>

                      </div>
                    )}

                  </div>

                </div>

                {/* =================================================
                    EVENT SCHEDULE (venue booking)
                ================================================= */}

                {includesVenue && (

                <div className="formSection">

                  <span className="kicker">
                    EVENT SCHEDULE
                  </span>

                  <h2>
                    Your event details
                  </h2>

                  <div
                    style={{
                      display:
                        'grid',
                      gap:
                        '18px',
                    }}
                  >

                    {form.events.map(
                      (
                        currentEvent,
                        index
                      ) => (

                        <div
                          key={index}
                          style={{
                            padding:
                              '22px',
                            border:
                              '1px solid rgba(0,0,0,0.1)',
                            borderRadius:
                              '12px',
                          }}
                        >

                          <div
                            style={{
                              display:
                                'flex',
                              justifyContent:
                                'space-between',
                              alignItems:
                                'center',
                              marginBottom:
                                '18px',
                              gap:
                                '16px',
                            }}
                          >

                            <h3
                              style={{
                                margin:
                                  0,
                              }}
                            >
                              Event{' '}
                              {index + 1}
                            </h3>

                            <span className="eyebrow">
                              {
                                currentEvent.eventType
                              }
                            </span>

                          </div>

                          <div className="reviewRows">

                            {/* DATE */}

                            <div>

                              <span>
                                Date
                              </span>

                              <strong>
                                {formatDate(
                                  currentEvent.eventDate
                                )}
                              </strong>

                            </div>

                            {/* GUEST COUNT */}

                            <div>

                              <span>
                                Guests
                              </span>

                              <strong>
                                {
                                  currentEvent.guestCount
                                }
                              </strong>

                            </div>

                            {/* VENUE SPACE */}

                            <div>

                              <span>
                                Venue space
                              </span>

                              <strong>
                                {venue.venueSpaces?.find(
                                  (space) =>
                                    space.id ===
                                    currentEvent.venueSpace
                                )?.name ||
                                  currentEvent.venueSpace}
                              </strong>

                            </div>

                            {/* EVENT TYPE */}

                            <div>

                              <span>
                                Event type
                              </span>

                              <strong>
                                {
                                  currentEvent.eventType
                                }
                              </strong>

                            </div>

                            {/* MEAL TIMING */}

                            <div>

                              <span>
                                Meal Timing
                              </span>

                              <strong>
                                {
                                  currentEvent.mealTiming
                                }
                              </strong>

                            </div>

                            {/* MEAL CATEGORY */}

                            <div>

                              <span>
                                Meal Category
                              </span>

                              <strong>
                                {
                                  currentEvent.mealCategory
                                }
                              </strong>

                            </div>

                            {/* NOTES */}

                            {currentEvent.notes && (
                              <div>

                                <span>
                                  Notes
                                </span>

                                <strong>
                                  {
                                    currentEvent.notes
                                  }
                                </strong>

                              </div>
                            )}

                          </div>

                        </div>

                      )
                    )}

                  </div>

                </div>

                )}

                {/* =================================================
                    ROOM DETAILS (room booking)
                ================================================= */}

                {includesRoom && (

                  <div className="formSection">

                    <span className="kicker">
                      ROOM DETAILS
                    </span>

                    <h2>
                      Your stay details
                    </h2>

                    <div className="reviewRows">

                      <div>
                        <span>Check-in</span>
                        <strong>
                          {formatDate(
                            roomDetails.checkInDate
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Check-out</span>
                        <strong>
                          {formatDate(
                            roomDetails.checkOutDate
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Nights</span>
                        <strong>
                          {roomDetails.nightlySelections.length}
                        </strong>
                      </div>

                      {roomDetails.nightlySelections.some(
                        (night) => night.selections.length > 0
                      ) && (
                        <div>
                          <span>Rooms by night</span>
                          <strong>
                            <div className="reviewNightlyRooms">
                              {roomDetails.nightlySelections.map(
                                (night, index) => {
                                  if (
                                    night.selections.length === 0
                                  ) {
                                    return null;
                                  }

                                  const nightEnd =
                                    computeNights(
                                      roomDetails.checkInDate,
                                      roomDetails.checkOutDate
                                    )[index]?.end || '';

                                  return (
                                    <div key={night.date}>
                                      <em>
                                        {formatShortDate(
                                          night.date
                                        )}{' '}
                                        &rarr;{' '}
                                        {formatShortDate(nightEnd)}:
                                      </em>{' '}
                                      {night.selections
                                        .map(
                                          (s) =>
                                            (() => {
  const room = venue.rooms?.find(
    (room) => room.id === s.roomId
  );

  return `${room?.name ?? 'Room'} — ${s.quantity}`;
})()
                                        )
                                        .join(', ')}
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </strong>
                        </div>
                      )}

                      {roomDetails.guestDetails && (
                        <div>
                          <span>Guest details</span>
                          <strong>
                            {roomDetails.guestDetails}
                          </strong>
                        </div>
                      )}

                      {roomDetails.notes && (
                        <div>
                          <span>
                            Additional requirements
                          </span>
                          <strong>
                            {roomDetails.notes}
                          </strong>
                        </div>
                      )}

                    </div>

                  </div>

                )}

                {/* =================================================
                    PAYMENT SUMMARY
                ================================================= */}

                <div className="paymentSummary">

                  <div>

                    <span>
                      Total Payable Now
                    </span>

                    <strong>
                      ₹
                      {BOOKING_FEE_INR.toLocaleString(
                        'en-IN'
                      )}
                    </strong>

                  </div>

                  <small>
                    {includesRoom && !includesVenue
                      ? 'This amount confirms your room booking. The remaining stay balance is settled directly with the hotel as per their payment terms.'
                      : includesRoom
                        ? 'This amount confirms your venue and room booking. The remaining balance is settled directly with the venue/hotel as per their payment terms.'
                        : 'This amount secures your instant booking. The remaining venue balance is settled directly with the venue as per their payment terms.'}
                  </small>

                </div>

                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                  <div className="bookingError">
                    {error}
                  </div>
                )}

                {/* =================================================
                    ACTIONS
                ================================================= */}

                <div
                  className="bookingActionRow reviewActions"
                >

                  <button
                    type="button"
                    className="secondaryBtn"
                    onClick={() => {
                      setError('');

                      const query = `venue=${venueId}&space=${selectedSpaceId}`;

                      // Land back on whichever step was filled
                      // last, rather than always restarting at
                      // event details.
                      router.push(
                        includesRoom
                          ? `/book/rooms?${query}`
                          : `/book?${query}`
                      );
                    }}
                    disabled={
                      submitting ||
                      documentRequestSubmitting
                    }
                  >
                    ← Edit details
                  </button>

                  <button
                    type="button"
                    className="secondaryBtn documentRequestBtn"
                    onClick={
                      handleDocumentRequest
                    }
                    disabled={
                      submitting ||
                      documentRequestSubmitting
                    }
                  >
                    {documentRequestSubmitting
                      ? 'Requesting document...'
                      : 'Request Venue Booking Document'}
                  </button>

                  <button
                    type="button"
                    className="primaryBtn large"
                    onClick={
                      handlePayment
                    }
                    disabled={
                      submitting ||
                      documentRequestSubmitting
                    }
                  >

                    {submitting
                      ? 'Preparing payment...'
                      : 'Proceed to Pay →'}

                  </button>

                </div>

            </div>
          </div>
        </div>
        {/* ====================================================
            DOCUMENT REQUEST SUCCESS MODAL
        ==================================================== */}

        {documentRequestSuccess && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-request-title"
            onClick={() =>
              setDocumentRequestSuccess(false)
            }
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999999,
              display: 'grid',
              placeItems: 'center',
              padding: '24px',
              background: 'rgba(10, 10, 10, 0.48)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              onClick={(event) =>
                event.stopPropagation()
              }
              style={{
                width: 'min(520px, 100%)',
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: '18px',
                padding: '38px 34px 32px',
                textAlign: 'center',
                boxShadow: '0 24px 80px rgba(0,0,0,0.20)',
              }}
            >
              <div
                style={{
                  width: '58px',
                  height: '58px',
                  margin: '0 auto 20px',
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  background: '#eef9ff',
                  color: '#1496ff',
                  fontSize: '28px',
                  fontWeight: 700,
                }}
              >
                ✓
              </div>

              <span
                className="kicker"
                style={{ display: 'block' }}
              >
                REQUEST RECEIVED
              </span>

              <h2
                id="document-request-title"
                style={{
                  margin: '10px 0 12px',
                  fontSize: '26px',
                }}
              >
                Request Submitted Successfully
              </h2>

              <p
                style={{
                  margin: 0,
                  color: '#666666',
                  lineHeight: 1.7,
                  fontSize: '15px',
                }}
              >
                You'll get the Venue Booking Document via email.
              </p>

              <button
                type="button"
                className="primaryBtn large"
                onClick={() =>
                  setDocumentRequestSuccess(false)
                }
                style={{
                  marginTop: '26px',
                  minWidth: '120px',
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* ====================================================
            PAYMENT SUCCESS MODAL
        ==================================================== */}

        {paymentSuccess && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-success-title"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999999,
              display: 'grid',
              placeItems: 'center',
              padding: '24px',
              background: 'rgba(10, 10, 10, 0.48)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              style={{
                width: 'min(520px, 100%)',
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: '18px',
                padding: '38px 34px 32px',
                textAlign: 'center',
                boxShadow: '0 24px 80px rgba(0,0,0,0.20)',
              }}
            >
              <div
                style={{
                  width: '58px',
                  height: '58px',
                  margin: '0 auto 20px',
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  background: '#e8f8f3',
                  color: '#17775b',
                  fontSize: '28px',
                  fontWeight: 700,
                }}
              >
                ✓
              </div>

              <span
                className="kicker"
                style={{ display: 'block' }}
              >
                BOOKING CONFIRMED
              </span>

              <h2
                id="payment-success-title"
                style={{
                  margin: '10px 0 12px',
                  fontSize: '26px',
                }}
              >
                Booking Confirmed!
              </h2>

              {bookingReference && (
                <p
                  style={{
                    margin: '0 0 12px',
                    fontSize: '15px',
                    color: '#151515',
                  }}
                >
                  Your booking ID:{' '}
                  <strong>{bookingReference}</strong>
                </p>
              )}

              <p
                style={{
                  margin: 0,
                  color: '#666666',
                  lineHeight: 1.7,
                  fontSize: '15px',
                }}
              >
                {bookingType === 'room'
                  ? 'Your room booking is confirmed for the dates you selected.'
                  : bookingType === 'venue_room'
                    ? 'Your venue and room booking are both confirmed for the dates you selected.'
                    : 'Your venue is confirmed for the date(s) you selected.'}
                {' '}
                You can view the full details anytime
                from your profile.
              </p>

              <button
                type="button"
                className="primaryBtn large"
                onClick={() =>
                  router.push('/profile')
                }
                style={{
                  marginTop: '26px',
                  minWidth: '120px',
                }}
              >
                View my bookings
              </button>
            </div>
          </div>
        )}

      </section>
    </main>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={null}>
      <ReviewPageContent />
    </Suspense>
  );
}
