'use client';

import {
  FormEvent,
  useState,
} from 'react';

type Props = {
  venueName: string;
  venueId: string;
  mode: string;
};

type FormState = {
  fullName: string;
  email: string;
  mobile: string;
  eventDate: string;
  eventType: string;
  budget: string;
  guestCount: string;
  notes: string;
};

const initialForm: FormState = {
  fullName: '',
  email: '',
  mobile: '',
  eventDate: '',
  eventType: '',
  budget: '',
  guestCount: '',
  notes: '',
};

/*
 * Temporary booking fee.
 *
 * This will later be replaced by the actual
 * Razorpay booking amount from the backend.
 */
const TEMP_BOOKING_FEE = 25000;

export default function BookForm({
  venueName,
  venueId,
  mode,
}: Props) {
  const [form, setForm] =
    useState<FormState>(initialForm);

  const [step, setStep] =
    useState<1 | 2>(1);

  const [reviewLoading, setReviewLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const update = (
    field: keyof FormState,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError('');
    }
  };

  /*
   * ======================================================
   * REVIEW BOOKING
   *
   * When the customer clicks "Review booking":
   *
   * 1. Validate the form
   * 2. Send ALL booking details to our API
   * 3. API immediately emails the details to
   *    thevenuesearch@gmail.com
   * 4. Only after successful email delivery,
   *    show the review screen
   * ======================================================
   */

  async function handleReview(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError('');
    setReviewLoading(true);

    try {
      const response = await fetch(
        '/api/booking-review',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            venueName,
            venueId,
            mode,
            ...form,
            bookingFee:
              TEMP_BOOKING_FEE,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Unable to prepare your booking review.'
        );
      }

      /*
       * Email was successfully sent.
       * Now show the review screen.
       */
      setStep(2);

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (err) {
      console.error(
        'Booking review error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to send your booking details. Please try again.'
      );
    } finally {
      setReviewLoading(false);
    }
  }

  /*
   * ======================================================
   * RETURN TO EDIT
   * ======================================================
   */

  function handleEdit() {
    setError('');
    setStep(1);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /*
   * ======================================================
   * PAYMENT
   *
   * Razorpay will be connected here next.
   * ======================================================
   */

  async function handlePayment() {
    setError('');

    alert(
      'Payment gateway is not connected yet. Razorpay will be opened here.'
    );
  }

  /*
   * ======================================================
   * STEP 2 — REVIEW
   * ======================================================
   */

  if (step === 2) {
    return (
      <main className="page narrow">

        <div className="formIntro">

          <span className="kicker">
            REVIEW & PAYMENT
          </span>

          <h1>
            Review your booking
          </h1>

          <p>
            Please review your celebration
            details before continuing to payment.
          </p>

        </div>

        <div className="bookingProgress">

          <div className="bookingProgressItem complete">
            <span>✓</span>
            <strong>Details</strong>
          </div>

          <div className="bookingProgressLine" />

          <div className="bookingProgressItem active">
            <span>2</span>
            <strong>Review</strong>
          </div>

          <div className="bookingProgressLine" />

          <div className="bookingProgressItem">
            <span>3</span>
            <strong>Payment</strong>
          </div>

        </div>

        <section className="reviewCard">

          <div className="reviewHeader">

            <div>
              <span className="kicker">
                VENUE
              </span>

              <h2>
                {venueName}
              </h2>
            </div>

            <span className="reviewStatus">
              Ready to book
            </span>

          </div>

          <div className="reviewRows">

            <div className="reviewRow">
              <span>Full name</span>
              <strong>
                {form.fullName}
              </strong>
            </div>

            <div className="reviewRow">
              <span>Email address</span>
              <strong>
                {form.email}
              </strong>
            </div>

            <div className="reviewRow">
              <span>Mobile number</span>
              <strong>
                {form.mobile}
              </strong>
            </div>

            <div className="reviewRow">
              <span>Event date</span>
              <strong>
                {form.eventDate}
              </strong>
            </div>

            <div className="reviewRow">
              <span>Event type</span>
              <strong>
                {form.eventType}
              </strong>
            </div>

            <div className="reviewRow">
              <span>Guest count</span>
              <strong>
                {form.guestCount}
              </strong>
            </div>

            <div className="reviewRow">
              <span>Budget</span>
              <strong>
                {form.budget}
              </strong>
            </div>

            <div className="reviewRow">
              <span>Notes</span>
              <strong>
                {form.notes ||
                  'No additional notes'}
              </strong>
            </div>

          </div>

          <div className="bookingPaymentBox">

            <div className="bookingPaymentTop">

              <div>
                <span>
                  Instant booking fee
                </span>

                <small>
                  Pay securely through Razorpay
                </small>
              </div>

              <strong>
                ₹
                {TEMP_BOOKING_FEE.toLocaleString(
                  'en-IN'
                )}
              </strong>

            </div>

          </div>

          {error && (
            <div
              className="formError"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="reviewActions">

            <button
              type="button"
              className="secondaryBtn"
              onClick={handleEdit}
            >
              ← Edit details
            </button>

            <button
              data-cursor="open"
              type="button"
              className="primaryBtn"
              onClick={handlePayment}
            >
              Pay booking fee →
            </button>

          </div>

          <small>
            Your booking details have been
            securely submitted for review.
          </small>

        </section>

      </main>
    );
  }

  /*
   * ======================================================
   * STEP 1 — BOOKING DETAILS
   * ======================================================
   */

  return (
    <main className="page narrow">

      <div className="formIntro">

        <span className="kicker">
          INSTANT BOOK
        </span>

        <h1>
          {venueName}
        </h1>

        <p>
          Enter your celebration details
          to review your booking.
        </p>

      </div>

      <div className="bookingProgress">

        <div className="bookingProgressItem active">
          <span>1</span>
          <strong>Details</strong>
        </div>

        <div className="bookingProgressLine" />

        <div className="bookingProgressItem">
          <span>2</span>
          <strong>Review</strong>
        </div>

        <div className="bookingProgressLine" />

        <div className="bookingProgressItem">
          <span>3</span>
          <strong>Payment</strong>
        </div>

      </div>

      <form
        className="formCard"
        onSubmit={handleReview}
        noValidate
      >

        <div className="formSectionHeading">
          <span className="kicker">
            YOUR DETAILS
          </span>

          <h2>
            Tell us about you
          </h2>
        </div>

        <div className="two">

          <label>
            Full name{' '}
            <span className="requiredMark">
              *
            </span>

            <input
              required
              value={form.fullName}
              onChange={(e) =>
                update(
                  'fullName',
                  e.target.value
                )
              }
              placeholder="Your name"
              autoComplete="name"
            />
          </label>

          <label>
            Email address{' '}
            <span className="requiredMark">
              *
            </span>

            <input
              required
              type="email"
              value={form.email}
              onChange={(e) =>
                update(
                  'email',
                  e.target.value
                )
              }
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

        </div>

        <div className="two">

          <label>
            Mobile number{' '}
            <span className="requiredMark">
              *
            </span>

            <input
              required
              type="tel"
              value={form.mobile}
              onChange={(e) =>
                update(
                  'mobile',
                  e.target.value
                )
              }
              placeholder="+91 98765 43210"
              autoComplete="tel"
            />
          </label>

          <label>
            Event date{' '}
            <span className="requiredMark">
              *
            </span>

            <input
              required
              type="date"
              min={
                new Date()
                  .toISOString()
                  .split('T')[0]
              }
              value={form.eventDate}
              onChange={(e) =>
                update(
                  'eventDate',
                  e.target.value
                )
              }
            />
          </label>

        </div>

        <div className="formSectionHeading">
          <span className="kicker">
            EVENT DETAILS
          </span>

          <h2>
            Your celebration
          </h2>
        </div>

        <div className="two">

          <label>
            Event type{' '}
            <span className="requiredMark">
              *
            </span>

            <select
              required
              value={form.eventType}
              onChange={(e) =>
                update(
                  'eventType',
                  e.target.value
                )
              }
            >
              <option value="">
                Select event type
              </option>

              <option>
                Wedding
              </option>

              <option>
                Engagement
              </option>

              <option>
                Mehendi
              </option>

              <option>
                Sangeet
              </option>

              <option>
                Haldi
              </option>

              <option>
                Reception
              </option>

              <option>
                Corporate
              </option>

              <option>
                Other
              </option>

            </select>
          </label>

          <label>
            Guest count{' '}
            <span className="requiredMark">
              *
            </span>

            <select
              required
              value={form.guestCount}
              onChange={(e) =>
                update(
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

        </div>

        <label>
          Budget{' '}
          <span className="requiredMark">
            *
          </span>

          <select
            required
            value={form.budget}
            onChange={(e) =>
              update(
                'budget',
                e.target.value
              )
            }
          >
            <option value="">
              Select your budget
            </option>

            <option>
              ₹5L–₹8L
            </option>

            <option>
              ₹8L–₹15L
            </option>

            <option>
              ₹15L–₹25L
            </option>

            <option>
              ₹25L–₹50L
            </option>

            <option>
              ₹50L+
            </option>

          </select>
        </label>

        <label>
          Notes{' '}
          <span className="optionalMark">
            (optional)
          </span>

          <textarea
            value={form.notes}
            onChange={(e) =>
              update(
                'notes',
                e.target.value
              )
            }
            placeholder="Tell us about your celebration, stay requirements, preferred dates or questions…"
          />
        </label>

        {error && (
          <div
            className="formError"
            role="alert"
          >
            {error}
          </div>
        )}

        <button
          data-cursor="open"
          className="primaryBtn full"
          type="submit"
          disabled={reviewLoading}
        >
          {reviewLoading
            ? 'Preparing your review…'
            : 'Review booking →'}
        </button>

        <small>
          Your details will be securely
          submitted to The Venue Search
          when you continue.
        </small>

      </form>

    </main>
  );
}