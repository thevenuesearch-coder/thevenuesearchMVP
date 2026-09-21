'use client';

import Link from 'next/link';
import {
  useRouter,
  useSearchParams,
} from 'next/navigation';

import {
  FormEvent,
  Suspense,
  useEffect,
  useState,
} from 'react';

import { createClient } from '../../lib/supabase-browser';
import { fetchVenueBySlug } from '../../lib/venues';
import type { Venue } from '../../lib/data';

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
   EVENT DETAILS
============================================================ */

type EventDetails = {
  venueSpace: string;
  eventDate: string;
  eventType: string;
  guestCount: string;
  mealTiming: string;
  mealCategory: string;
  notes: string;
};

/* ============================================================
   BOOKING FORM
============================================================ */

type BookingForm = {
  fullName: string;
  email: string;
  mobile: string;
  numberOfEvents: string;
  events: EventDetails[];
};

/* ============================================================
   CREATE EMPTY EVENT
============================================================ */

function createEmptyEvent(): EventDetails {
  return {
    venueSpace: '',
    eventDate: '',
    eventType: '',
    guestCount: '',
    mealTiming: '',
    mealCategory: '',
    notes: '',
  };
}

/* ============================================================
   INITIAL FORM
============================================================ */

const initialForm: BookingForm = {
  fullName: '',
  email: '',
  mobile: '',
  numberOfEvents: '',
  events: [],
};

/* ============================================================
   BOOKING FEE
   Single source of truth shared with the server (see
   /api/razorpay/create-order), so what's displayed here always
   matches what Razorpay actually charges.
============================================================ */

const BOOKING_FEE_INR =
  Number(
    process.env.NEXT_PUBLIC_BOOKING_FEE_INR
  ) || 25000;

/* ============================================================
   BOOKING PAGE CONTENT
============================================================ */

function BookPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ==========================================================
     URL PARAMETERS
  ========================================================== */

  const venueId =
    searchParams.get('venue') || '';

  const selectedSpaceId =
    searchParams.get('space') || '';

  const mode =
    searchParams.get('mode');

  /* ==========================================================
     FIND VENUE
  ========================================================== */

  const [venue, setVenue] = useState<Venue | null>(null);

  /* ==========================================================
     STATE
  ========================================================== */

  const [form, setForm] =
    useState<BookingForm>(
      initialForm
    );

  const [step, setStep] =
    useState<1 | 2>(1);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [userId, setUserId] =
    useState<string | null>(null);

  const [error, setError] =
    useState('');

  const [documentRequestSubmitting, setDocumentRequestSubmitting] =
    useState(false);

  const [documentRequestSuccess, setDocumentRequestSuccess] =
    useState(false);

  const [paymentSuccess, setPaymentSuccess] =
    useState(false);

  /* ==========================================================
     LOAD AUTHENTICATED USER
  ========================================================== */

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase =
          createClient();

        const {
          data: { session },
        } =
          await supabase.auth.getSession();

        /* ------------------------------------------------------
           USER NOT LOGGED IN
        ------------------------------------------------------ */

        if (!session?.user) {
          router.replace(
            `/login?redirect=${encodeURIComponent(
              `/book?venue=${venueId}&mode=${mode || ''}`
            )}`
          );

          return;
        }

        /* ------------------------------------------------------
           SAVE USER ID
        ------------------------------------------------------ */

        setUserId(
          session.user.id
        );

        /* ------------------------------------------------------
           LOAD VENUE
        ------------------------------------------------------ */

        const venueData =
          await fetchVenueBySlug(
            venueId
          );

        setVenue(venueData);

        /* ------------------------------------------------------
           PRE-FILL EMAIL
        ------------------------------------------------------ */

        setForm((current) => ({
          ...current,
          email:
            session.user.email || '',
        }));
      } catch (err) {
        console.error(
          'Booking auth error:',
          err
        );

        setError(
          'Unable to load your booking. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [
    router,
    venueId,
    selectedSpaceId,
    mode,
  ]);

  /* ==========================================================
     UPDATE CUSTOMER FIELD
  ========================================================== */

  function updateField(
    field:
      | 'fullName'
      | 'email'
      | 'mobile',
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError('');
  }

  /* ==========================================================
     NUMBER OF EVENTS
  ========================================================== */

  function handleEventCountChange(
    value: string
  ) {
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

      events: Array.from(
        { length: count },
        (_, index) => {
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
        }
      ),
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

      events:
        current.events.map(
          (
            event,
            eventIndex
          ) =>
            eventIndex === index
              ? {
                  ...event,
                  [field]: value,
                }
              : event
        ),
    }));

    setError('');
  }

  /* ==========================================================
     CONTINUE TO REVIEW
  ========================================================== */

  function handleContinue(
    event: FormEvent
  ) {
    event.preventDefault();

    setError('');

    /* --------------------------------------------------------
       VENUE
    -------------------------------------------------------- */

    if (!venue) {
      setError(
        'The selected venue could not be found.'
      );

      return;
    }

    /* --------------------------------------------------------
       FULL NAME
    -------------------------------------------------------- */

    if (!form.fullName.trim()) {
      setError(
        'Please enter your full name.'
      );

      return;
    }

    /* --------------------------------------------------------
       EMAIL
    -------------------------------------------------------- */

    if (!form.email.trim()) {
      setError(
        'Please enter your email address.'
      );

      return;
    }

    /* --------------------------------------------------------
       MOBILE
    -------------------------------------------------------- */

    if (!form.mobile.trim()) {
      setError(
        'Please enter your mobile number.'
      );

      return;
    }

    /* --------------------------------------------------------
       NUMBER OF EVENTS
    -------------------------------------------------------- */

    if (!form.numberOfEvents) {
      setError(
        'Please select the number of events.'
      );

      return;
    }

    /* --------------------------------------------------------
       EVENT ARRAY
    -------------------------------------------------------- */

    if (
      form.events.length !==
      Number(form.numberOfEvents)
    ) {
      setError(
        'Please select the number of events again.'
      );

      return;
    }

    /* --------------------------------------------------------
       VALIDATE EVERY EVENT
    -------------------------------------------------------- */

    for (
      let index = 0;
      index < form.events.length;
      index++
    ) {
      const currentEvent =
        form.events[index];

      /* Venue space */

      if (!currentEvent.venueSpace) {
        setError(
          `Please select the venue space for Event ${index + 1}.`
        );

        return;
      }

      /* Event date */

      if (!currentEvent.eventDate) {
        setError(
          `Please select the date for Event ${index + 1}.`
        );

        return;
      }

      /* Event type */

      if (!currentEvent.eventType) {
        setError(
          `Please select the event type for Event ${index + 1}.`
        );

        return;
      }

      /* Guest count */

      if (!currentEvent.guestCount) {
        setError(
          `Please select the guest count for Event ${index + 1}.`
        );

        return;
      }

      /* Meal timing */

      if (!currentEvent.mealTiming) {
        setError(
          `Please select the meal timing for Event ${index + 1}.`
        );

        return;
      }

      /* Meal category */

      if (!currentEvent.mealCategory) {
        setError(
          `Please select the meal category for Event ${index + 1}.`
        );

        return;
      }
    }

    /* --------------------------------------------------------
       EVERYTHING VALID
    -------------------------------------------------------- */

    setStep(2);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /* ==========================================================
     SEND BOOKING DATA
  ========================================================== */

  async function sendBookingEmail(
    stage:
      | 'review'
      | 'payment'
  ) {
    if (!venue) {
      throw new Error(
        'The selected venue could not be found.'
      );
    }

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
    if (!userId || !venue) {
      setError(
        'Your session or venue information is unavailable.'
      );
      return;
    }

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
      !venue
    ) {
      setError(
        'Your session or venue information is unavailable.'
      );

      return;
    }

    setSubmitting(true);
    setError('');

    try {
      /* ------------------------------------------------------
         1. CREATE THE RAZORPAY ORDER
         The server checks venue-date availability here and
         rejects before any money moves if a date is already
         held/booked.
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
              fullName: form.fullName,
              email: form.email,
              mobile: form.mobile,
              eventDate:
                form.events[0]?.eventDate,
              events: form.events,
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
        description: `Instant booking — ${venue.name}`,
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
            response
          );
        },

        modal: {
          ondismiss: () => {
            setSubmitting(false);

            setError(
              'Payment was cancelled before it completed. You can try again whenever you are ready.'
            );
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
     PAYMENT SUCCEEDED — VERIFY + CREATE THE BOOKING
  ========================================================== */

  async function handlePaymentSuccess(
    response: RazorpayResponse
  ) {
    if (!venue || !userId) {
      setError(
        'Your session or venue information is unavailable.'
      );

      setSubmitting(false);
      return;
    }

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

              venueId: venue.dbId,
              venueName: venue.name,
              venueCity: venue.city,
              userId,
              mode: mode || 'instant_book',
              fullName: form.fullName,
              email: form.email,
              mobile: form.mobile,
              events: form.events,
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
  ========================================================== */

  function formatDate(
    date: string
  ) {
    if (!date) {
      return '';
    }

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString(
      'en-IN',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    );
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
            minHeight:
              '70vh',
            display: 'grid',
            placeItems:
              'center',
          }}
        >
          <p>
            Loading booking...
          </p>
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

            <span className="kicker">
              VENUE NOT FOUND
            </span>

            <h1>
              We couldn't find this venue.
            </h1>

            <p>
              Please return to the venue
              collection and select a venue
              again.
            </p>

            <Link
              href="/explore"
              className="primaryBtn"
            >
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

  return (
    <main className="page">

      <section className="section bookPage">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="bookHeader">

          <Link
            href={`/venues/${venue.id}`}
            className="backLink"
          >
            ← Back to venue
          </Link>

          <span className="kicker">
            {step === 1
              ? 'BOOK THIS VENUE'
              : 'REVIEW YOUR BOOKING'}
          </span>

          <h1>
            {step === 1
              ? 'Start your booking.'
              : 'Review your booking.'}
          </h1>

          <p>
            {step === 1
              ? 'Tell us about your celebration and continue to review your booking details.'
              : 'Review all your event details before proceeding to payment.'}
          </p>

        </div>

        {/* ====================================================
            BOOKING STEPS
        ==================================================== */}

        <div className="bookingSteps">

          <div
            className={
              step === 1
                ? 'bookingStep active'
                : 'bookingStep complete'
            }
          >

            <span>
              1
            </span>

            <div>

              <strong>
                Booking details
              </strong>

              <small>
                Your event information
              </small>

            </div>

          </div>

          <div
            className={
              step === 2
                ? 'bookingStep active'
                : 'bookingStep'
            }
          >

            <span>
              2
            </span>

            <div>

              <strong>
                Review & payment
              </strong>

              <small>
                Confirm and pay
              </small>

            </div>

          </div>

        </div>

        {/* ====================================================
            BOOKING LAYOUT
        ==================================================== */}

        <div className="bookingLayout">

          {/* ==================================================
              VENUE CARD
          ================================================== */}

          <aside className="bookingVenueCard">

            <div className="bookingVenueImage">

              {venue.image ? (
                <img
                  src={venue.image}
                  alt={venue.name}
                />
              ) : (
                <div>
                  The Venue Search
                </div>
              )}

            </div>

            <div className="bookingVenueBody">

              <span className="eyebrow">
                {venue.type}
                {' · '}
                {venue.city}
              </span>

              <h2>
                {venue.name}
              </h2>

              <p>
                {venue.desc}
              </p>

              <div className="bookingVenueMeta">

                <span>
                  Up to{' '}
                  {venue.capacity.toLocaleString()}
                  {' '}
                  guests
                </span>

                {venue.rating && (
                  <span>
                    ★ {venue.rating}
                  </span>
                )}

              </div>

              {venue.verified && (
                <span className="bookingVerified">
                  ✓ Verified venue
                </span>
              )}

            </div>

          </aside>

          {/* ==================================================
              FORM / REVIEW
          ================================================== */}

          <div className="bookingFormCard">

            {step === 1 ? (

              /* =================================================
                 STEP 1 — BOOKING DETAILS
              ================================================= */

              <form
                onSubmit={
                  handleContinue
                }
              >

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
                    EVENT DETAILS
                ================================================= */}

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
                              VENUE SPACE
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
                                Select venue space
                              </option>

                              {venue.venueSpaces?.map(
                                (space) => (
                                  <option
                                    key={space.id}
                                    value={space.id}
                                  >
                                    {space.name}
                                  </option>
                                )
                              )}

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

                              <option value="Engagement">
                                Engagement
                              </option>

                              <option value="Wedding">
                                Sangeeth
                              </option>

                              <option value="Reception">
                                Haldi
                              </option>                              

                              <option value="Mehendi">
                                Mehendi
                              </option>

                              <option value="Sangeet">
                                Wedding
                              </option>

                              <option value="Haldi">
                                Reception
                              </option>

                              <option value="Other">
                                Other
                              </option>

                            </select>

                          </label>

                          {/* =================================================
                              GUEST COUNT
                          ================================================= */}

                          <label>

                            <span>
                              Guest count *
                            </span>

                            <select
                              value={
                                currentEvent.guestCount
                              }
                              onChange={(e) =>
                                updateEventField(
                                  index,
                                  'guestCount',
                                  e.target.value
                                )
                              }
                            >

                              <option value="">
                                Select guest count
                              </option>

                              <option value="50–100">
                                50–100
                              </option>

                              <option value="100–150">
                                100–150
                              </option>

                              <option value="150–200">
                                150–200
                              </option>

                              <option value="200–250">
                                200–250
                              </option>

                              <option value="250–300">
                                250–300
                              </option>

                              <option value="300–350">
                                300–350
                              </option>

                              <option value="900+">
                                350+
                              </option>

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

                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                  <div className="bookingError">
                    {error}
                  </div>
                )}

                {/* =================================================
                    ACTION
                ================================================= */}

                <div className="bookingActionRow">

                  <button
                    type="submit"
                    className="primaryBtn large"
                    disabled={
                      submitting
                    }
                  >
                    Review booking →
                  </button>

                </div>

              </form>

            ) : (

              /* =================================================
                 STEP 2 — REVIEW
              ================================================= */

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

                    <div>

                      <span>
                        Number of events
                      </span>

                      <strong>
                        {form.numberOfEvents}
                      </strong>

                    </div>

                  </div>

                </div>

                {/* =================================================
                    EVENT SCHEDULE
                ================================================= */}

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

                {/* =================================================
                    PAYMENT SUMMARY
                ================================================= */}

                <div className="paymentSummary">

                  <div>

                    <span>
                      Instant booking fee
                    </span>

                    <strong>
                      ₹
                      {BOOKING_FEE_INR.toLocaleString(
                        'en-IN'
                      )}
                    </strong>

                  </div>

                  <small>
                    This amount secures your
                    instant booking. The
                    remaining venue balance is
                    settled directly with the
                    venue as per their payment
                    terms.
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
                      setStep(1);

                      window.scrollTo({
                        top: 0,
                        behavior: 'smooth',
                      });
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
                      : 'Proceed to payment →'}

                  </button>

                </div>

              </div>

            )}

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
                You're all booked.
              </h2>

              <p
                style={{
                  margin: 0,
                  color: '#666666',
                  lineHeight: 1.7,
                  fontSize: '15px',
                }}
              >
                Your venue is confirmed for the
                date(s) you selected. You can view
                the full details anytime from your
                profile.
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

/* ============================================================
   PUBLIC BOOK PAGE
============================================================ */

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <main className="page">

          <section
            className="section"
            style={{
              minHeight:
                '70vh',
              display:
                'grid',
              placeItems:
                'center',
            }}
          >

            <p>
              Loading booking...
            </p>

          </section>

        </main>
      }
    >

      <BookPageContent />

    </Suspense>
  );
}