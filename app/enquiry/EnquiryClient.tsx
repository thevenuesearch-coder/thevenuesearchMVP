'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';

import { createClient } from '../../lib/supabase-browser';
import { venues } from '../../lib/data';

type EnquiryClientProps = {
  venueId: string;
  spaceId: string;
};

type FormData = {
  fullName: string;
  email: string;
  mobile: string;
  eventDate: string;
  eventType: string;
  guestCount: string;
  budget: string;
  notes: string;
};

const initialForm: FormData = {
  fullName: '',
  email: '',
  mobile: '',
  eventDate: '',
  eventType: 'Wedding',
  guestCount: '',
  budget: '',
  notes: '',
};

export default function EnquiryClient({
  venueId,
  spaceId,
}: EnquiryClientProps) {
  const [form, setForm] = useState<FormData>(initialForm);

  const [submitting, setSubmitting] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  const [error, setError] = useState('');

  const venue = venues.find(
    (item) => item.id === venueId
  );

  const selectedSpace = venue?.venueSpaces?.find(
    (space) => space.id === spaceId
  );

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setForm((current) => ({
            ...current,
            email:
              session.user.email ||
              current.email,
          }));
        }
      } catch (error) {
        console.error(
          'Unable to load user:',
          error
        );
      }
    }

    loadUser();
  }, []);

  function updateField(
    field: keyof FormData,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError('');
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError('');

    if (!venue) {
      setError(
        'The selected venue could not be found.'
      );
      return;
    }

    if (!form.fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!form.email.trim()) {
      setError(
        'Please enter your email address.'
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      setError(
        'Please enter a valid email address.'
      );
      return;
    }

    if (!form.mobile.trim()) {
      setError(
        'Please enter your mobile number.'
      );
      return;
    }

    if (!form.eventDate) {
      setError(
        'Please select your event date.'
      );
      return;
    }

    if (!form.guestCount) {
      setError(
        'Please enter the number of guests.'
      );
      return;
    }

    if (!form.budget) {
      setError(
        'Please select your estimated budget.'
      );
      return;
    }

    setSubmitting(true);

    try {
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

            eventType:
              form.eventType,

            guestCount:
              form.guestCount,

            budget:
              form.budget,

            notes:
              form.notes.trim(),

            mode: 'enquiry',
          }),
        }
      );

      const result = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.error ||
            'Unable to submit your enquiry.'
        );
      }

      setSubmitted(true);

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      console.error(
        'Enquiry submission failed:',
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!venue) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f7f5f0',
          padding: '30px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p>Venue not found.</p>

          <Link href="/">
            ← Back to venues
          </Link>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="success-page">
        <div className="success-card">

          <div className="success-icon">
            ✓
          </div>

          <span className="eyebrow">
            ENQUIRY RECEIVED
          </span>

          <h1>
            Thank you,
            <br />
            {form.fullName
              .trim()
              .split(' ')[0]}
            .
          </h1>

          <p>
            Your enquiry for{' '}
            <strong>{venue.name}</strong>{' '}
            has been submitted successfully.
          </p>

          {selectedSpace && (
            <div className="selected-space">
              <span>SELECTED SPACE</span>
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
              Back to Venue
            </Link>

            <Link
              href="/"
              className="secondary-button"
            >
              Explore More Venues
            </Link>

          </div>
        </div>

        <style jsx>{`
          .success-page {
            min-height: 100vh;
            background: #f7f5f0;
            display: grid;
            place-items: center;
            padding: 30px;
          }

          .success-card {
            width: min(650px, 100%);
            background: #111;
            color: white;
            padding: 60px;
            text-align: center;
          }

          .success-icon {
            width: 60px;
            height: 60px;
            border: 1px solid #42d69a;
            border-radius: 50%;
            display: grid;
            place-items: center;
            margin: 0 auto 25px;
            color: #42d69a;
            font-size: 25px;
          }

          .eyebrow {
            color: #25b9d8;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: .18em;
          }

          h1 {
            font-family: Georgia, serif;
            font-size: 55px;
            line-height: 1;
            font-weight: 400;
            margin: 18px 0 25px;
          }

          .success-card > p {
            color: #aaa;
            line-height: 1.7;
          }

          .selected-space {
            margin: 28px 0;
            padding: 18px;
            border: 1px solid rgba(255,255,255,.15);
            text-align: left;
          }

          .selected-space span {
            display: block;
            color: #777;
            font-size: 9px;
            letter-spacing: .12em;
            margin-bottom: 7px;
          }

          .selected-space strong {
            color: white;
          }

          .success-note {
            max-width: 480px;
            margin: 20px auto;
          }

          .success-actions {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 30px;
          }

          .primary-button,
          .secondary-button {
            padding: 14px 20px;
            text-decoration: none;
            font-size: 12px;
            font-weight: 700;
          }

          .primary-button {
            color: white;
            background: linear-gradient(
              135deg,
              #2862d3,
              #20b8d1
            );
          }

          .secondary-button {
            color: white;
            border: 1px solid rgba(255,255,255,.25);
          }

          @media (max-width: 600px) {
            .success-card {
              padding: 40px 22px;
            }

            h1 {
              font-size: 45px;
            }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="page">

      <header className="header">

        <Link
          href="/"
          className="logo"
        >
          <span className="logo-mark">
            VS
          </span>

          <span>
            <strong>
              The Venue
            </strong>
            <b>
              Search.
            </b>
          </span>
        </Link>

        <Link
          href={`/venues/${venue.id}`}
          className="back-link"
        >
          ← Back to Venue
        </Link>

      </header>


      <section className="layout">

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
            Tell us about your event and
            our team will get back to you
            with the right next steps.
          </p>


          <div className="venue-card">

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


          <div className="process">

            <div>
              <span>01</span>
              <p>
                Share your event
                requirements.
              </p>
            </div>

            <div>
              <span>02</span>
              <p>
                Our team reviews
                your enquiry.
              </p>
            </div>

            <div>
              <span>03</span>
              <p>
                We contact you with
                the next step.
              </p>
            </div>

          </div>

        </div>


        <div className="form-container">

          <form
            className="form-card"
            onSubmit={handleSubmit}
          >

            <div className="form-title">

              <span className="eyebrow">
                YOUR DETAILS
              </span>

              <h2>
                Tell us about your event
              </h2>

              <p>
                Fields marked with * are required.
              </p>

            </div>


            <div className="field">

              <label>
                Full Name *
              </label>

              <input
                type="text"
                value={form.fullName}
                onChange={(e) =>
                  updateField(
                    'fullName',
                    e.target.value
                  )
                }
                placeholder="Enter your full name"
              />

            </div>


            <div className="grid">

              <div className="field">

                <label>
                  Email Address *
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    updateField(
                      'email',
                      e.target.value
                    )
                  }
                  placeholder="you@example.com"
                />

              </div>


              <div className="field">

                <label>
                  Mobile Number *
                </label>

                <input
                  type="tel"
                  value={form.mobile}
                  onChange={(e) =>
                    updateField(
                      'mobile',
                      e.target.value
                    )
                  }
                  placeholder="+91 XXXXX XXXXX"
                />

              </div>

            </div>


            <div className="grid">

              <div className="field">

                <label>
                  Event Date *
                </label>

                <input
                  type="date"
                  value={form.eventDate}
                  onChange={(e) =>
                    updateField(
                      'eventDate',
                      e.target.value
                    )
                  }
                />

              </div>


              <div className="field">

                <label>
                  Event Type *
                </label>

                <select
                  value={form.eventType}
                  onChange={(e) =>
                    updateField(
                      'eventType',
                      e.target.value
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


            <div className="grid">

              <div className="field">

                <label>
                  Number of Guests *
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.guestCount}
                  onChange={(e) =>
                    updateField(
                      'guestCount',
                      e.target.value
                    )
                  }
                  placeholder="e.g. 300"
                />

              </div>


              <div className="field">

                <label>
                  Estimated Budget *
                </label>

                <select
                  value={form.budget}
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


            <div className="field">

              <label>
                Additional Requirements
              </label>

              <textarea
                rows={5}
                value={form.notes}
                onChange={(e) =>
                  updateField(
                    'notes',
                    e.target.value
                  )
                }
                placeholder="Tell us anything else we should know about your event..."
              />

            </div>


            {error && (
              <div className="error">
                {error}
              </div>
            )}


            <button
              type="submit"
              className="submit"
              disabled={submitting}
            >

              {submitting ? (
                <>
                  <span className="loader" />
                  Sending Enquiry...
                </>
              ) : (
                <>
                  <span>
                    Submit Enquiry
                  </span>

                  <span>
                    →
                  </span>
                </>
              )}

            </button>


            <p className="secure">
              Your enquiry will be securely sent
              to The Venue Search team. We will
              contact you using the details provided.
            </p>

          </form>

        </div>

      </section>


      <style jsx>{`

        .page {
          min-height: 100vh;
          background: #f7f5f0;
          color: #151515;
        }

        .header {
          height: 82px;
          background: #101010;
          color: white;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 50px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
          text-decoration: none;
        }

        .logo-mark {
          width: 38px;
          height: 38px;
          border: 1px solid #444;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 11px;
          font-weight: 700;
        }

        .logo strong,
        .logo b {
          display: block;
          line-height: 1;
        }

        .logo strong {
          font-size: 14px;
        }

        .logo b {
          color: #24b8d5;
          font-size: 14px;
          margin-top: 4px;
        }

        .back-link {
          color: #aaa;
          text-decoration: none;
          font-size: 12px;
        }

        .back-link:hover {
          color: white;
        }

        .layout {
          width: min(
            1250px,
            calc(100% - 60px)
          );

          margin: auto;

          padding: 85px 0 100px;

          display: grid;

          grid-template-columns:
            .85fr 1fr;

          gap: 80px;

          align-items: start;
        }

        .intro {
          padding-top: 25px;
        }

        .eyebrow {
          color: #888;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .18em;
        }

        .intro h1 {
          font-family: Georgia, serif;
          font-weight: 400;
          font-size: clamp(50px, 5vw, 75px);
          line-height: .96;
          letter-spacing: -.045em;
          margin: 18px 0 28px;
        }

        .intro-text {
          max-width: 500px;
          color: #69655f;
          font-size: 17px;
          line-height: 1.75;
        }

        .venue-card {
          margin-top: 42px;

          background: white;

          border: 1px solid #dedbd4;

          padding: 14px;

          display: flex;

          gap: 15px;

          align-items: center;
        }

        .venue-card img {
          width: 90px;
          height: 80px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .venue-card span,
        .venue-card strong,
        .venue-card small {
          display: block;
        }

        .venue-card span {
          font-size: 9px;
          color: #999;
          letter-spacing: .12em;
          margin-bottom: 5px;
        }

        .venue-card strong {
          font-family: Georgia, serif;
          font-size: 19px;
          font-weight: 400;
          margin-bottom: 5px;
        }

        .venue-card small {
          color: #777;
          font-size: 10px;
          margin-top: 3px;
        }

        .process {
          margin-top: 55px;
          border-top: 1px solid #dedbd4;
        }

        .process > div {
          display: grid;
          grid-template-columns: 45px 1fr;
          gap: 10px;
          padding: 18px 0;
          border-bottom: 1px solid #dedbd4;
        }

        .process span {
          color: #aaa;
          font-size: 10px;
        }

        .process p {
          margin: 0;
          color: #555;
          font-size: 13px;
        }

        .form-card {
          background: #111;
          color: white;
          padding: 42px;
          box-shadow:
            0 30px 80px
            rgba(0,0,0,.15);
        }

        .form-title {
          margin-bottom: 34px;
        }

        .form-title .eyebrow {
          color: #26b9d7;
        }

        .form-title h2 {
          font-family: Georgia, serif;
          font-weight: 400;
          font-size: 37px;
          line-height: 1.05;
          margin: 12px 0;
        }

        .form-title p {
          color: #777;
          font-size: 11px;
          margin: 0;
        }

        .field {
          margin-bottom: 19px;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .field label {
          display: block;
          color: #999;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .field input,
        .field select,
        .field textarea {
          width: 100%;
          box-sizing: border-box;

          background: #191919;

          border: 1px solid #383838;

          color: white;

          padding: 15px;

          border-radius: 3px;

          outline: none;

          font-family: inherit;
          font-size: 13px;
        }

        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          border-color: #27b9d7;
        }

        .field input::placeholder,
        .field textarea::placeholder {
          color: #666;
        }

        .field select option {
          background: white;
          color: #111;
        }

        .field textarea {
          resize: vertical;
          min-height: 120px;
        }

        .error {
          background: rgba(255,70,70,.08);
          border: 1px solid rgba(255,70,70,.3);
          color: #ff9b9b;
          padding: 13px;
          font-size: 11px;
          line-height: 1.5;
          margin-bottom: 18px;
        }

        .submit {
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

          font-size: 14px;

          font-weight: 700;

          cursor: pointer;

          border-radius: 3px;
        }

        .submit:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .loader {
          width: 18px;
          height: 18px;

          border: 2px solid rgba(255,255,255,.3);

          border-top-color: white;

          border-radius: 50%;

          animation: spin .8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .secure {
          text-align: center;
          color: #62605b;
          font-size: 9px;
          line-height: 1.6;
          margin: 17px 0 0;
        }

        @media (max-width: 900px) {
          .layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .header {
            height: 70px;
            padding: 0 18px;
          }

          .layout {
            width: calc(100% - 32px);
            padding: 45px 0 70px;
          }

          .grid {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .form-card {
            padding: 28px 20px;
          }

          .intro h1 {
            font-size: 52px;
          }

          .form-title h2 {
            font-size: 31px;
          }

          .venue-card img {
            width: 75px;
            height: 70px;
          }
        }

      `}</style>

    </main>
  );
}