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

export default function BookForm({ venueName, venueId, mode }: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (error) setError('');
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const fullNameForConfirmation = form.fullName;
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId,
          venueName,
          mode,
          ...form,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to submit your enquiry.');

      setSubmittedName(fullNameForConfirmation);
      setSubmitted(true);
      setForm(initialForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit your enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page narrow">
      <div className="formIntro">
        <span className="kicker">
          {mode === 'hold' ? 'BOOKING ENQUIRY' : mode === 'proposal' ? 'GET A PROPOSAL' : 'VENUE ENQUIRY'}
        </span>
        <h1>{venueName}</h1>
        <p>Share your celebration details and our team will follow up with availability, pricing and next steps.</p>
      </div>

      <form className="formCard" onSubmit={handleSubmit} noValidate>
        <div className="two">
          <label>
            Full name <span className="requiredMark">*</span>
            <input required value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Your name" autoComplete="name" />
          </label>
          <label>
            Email address <span className="requiredMark">*</span>
            <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </label>
        </div>

        <div className="two">
          <label>
            Mobile number <span className="requiredMark">*</span>
            <input required type="tel" value={form.mobile} onChange={(e) => update('mobile', e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" />
          </label>
          <label>
            Event date <span className="requiredMark">*</span>
            <input required type="date" min={new Date().toISOString().split('T')[0]} value={form.eventDate} onChange={(e) => update('eventDate', e.target.value)} />
          </label>
        </div>

        <div className="two">
          <label>
            Event type <span className="requiredMark">*</span>
            <select required value={form.eventType} onChange={(e) => update('eventType', e.target.value)}>
              <option value="">Select event type</option>
              <option>Wedding</option>
              <option>Engagement</option>
              <option>Mehendi</option>
              <option>Sangeet</option>
              <option>Haldi</option>
              <option>Reception</option>
              <option>Corporate</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            Guest count <span className="requiredMark">*</span>
            <select required value={form.guestCount} onChange={(e) => update('guestCount', e.target.value)}>
              <option value="">Select guest count</option>
              <option value="50–100">50–100</option>
              <option value="100–200">100–200</option>
              <option value="200–400">200–400</option>
              <option value="400–600">400–600</option>
              <option value="600+">600+</option>
            </select>
          </label>
        </div>

        <label>
          Budget <span className="requiredMark">*</span>
          <select required value={form.budget} onChange={(e) => update('budget', e.target.value)}>
            <option value="">Select your budget</option>
            <option>₹5L–₹8L</option>
            <option>₹8L–₹15L</option>
            <option>₹15L–₹25L</option>
            <option>₹25L–₹50L</option>
            <option>₹50L+</option>
          </select>
        </label>

        <label>
          Notes <span className="optionalMark">(optional)</span>
          <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Tell us about your celebration, stay requirements, preferred dates or questions…" />
        </label>

        {error && <div className="formError" role="alert">{error}</div>}

        <button data-cursor="open" className="primaryBtn full" type="submit" disabled={submitting}>
          {submitting ? 'Submitting enquiry…' : 'Submit booking enquiry →'}
        </button>
        <small>We will review your requirements and contact you with the next available options.</small>
      </form>

      {submitted && (
        <div className="modalBackdrop" role="presentation">
          <div className="successModal" role="dialog" aria-modal="true" aria-labelledby="enquiry-success-title">
            <button className="modalClose" type="button" aria-label="Close" onClick={() => setSubmitted(false)}>×</button>
            <div className="successIcon">✓</div>
            <span className="kicker">ENQUIRY RECEIVED</span>
            <h2 id="enquiry-success-title">Booking enquiry submitted successfully.</h2>
            <p>Thank you, {submittedName || 'for your enquiry'}. Our Venue Search team has received your requirements and will get back to you shortly.</p>
            <button data-cursor="open" className="primaryBtn full" type="button" onClick={() => setSubmitted(false)}>Continue exploring →</button>
          </div>
        </div>
      )}
    </main>
  );
}
