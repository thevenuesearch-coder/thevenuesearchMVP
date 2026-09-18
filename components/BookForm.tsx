'use client';

import { FormEvent, useState } from 'react';

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

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState('');

  function update(
    field: keyof FormState,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError('');
  }

  function validateForm() {
    if (!form.fullName.trim())
      return 'Please enter your full name.';

    if (!form.email.trim())
      return 'Please enter your email address.';

    if (!form.mobile.trim())
      return 'Please enter your mobile number.';

    if (!form.eventDate)
      return 'Please select your event date.';

    if (!form.eventType)
      return 'Please select your event type.';

    if (!form.guestCount)
      return 'Please select your guest count.';

    if (!form.budget)
      return 'Please select your wedding budget.';

    return '';
  }

  /*
   * ============================================
   * SEND EMAIL
   * ============================================
   */

  async function sendBookingEmail(
    stage: 'review' | 'payment'
  ) {
    const response = await fetch(
      '/api/booking-payment',
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

          fullName: form.fullName,
          email: form.email,
          mobile: form.mobile,

          eventDate: form.eventDate,
          eventType: form.eventType,
          guestCount: form.guestCount,
          budget: form.budget,
          notes: form.notes,

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
   * ============================================
   * REVIEW BOOKING
   * ============================================
   */

  async function handleReviewBooking(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError('');

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      /*
       * IMPORTANT:
       * Email is sent when Review Booking
       * is clicked.
       */

      await sendBookingEmail('review');

      /*
       * Only show review screen after
       * the email has successfully been
       * accepted by the email API.
       */

      setStep(2);

    } catch (error) {
      console.error(
        'Review email error:',
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to send booking details.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * ============================================
   * PROCEED TO PAYMENT
   * ============================================
   */

  async function handlePayment() {
    setSubmitting(true);
    setError('');

    try {
      /*
       * Send the booking details AGAIN
       * when the user proceeds to payment.
       */

      const result =
        await sendBookingEmail(
          'payment'
        );

      console.log(
        'Payment-stage booking email sent:',
        result
      );

      /*
       * ========================================
       * RAZORPAY WILL START HERE
       * ========================================
       *
       * Do NOT put the Resend API key here.
       *
       * The next step is:
       *
       * create Razorpay order
       *      ↓
       * open Razorpay Checkout
       *      ↓
       * verify payment
       *      ↓
       * confirm booking
       */

      alert(
        'Booking details sent to the admin successfully. Razorpay payment will open here.'
      );

    } catch (error) {
      console.error(
        'Payment email error:',
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to send booking details.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * ============================================
   * STEP 1
   * ============================================
   */

  if (step === 1) {
    return (
      <form
        className="bookingForm"
        onSubmit={
          handleReviewBooking
        }
      >

        <div className="bookingProgress">

          <div className="bookingProgressItem active">
            <span>1</span>
            <strong>
              Booking details
            </strong>
          </div>

          <div className="bookingProgressLine" />

          <div className="bookingProgressItem">
            <span>2</span>
            <strong>
              Review & payment
            </strong>
          </div>

        </div>

        <div className="formSectionHeading">

          <span className="kicker">
            INSTANT BOOK
          </span>

          <h2>
            Tell us about your event
          </h2>

          <p>
            Enter your details below to
            continue with your venue
            booking.
          </p>

        </div>

        <div className="formField">
          <label htmlFor="fullName">
            Full name *
          </label>

          <input
            id="fullName"
            type="text"
            value={form.fullName}
            onChange={(e) =>
              update(
                'fullName',
                e.target.value
              )
            }
            placeholder="Enter your full name"
          />
        </div>

        <div className="formField">
          <label htmlFor="email">
            Email address *
          </label>

          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) =>
              update(
                'email',
                e.target.value
              )
            }
            placeholder="you@example.com"
          />
        </div>

        <div className="formField">
          <label htmlFor="mobile">
            Mobile number *
          </label>

          <input
            id="mobile"
            type="tel"
            value={form.mobile}
            onChange={(e) =>
              update(
                'mobile',
                e.target.value
              )
            }
            placeholder="Enter your mobile number"
          />
        </div>

        <div className="formField">
          <label htmlFor="eventDate">
            Event date *
          </label>

          <input
            id="eventDate"
            type="date"
            value={form.eventDate}
            onChange={(e) =>
              update(
                'eventDate',
                e.target.value
              )
            }
          />
        </div>

        <div className="formField">
          <label htmlFor="eventType">
            Event type *
          </label>

          <select
            id="eventType"
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

            <option value="Wedding">
              Wedding
            </option>

            <option value="Reception">
              Reception
            </option>

            <option value="Engagement">
              Engagement
            </option>

            <option value="Sangeet">
              Sangeet
            </option>

            <option value="Haldi">
              Haldi
            </option>

            <option value="Mehendi">
              Mehendi
            </option>

            <option value="Corporate Event">
              Corporate Event
            </option>

            <option value="Other">
              Other
            </option>
          </select>
        </div>

        <div className="formField">
          <label htmlFor="guestCount">
            Guest count *
          </label>

          <select
            id="guestCount"
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

            <option value="Below 50">
              Below 50
            </option>

            <option value="50–100">
              50–100
            </option>

            <option value="100–200">
              100–200
            </option>

            <option value="200–500">
              200–500
            </option>

            <option value="500–1000">
              500–1000
            </option>

            <option value="1000+">
              1000+
            </option>
          </select>
        </div>

        <div className="formField">
          <label htmlFor="budget">
            Wedding budget *
          </label>

          <select
            id="budget"
            value={form.budget}
            onChange={(e) =>
              update(
                'budget',
                e.target.value
              )
            }
          >
            <option value="">
              Select budget
            </option>

            <option value="Below ₹25L">
              Below ₹25L
            </option>

            <option value="₹25L–₹50L">
              ₹25L–₹50L
            </option>

            <option value="₹50L–₹75L">
              ₹50L–₹75L
            </option>

            <option value="₹75L+">
              ₹75L+
            </option>
          </select>
        </div>

        <div className="formField">
          <label htmlFor="notes">
            Notes
            <span className="optional">
              Optional
            </span>
          </label>

          <textarea
            id="notes"
            value={form.notes}
            onChange={(e) =>
              update(
                'notes',
                e.target.value
              )
            }
            placeholder="Tell us anything else about your event..."
            rows={5}
          />
        </div>

        {error && (
          <div className="bookingError">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="primaryBtn bookingSubmitBtn"
          disabled={submitting}
        >
          {submitting
            ? 'Sending details...'
            : 'Review booking →'}
        </button>

      </form>
    );
  }

  /*
   * ============================================
   * STEP 2
   * ============================================
   */

  return (
    <div className="bookingForm">

      <div className="bookingProgress">

        <div className="bookingProgressItem completed">
          <span>✓</span>
          <strong>
            Booking details
          </strong>
        </div>

        <div className="bookingProgressLine active" />

        <div className="bookingProgressItem active">
          <span>2</span>
          <strong>
            Review & payment
          </strong>
        </div>

      </div>

      <div className="formSectionHeading">

        <span className="kicker">
          REVIEW BOOKING
        </span>

        <h2>
          Review your details
        </h2>

        <p>
          Please check everything carefully
          before proceeding to payment.
        </p>

      </div>

      <div className="reviewCard">

        <div className="reviewHeader">

          <div>

            <span className="kicker">
              VENUE
            </span>

            <h3>
              {venueName}
            </h3>

          </div>

        </div>

        <div className="reviewRows">

          <div className="reviewRow">
            <span>Venue</span>
            <strong>
              {venueName}
            </strong>
          </div>

          <div className="reviewRow">
            <span>Venue ID</span>
            <strong>
              {venueId}
            </strong>
          </div>

          <div className="reviewRow">
            <span>Guest</span>
            <strong>
              {form.fullName}
            </strong>
          </div>

          <div className="reviewRow">
            <span>Email</span>
            <strong>
              {form.email}
            </strong>
          </div>

          <div className="reviewRow">
            <span>Mobile</span>
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
            <span>Guests</span>
            <strong>
              {form.guestCount}
            </strong>
          </div>

          <div className="reviewRow">
            <span>Wedding budget</span>
            <strong>
              {form.budget}
            </strong>
          </div>

          <div className="reviewRow">
            <span>Notes</span>
            <strong className="reviewNotes">
              {form.notes ||
                'No notes provided.'}
            </strong>
          </div>

        </div>

      </div>

      <div className="bookingPaymentBox">

        <div className="bookingPaymentTop">

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

        <p>
          This is the current development
          booking amount. The final amount
          will be connected to the venue
          booking configuration before
          Razorpay goes live.
        </p>

      </div>

      {error && (
        <div className="bookingError">
          {error}
        </div>
      )}

      <div className="reviewActions">

        <button
          type="button"
          className="secondaryBtn"
          disabled={submitting}
          onClick={() => {
            setStep(1);
            setError('');
          }}
        >
          ← Edit details
        </button>

        <button
          type="button"
          className="primaryBtn"
          disabled={submitting}
          onClick={handlePayment}
        >
          {submitting
            ? 'Sending details...'
            : 'Proceed to payment →'}
        </button>

      </div>

    </div>
  );
}