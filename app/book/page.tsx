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
  useMemo,
  useState,
} from 'react';

import { createClient } from '../../lib/supabase-browser';
import { venues } from '../../lib/data';

type BookingForm = {
  fullName: string;
  email: string;
  mobile: string;
  eventDate: string;
  eventType: string;
  guestCount: string;
  budget: string;
  notes: string;
};

const initialForm: BookingForm = {
  fullName: '',
  email: '',
  mobile: '',
  eventDate: '',
  eventType: '',
  guestCount: '',
  budget: '',
  notes: '',
};

const TEMP_BOOKING_FEE = 25000;

/*
 * ============================================================
 * BOOKING PAGE CONTENT
 * ============================================================
 */

function BookPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /*
   * ==========================================================
   * URL PARAMETERS
   * ==========================================================
   */

  const venueId =
    searchParams.get('venue') || '';

  const mode =
    searchParams.get('mode');

  /*
   * ==========================================================
   * FIND VENUE
   * ==========================================================
   */

  const venue = useMemo(
    () =>
      venues.find(
        (v) => v.id === venueId
      ),
    [venueId]
  );

  /*
   * ==========================================================
   * STATE
   * ==========================================================
   */

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

  /*
   * ==========================================================
   * LOAD AUTHENTICATED USER
   * ==========================================================
   */

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase =
          createClient();

        const {
          data: { session },
        } =
          await supabase.auth.getSession();

        /*
         * User is not logged in
         */

        if (!session?.user) {
          router.replace(
            `/login?redirect=${encodeURIComponent(
              `/book?venue=${venueId}`
            )}`
          );

          return;
        }

        /*
         * Save user ID
         */

        setUserId(
          session.user.id
        );

        /*
         * Pre-fill email
         */

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
          'Unable to load your account. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router, venueId]);

  /*
   * ==========================================================
   * UPDATE FORM FIELD
   * ==========================================================
   */

  function updateField(
    field: keyof BookingForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError('');
  }

  /*
   * ==========================================================
   * CONTINUE TO REVIEW
   * ==========================================================
   */

  function handleContinue(
    event: FormEvent
  ) {
    event.preventDefault();

    setError('');

    /*
     * Venue validation
     */

    if (!venue) {
      setError(
        'The selected venue could not be found.'
      );

      return;
    }

    /*
     * Full name
     */

    if (!form.fullName.trim()) {
      setError(
        'Please enter your full name.'
      );

      return;
    }

    /*
     * Email
     */

    if (!form.email.trim()) {
      setError(
        'Please enter your email address.'
      );

      return;
    }

    /*
     * Mobile
     */

    if (!form.mobile.trim()) {
      setError(
        'Please enter your mobile number.'
      );

      return;
    }

    /*
     * Event date
     */

    if (!form.eventDate) {
      setError(
        'Please select your event date.'
      );

      return;
    }

    /*
     * Event type
     */

    if (!form.eventType) {
      setError(
        'Please select your event type.'
      );

      return;
    }

    /*
     * Guest count
     */

    if (!form.guestCount) {
      setError(
        'Please select your guest count.'
      );

      return;
    }

    /*
     * Budget
     */

    if (!form.budget) {
      setError(
        'Please select your budget.'
      );

      return;
    }

    /*
     * Everything is valid
     */

    setStep(2);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /*
   * ==========================================================
   * SEND BOOKING EMAIL
   * ==========================================================
   *
   * Sends booking information to:
   *
   * thevenuesearch@gmail.com
   *
   * through:
   *
   * /api/booking-payment
   * ==========================================================
   */

  async function sendBookingEmail(
    stage: 'review' | 'payment'
  ) {
    /*
     * TypeScript fix:
     * Make sure venue exists before accessing venue.name.
     */

    if (!venue) {
      throw new Error(
        'The selected venue could not be found.'
      );
    }

    const response = await fetch(
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

          eventDate:
            form.eventDate,

          eventType:
            form.eventType,

          guestCount:
            form.guestCount,

          budget:
            form.budget,

          notes:
            form.notes,

          bookingFee:
            TEMP_BOOKING_FEE,

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

  /*
   * ==========================================================
   * PROCEED TO PAYMENT
   * ==========================================================
   */

  async function handlePayment() {
    if (!userId || !venue) {
      setError(
        'Your session or venue information is unavailable.'
      );

      return;
    }

    setSubmitting(true);
    setError('');

    try {
      /*
       * Send booking details to admin
       * before proceeding to payment.
       */

      const result =
        await sendBookingEmail(
          'payment'
        );

      console.log(
        'Booking email sent:',
        result
      );

      /*
       * ======================================================
       * RAZORPAY WILL BE CONNECTED HERE
       * ======================================================
       */

      alert(
        'Booking details sent successfully. Razorpay payment will open here.'
      );
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
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * ==========================================================
   * LOADING STATE
   * ==========================================================
   */

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
          <p>
            Loading booking...
          </p>
        </section>
      </main>
    );
  }

  /*
   * ==========================================================
   * VENUE NOT FOUND
   * ==========================================================
   */

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

  /*
   * ==========================================================
   * PAGE
   * ==========================================================
   */

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
              : 'Review your event details before proceeding to payment.'}
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
                onSubmit={handleContinue}
              >

                {/* =================================================
                    YOUR DETAILS
                ================================================= */}

                <div className="formSection">

                  <span className="kicker">
                    YOUR DETAILS
                  </span>

                  <h2>
                    Tell us who's booking
                  </h2>

                  <div className="formGrid">

                    <label>

                      <span>
                        Full name *
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
                    Tell us about your celebration
                  </h2>

                  <div className="formGrid">

                    {/* EVENT DATE */}

                    <label>

                      <span>
                        Event date *
                      </span>

                      <input
                        type="date"
                        value={
                          form.eventDate
                        }
                        min={
                          new Date()
                            .toISOString()
                            .split('T')[0]
                        }
                        onChange={(e) =>
                          updateField(
                            'eventDate',
                            e.target.value
                          )
                        }
                      />

                    </label>

                    {/* EVENT TYPE */}

                    <label>

                      <span>
                        Event type *
                      </span>

                      <select
                        value={
                          form.eventType
                        }
                        onChange={(e) =>
                          updateField(
                            'eventType',
                            e.target.value
                          )
                        }
                      >

                        <option value="">
                          Select event type
                        </option>

                        <option value="Wedding">
                          Wedding
                        </option>

                        <option value="Reception">
                          Reception
                        </option>

                        <option value="Engagement">
                          Engagement
                        </option>

                        <option value="Mehendi">
                          Mehendi
                        </option>

                        <option value="Sangeet">
                          Sangeet
                        </option>

                        <option value="Haldi">
                          Haldi
                        </option>

                        <option value="Corporate Event">
                          Corporate Event
                        </option>

                        <option value="Other">
                          Other
                        </option>

                      </select>

                    </label>

                    {/* GUEST COUNT */}

                    <label>

                      <span>
                        Guest count *
                      </span>

                      <select
                        value={
                          form.guestCount
                        }
                        onChange={(e) =>
                          updateField(
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

                        <option value="100–200">
                          100–200
                        </option>

                        <option value="200–400">
                          200–400
                        </option>

                        <option value="400–600">
                          400–600
                        </option>

                        <option value="600+">
                          600+
                        </option>

                      </select>

                    </label>

                    {/* BUDGET */}

                    <label>

                      <span>
                        Wedding budget *
                      </span>

                      <select
                        value={
                          form.budget
                        }
                        onChange={(e) =>
                          updateField(
                            'budget',
                            e.target.value
                          )
                        }
                      >

                        <option value="">
                          Select budget
                        </option>

                        <option value="₹5L – ₹10L">
                          ₹5L – ₹10L
                        </option>

                        <option value="₹10L – ₹20L">
                          ₹10L – ₹20L
                        </option>

                        <option value="₹20L – ₹40L">
                          ₹20L – ₹40L
                        </option>

                        <option value="₹40L – ₹75L">
                          ₹40L – ₹75L
                        </option>

                        <option value="₹75L+">
                          ₹75L+
                        </option>

                      </select>

                    </label>

                  </div>

                  {/* NOTES */}

                  <label className="fullWidthField">

                    <span>
                      Notes{' '}
                      <small>
                        Optional
                      </small>
                    </span>

                    <textarea
                      value={
                        form.notes
                      }
                      onChange={(e) =>
                        updateField(
                          'notes',
                          e.target.value
                        )
                      }
                      placeholder="Tell us anything important about your celebration..."
                      rows={5}
                    />

                  </label>

                </div>

                {/* ERROR */}

                {error && (
                  <div className="bookingError">
                    {error}
                  </div>
                )}

                {/* ACTION */}

                <div className="bookingActionRow">

                  <button
                    type="submit"
                    className="primaryBtn large"
                    disabled={submitting}
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
                        Event date
                      </span>

                      <strong>

                        {new Date(
                          `${form.eventDate}T00:00:00`
                        ).toLocaleDateString(
                          'en-IN',
                          {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          }
                        )}

                      </strong>

                    </div>

                    <div>

                      <span>
                        Event type
                      </span>

                      <strong>
                        {form.eventType}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Guests
                      </span>

                      <strong>
                        {form.guestCount}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Wedding budget
                      </span>

                      <strong>
                        {form.budget}
                      </strong>

                    </div>

                    {form.notes && (
                      <div>

                        <span>
                          Notes
                        </span>

                        <strong>
                          {form.notes}
                        </strong>

                      </div>
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
                      {TEMP_BOOKING_FEE.toLocaleString(
                        'en-IN'
                      )}
                    </strong>

                  </div>

                  <small>
                    This is a temporary booking amount
                    for the current development flow.
                    The final amount will be connected
                    to your venue booking configuration
                    before Razorpay goes live.
                  </small>

                </div>

                {/* ERROR */}

                {error && (
                  <div className="bookingError">
                    {error}
                  </div>
                )}

                {/* =================================================
                    ACTIONS
                ================================================= */}

                <div className="bookingActionRow reviewActions">

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
                    disabled={submitting}
                  >
                    ← Edit details
                  </button>

                  <button
                    type="button"
                    className="primaryBtn large"
                    onClick={
                      handlePayment
                    }
                    disabled={submitting}
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

      </section>
    </main>
  );
}

/*
 * ============================================================
 * PUBLIC BOOK PAGE
 * ============================================================
 *
 * Next.js 16 requires useSearchParams() to be inside
 * a Suspense boundary during production builds.
 * ============================================================
 */

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <main className="page">

          <section
            className="section"
            style={{
              minHeight: '70vh',
              display: 'grid',
              placeItems: 'center',
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