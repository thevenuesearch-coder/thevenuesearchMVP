'use client';

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { createClient } from '../../lib/supabase-browser';
import { venues } from '../../lib/data';

type EnquiryForm = {
  fullName: string;
  email: string;
  mobile: string;
  eventDate: string;
  eventType: string;
  guestCount: string;
  budget: string;
  message: string;
};

const initialForm: EnquiryForm = {
  fullName: '',
  email: '',
  mobile: '',
  eventDate: '',
  eventType: 'Wedding',
  guestCount: '',
  budget: '',
  message: '',
};

function formatDate(date: string) {
  if (!date) return '';

  const [year, month, day] =
    date.split('-');

  if (!year || !month || !day) {
    return date;
  }

  return `${day}-${month}-${year}`;
}

export default function EnquiryPage() {
  const searchParams = useSearchParams();

  const venueId =
    searchParams.get('venue') || '';

  const spaceId =
    searchParams.get('space') || '';

  const venue = useMemo(() => {
    return venues.find(
      (item) => item.id === venueId
    );
  }, [venueId]);

  const selectedSpace = useMemo(() => {
    return venue?.venueSpaces?.find(
      (space) => space.id === spaceId
    );
  }, [venue, spaceId]);

  const [form, setForm] =
    useState<EnquiryForm>(initialForm);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [error, setError] =
    useState('');

  /*
   * ==========================================
   * LOAD LOGGED-IN USER
   * ==========================================
   */

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();

        const {
          data: { session },
        } =
          await supabase.auth.getSession();

        if (session?.user) {
          setForm((current) => ({
            ...current,

            email:
              session.user.email ||
              current.email,
          }));
        }
      } catch (err) {
        console.error(
          'Unable to load user:',
          err
        );
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  /*
   * ==========================================
   * UPDATE FORM FIELD
   * ==========================================
   */

  function updateField(
    field: keyof EnquiryForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError('');
  }

  /*
   * ==========================================
   * SUBMIT ENQUIRY
   * ==========================================
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
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
        'Please enter the number of guests.'
      );

      return;
    }

    /*
     * Budget
     */

    if (!form.budget) {
      setError(
        'Please select your estimated budget.'
      );

      return;
    }

    setSubmitting(true);

    try {
      /*
       * ========================================
       * IMPORTANT
       *
       * Enquiry uses /api/enquiry
       *
       * NOT /api/booking-payment
       *
       * This keeps enquiry completely separate
       * from booking/payment validation.
       * ========================================
       */

      const response = await fetch(
        '/api/enquiry',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            venueName: venue.name,

            venueId: venue.id,

            venueSpace:
              selectedSpace?.name || '',

            venueSpaceId:
              selectedSpace?.id || '',

            fullName:
              form.fullName.trim(),

            email:
              form.email.trim(),

            mobile:
              form.mobile.trim(),

            eventDate:
              form.eventDate,

            eventDateFormatted:
              formatDate(
                form.eventDate
              ),

            eventType:
              form.eventType,

            guestCount:
              form.guestCount,

            budget:
              form.budget,

            notes:
              form.message.trim(),
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Unable to submit your enquiry.'
        );
      }

      setSubmitted(true);

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (err) {
      console.error(
        'Enquiry submission error:',
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
   * ==========================================
   * LOADING
   * ==========================================
   */

  if (loading) {
    return (
      <main className="loading-page">
        <div className="loading-spinner" />

        <p>
          Loading...
        </p>

        <style jsx>{`
          .loading-page {
            min-height: 100vh;
            background: #f7f5f0;
            display: grid;
            place-items: center;
            align-content: center;
            gap: 14px;
            color: #222;
          }

          .loading-spinner {
            width: 35px;
            height: 35px;
            border-radius: 50%;
            border: 2px solid #ddd;
            border-top-color: #111;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    );
  }

  /*
   * ==========================================
   * VENUE NOT FOUND
   * ==========================================
   */

  if (!venue) {
    return (
      <main className="not-found">

        <div className="not-found-card">

          <span className="eyebrow">
            VENUE NOT FOUND
          </span>

          <h1>
            We couldn't find this venue.
          </h1>

          <p>
            Please return to the venue
            and try again.
          </p>

          <Link
            href="/"
            className="back-button"
          >
            ← Back to venues
          </Link>

        </div>

        <style jsx>{`
          .not-found {
            min-height: 100vh;
            background: #f7f5f0;
            display: grid;
            place-items: center;
            padding: 30px;
          }

          .not-found-card {
            max-width: 600px;
            text-align: center;
          }

          .eyebrow {
            color: #777;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.18em;
          }

          h1 {
            font-family: Georgia, serif;
            font-size: 48px;
            font-weight: 400;
            line-height: 1;
            margin: 18px 0;
          }

          p {
            color: #777;
            margin-bottom: 28px;
          }

          .back-button {
            display: inline-flex;
            padding: 14px 22px;
            background: #111;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
          }
        `}</style>

      </main>
    );
  }

  /*
   * ==========================================
   * SUCCESS SCREEN
   * ==========================================
   */

  if (submitted) {
    return (
      <main className="success-page">

        <div className="success-card">

          <div className="success-icon">
            ✓
          </div>

          <span className="success-eyebrow">
            ENQUIRY RECEIVED
          </span>

          <h1>
            Thank you,
            <br />
            {form.fullName.split(' ')[0]}.
          </h1>

          <p>
            Your enquiry for{' '}
            <strong>
              {venue.name}
            </strong>{' '}
            has been submitted successfully.
          </p>

          {selectedSpace && (
            <div className="success-space">

              <span>
                SELECTED SPACE
              </span>

              <strong>
                {selectedSpace.name}
              </strong>

            </div>
          )}

          <p className="success-note">
            Our Venue Search team will review
            your requirements and contact you
            using the details provided.
          </p>

          <div className="success-actions">

            <Link
              href={`/venues/${venue.id}`}
              className="primary-button"
            >
              Back to venue
            </Link>

            <Link
              href="/"
              className="secondary-button"
            >
              Explore more venues
            </Link>

          </div>

        </div>

        <style jsx>{`
          .success-page {
            min-height: 100vh;
            background:
              radial-gradient(
                circle at 50% 0%,
                rgba(38, 114, 218, 0.08),
                transparent 40%
              ),
              #f7f5f0;

            display: grid;
            place-items: center;
            padding: 40px 20px;
          }

          .success-card {
            width: min(650px, 100%);
            background: #111;
            color: white;
            padding: 60px;
            text-align: center;

            box-shadow:
              0 30px 80px
              rgba(0, 0, 0, 0.16);
          }

          .success-icon {
            width: 62px;
            height: 62px;
            border-radius: 50%;
            margin: 0 auto 25px;

            display: grid;
            place-items: center;

            background:
              rgba(73, 214, 153, 0.12);

            border:
              1px solid #48d69b;

            color: #62e0aa;
            font-size: 26px;
          }

          .success-eyebrow {
            color: #31bfdc;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.18em;
          }

          h1 {
            font-family: Georgia, serif;
            font-size: 58px;
            line-height: 0.98;
            font-weight: 400;
            letter-spacing: -0.04em;
            margin: 18px 0 25px;
          }

          .success-card > p {
            color: #aaa8a1;
            font-size: 15px;
            line-height: 1.7;
          }

          .success-card strong {
            color: white;
          }

          .success-space {
            margin: 28px 0;
            padding: 18px;

            border:
              1px solid
              rgba(255, 255, 255, 0.12);

            text-align: left;
          }

          .success-space span {
            display: block;
            color: #777;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-size: 9px;
            margin-bottom: 6px;
          }

          .success-space strong {
            font-size: 15px;
          }

          .success-note {
            max-width: 470px;
            margin: 25px auto 0;
          }

          .success-actions {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 32px;
            flex-wrap: wrap;
          }

          .primary-button,
          .secondary-button {
            padding: 14px 20px;
            text-decoration: none;
            font-size: 12px;
            font-weight: 700;
          }

          .primary-button {
            background:
              linear-gradient(
                135deg,
                #2862d3,
                #20b8d1
              );

            color: white;
          }

          .secondary-button {
            border:
              1px solid
              rgba(255, 255, 255, 0.25);

            color: white;
          }

          @media (max-width: 600px) {
            .success-card {
              padding: 40px 25px;
            }

            h1 {
              font-size: 45px;
            }
          }
        `}</style>

      </main>
    );
  }

  /*
   * ==========================================
   * MAIN ENQUIRY PAGE
   * ==========================================
   */

  return (
    <main className="page">

      {/* ========================================
          HEADER
      ========================================= */}

      <header className="header">

        <Link
          href="/"
          className="brand"
        >

          <div className="brand-mark">
            V
          </div>

          <div>

            <strong>
              The Venue
            </strong>

            <span>
              Search.
            </span>

          </div>

        </Link>

        <Link
          href={`/venues/${venue.id}`}
          className="back-link"
        >
          ← Back to venue
        </Link>

      </header>


      {/* ========================================
          CONTENT
      ========================================= */}

      <section className="enquiry-layout">

        {/* ======================================
            LEFT SIDE
        ======================================= */}

        <div className="intro">

          <span className="eyebrow">
            DROP AN ENQUIRY
          </span>

          <h1>
            Let's plan your
            <br />
            celebration.
          </h1>

          <p className="intro-text">
            Tell us a little about your event
            and our team will get back to you
            with the right next steps.
          </p>


          {/* VENUE SUMMARY */}

          <div className="venue-summary">

            <img
              src={
                selectedSpace?.image ||
                venue.image
              }
              alt={venue.name}
            />

            <div>

              <span>
                YOUR VENUE
              </span>

              <strong>
                {venue.name}
              </strong>

              <small>
                {venue.city},{' '}
                {venue.country}
              </small>

              {selectedSpace && (
                <small>
                  Selected space:{' '}
                  {selectedSpace.name}
                </small>
              )}

            </div>

          </div>


          {/* PROCESS */}

          <div className="info-list">

            <div>

              <span>
                01
              </span>

              <p>
                Share your event
                requirements.
              </p>

            </div>

            <div>

              <span>
                02
              </span>

              <p>
                Our team reviews
                your enquiry.
              </p>

            </div>

            <div>

              <span>
                03
              </span>

              <p>
                We contact you
                with the next step.
              </p>

            </div>

          </div>

        </div>


        {/* ======================================
            FORM
        ======================================= */}

        <div className="form-wrapper">

          <form
            className="form-card"
            onSubmit={handleSubmit}
          >

            <div className="form-heading">

              <span className="eyebrow">
                YOUR DETAILS
              </span>

              <h2>
                Tell us about your event
              </h2>

              <p>
                Fields marked with *
                are required.
              </p>

            </div>


            {/* NAME */}

            <div className="field">

              <label>
                Full name *
              </label>

              <input
                type="text"
                value={form.fullName}
                onChange={(event) =>
                  updateField(
                    'fullName',
                    event.target.value
                  )
                }
                placeholder="Enter your full name"
              />

            </div>


            {/* EMAIL + MOBILE */}

            <div className="field-grid">

              <div className="field">

                <label>
                  Email address *
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField(
                      'email',
                      event.target.value
                    )
                  }
                  placeholder="you@example.com"
                />

              </div>


              <div className="field">

                <label>
                  Mobile number *
                </label>

                <input
                  type="tel"
                  value={form.mobile}
                  onChange={(event) =>
                    updateField(
                      'mobile',
                      event.target.value
                    )
                  }
                  placeholder="+91 XXXXX XXXXX"
                />

              </div>

            </div>


            {/* DATE + EVENT TYPE */}

            <div className="field-grid">

              <div className="field">

                <label>
                  Event date *
                </label>

                <input
                  type="date"
                  value={form.eventDate}
                  onChange={(event) =>
                    updateField(
                      'eventDate',
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="field">

                <label>
                  Event type *
                </label>

                <select
                  value={form.eventType}
                  onChange={(event) =>
                    updateField(
                      'eventType',
                      event.target.value
                    )
                  }
                >

                  <option value="Wedding">
                    Wedding
                  </option>

                  <option value="Engagement">
                    Engagement
                  </option>

                  <option value="Reception">
                    Reception
                  </option>

                  <option value="Birthday">
                    Birthday
                  </option>

                  <option value="Corporate Event">
                    Corporate Event
                  </option>

                  <option value="Conference">
                    Conference
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>

            </div>


            {/* GUESTS + BUDGET */}

            <div className="field-grid">

              <div className="field">

                <label>
                  Number of guests *
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.guestCount}
                  onChange={(event) =>
                    updateField(
                      'guestCount',
                      event.target.value
                    )
                  }
                  placeholder="e.g. 300"
                />

              </div>


              <div className="field">

                <label>
                  Estimated budget *
                </label>

                <select
                  value={form.budget}
                  onChange={(event) =>
                    updateField(
                      'budget',
                      event.target.value
                    )
                  }
                >

                  <option value="">
                    Select budget
                  </option>

                  <option value="Under ₹5 Lakhs">
                    Under ₹5 Lakhs
                  </option>

                  <option value="₹5 Lakhs – ₹10 Lakhs">
                    ₹5 Lakhs – ₹10 Lakhs
                  </option>

                  <option value="₹10 Lakhs – ₹25 Lakhs">
                    ₹10 Lakhs – ₹25 Lakhs
                  </option>

                  <option value="₹25 Lakhs – ₹50 Lakhs">
                    ₹25 Lakhs – ₹50 Lakhs
                  </option>

                  <option value="₹50 Lakhs+">
                    ₹50 Lakhs+
                  </option>

                </select>

              </div>

            </div>


            {/* ADDITIONAL REQUIREMENTS */}

            <div className="field">

              <label>
                Additional requirements
              </label>

              <textarea
                value={form.message}
                onChange={(event) =>
                  updateField(
                    'message',
                    event.target.value
                  )
                }
                placeholder="Tell us anything else we should know about your event..."
                rows={5}
              />

            </div>


            {/* ERROR */}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}


            {/* SUBMIT BUTTON */}

            <button
              type="submit"
              className="submit-button"
              disabled={submitting}
            >

              {submitting ? (
                <>
                  <span className="button-loader" />

                  Sending enquiry...
                </>
              ) : (
                <>
                  Submit Enquiry

                  <span>
                    →
                  </span>
                </>
              )}

            </button>


            <p className="privacy-note">
              Your enquiry will be securely
              sent to The Venue Search team.
              We will contact you using the
              details provided.
            </p>

          </form>

        </div>

      </section>


      {/* ========================================
          STYLES
      ========================================= */}

      <style jsx>{`

        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          background: #f7f5f0;
          color: #151515;
        }


        /* ========================================
           HEADER
        ========================================= */

        .header {
          height: 82px;
          background: #101010;
          color: white;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 50px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;

          color: white;
          text-decoration: none;
        }

        .brand-mark {
          width: 40px;
          height: 40px;

          border-radius: 50%;

          border:
            1px solid
            rgba(255,255,255,0.3);

          display: grid;
          place-items: center;

          font-family: Georgia, serif;
        }

        .brand strong,
        .brand span {
          display: block;
          line-height: 1;
        }

        .brand strong {
          font-size: 15px;
        }

        .brand span {
          color: #31b9d8;
          font-size: 15px;
          font-weight: 700;
          margin-top: 3px;
        }

        .back-link {
          color: #bbb;
          text-decoration: none;
          font-size: 13px;

          transition:
            color 0.2s ease;
        }

        .back-link:hover {
          color: white;
        }


        /* ========================================
           MAIN LAYOUT
        ========================================= */

        .enquiry-layout {
          width: min(
            1250px,
            calc(100% - 60px)
          );

          margin: 0 auto;

          padding: 85px 0 110px;

          display: grid;

          grid-template-columns:
            minmax(0, 0.82fr)
            minmax(500px, 1fr);

          gap: 90px;

          align-items: start;
        }

        .intro {
          padding-top: 30px;
        }

        .eyebrow {
          color: #8b877f;

          font-size: 10px;

          font-weight: 800;

          letter-spacing:
            0.18em;
        }

        .intro h1 {
          font-family:
            Georgia,
            'Times New Roman',
            serif;

          font-size:
            clamp(
              50px,
              5vw,
              76px
            );

          font-weight: 400;

          line-height: 0.96;

          letter-spacing:
            -0.045em;

          margin:
            18px 0 28px;
        }

        .intro-text {
          color: #68645e;

          font-size: 17px;

          line-height: 1.8;

          max-width: 500px;
        }


        /* ========================================
           VENUE SUMMARY
        ========================================= */

        .venue-summary {
          margin-top: 42px;

          padding: 14px;

          background: #fff;

          border:
            1px solid #dedbd4;

          display: flex;

          gap: 15px;

          align-items: center;
        }

        .venue-summary img {
          width: 90px;
          height: 80px;

          object-fit: cover;

          flex-shrink: 0;
        }

        .venue-summary div {
          min-width: 0;
        }

        .venue-summary span,
        .venue-summary strong,
        .venue-summary small {
          display: block;
        }

        .venue-summary span {
          color: #999;

          font-size: 9px;

          letter-spacing:
            0.12em;

          margin-bottom: 5px;
        }

        .venue-summary strong {
          font-family: Georgia, serif;

          font-size: 19px;

          font-weight: 400;

          margin-bottom: 5px;
        }

        .venue-summary small {
          color: #777;

          font-size: 10px;

          margin-top: 3px;
        }


        /* ========================================
           PROCESS LIST
        ========================================= */

        .info-list {
          margin-top: 55px;

          border-top:
            1px solid #dedbd4;
        }

        .info-list > div {
          display: grid;

          grid-template-columns:
            40px 1fr;

          gap: 12px;

          padding: 18px 0;

          border-bottom:
            1px solid #dedbd4;
        }

        .info-list span {
          color: #aaa;

          font-size: 10px;

          letter-spacing:
            0.1em;
        }

        .info-list p {
          margin: 0;

          font-size: 13px;

          color: #555;
        }


        /* ========================================
           FORM
        ========================================= */

        .form-card {
          background: #111;

          color: white;

          padding: 42px;

          box-shadow:
            0 30px 80px
            rgba(0,0,0,0.14);
        }

        .form-heading {
          margin-bottom: 35px;
        }

        .form-heading .eyebrow {
          color: #2dbbd9;
        }

        .form-heading h2 {
          font-family:
            Georgia,
            serif;

          font-size: 37px;

          font-weight: 400;

          line-height: 1.05;

          margin:
            12px 0;
        }

        .form-heading p {
          color: #777;

          font-size: 11px;

          margin: 0;
        }


        /* ========================================
           FIELDS
        ========================================= */

        .field {
          margin-bottom: 20px;
        }

        .field-grid {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 14px;
        }

        .field label {
          display: block;

          color: #9b9891;

          font-size: 10px;

          font-weight: 700;

          text-transform:
            uppercase;

          letter-spacing:
            0.12em;

          margin-bottom: 8px;
        }

        .field input,
        .field select,
        .field textarea {
          width: 100%;

          border:
            1px solid
            rgba(255,255,255,0.16);

          background:
            rgba(
              255,
              255,
              255,
              0.035
            );

          color: white;

          padding: 15px;

          outline: none;

          font-family: inherit;

          font-size: 13px;

          border-radius: 3px;

          transition:
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          border-color:
            #28b9d8;

          background:
            rgba(
              255,
              255,
              255,
              0.06
            );
        }

        .field input::placeholder,
        .field textarea::placeholder {
          color: #5f5d58;
        }

        .field select {
          appearance: auto;
        }

        .field select option {
          color: #111;
          background: white;
        }

        .field textarea {
          resize: vertical;

          min-height: 120px;
        }


        /* ========================================
           ERROR
        ========================================= */

        .error-message {
          padding: 13px 15px;

          margin:
            4px 0 18px;

          background:
            rgba(
              255,
              77,
              77,
              0.08
            );

          border:
            1px solid
            rgba(
              255,
              77,
              77,
              0.25
            );

          color: #ff9999;

          font-size: 11px;

          line-height: 1.5;
        }


        /* ========================================
           SUBMIT
        ========================================= */

        .submit-button {
          width: 100%;

          min-height: 58px;

          border: 0;

          background:
            linear-gradient(
              135deg,
              #2860d2,
              #20b8d1
            );

          color: white;

          display: flex;

          align-items: center;

          justify-content: space-between;

          padding: 0 20px;

          font-family: inherit;

          font-size: 14px;

          font-weight: 700;

          cursor: pointer;

          border-radius: 3px;

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .submit-button:hover:not(:disabled) {
          transform:
            translateY(-2px);

          box-shadow:
            0 15px 30px
            rgba(
              32,
              184,
              209,
              0.22
            );
        }

        .submit-button:disabled {
          opacity: 0.65;

          cursor: not-allowed;
        }

        .button-loader {
          width: 18px;
          height: 18px;

          border-radius: 50%;

          border:
            2px solid
            rgba(
              255,
              255,
              255,
              0.35
            );

          border-top-color:
            white;

          animation:
            spin 0.8s
            linear
            infinite;
        }

        @keyframes spin {
          to {
            transform:
              rotate(360deg);
          }
        }

        .privacy-note {
          color: #62605b;

          font-size: 9px;

          line-height: 1.6;

          text-align: center;

          margin:
            17px 0 0;
        }


        /* ========================================
           MOBILE
        ========================================= */

        @media (max-width: 900px) {

          .enquiry-layout {
            grid-template-columns:
              1fr;

            gap: 50px;

            padding-top: 55px;
          }

          .intro {
            padding-top: 0;
          }

          .form-wrapper {
            max-width: 700px;

            width: 100%;
          }

        }


        @media (max-width: 600px) {

          .header {
            height: 70px;

            padding:
              0 18px;
          }

          .enquiry-layout {
            width:
              calc(100% - 32px);

            padding:
              45px 0 70px;
          }

          .intro h1 {
            font-size: 52px;
          }

          .intro-text {
            font-size: 15px;
          }

          .form-card {
            padding:
              27px 20px;
          }

          .form-heading h2 {
            font-size: 31px;
          }

          .field-grid {
            grid-template-columns:
              1fr;

            gap: 0;
          }

          .venue-summary {
            align-items:
              flex-start;
          }

          .venue-summary img {
            width: 75px;
            height: 70px;
          }

          .back-link {
            font-size: 11px;
          }

        }

      `}</style>

    </main>
  );
}