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
import {
  RoomQuantitySelector,
  type RoomSelection,
} from '../../components/RoomQuantitySelector';

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
   ROOM BOOKING DETAILS
============================================================ */

type NightlyRoomSelection = {
  /* ISO date (yyyy-mm-dd) of the night's start -- e.g. '2026-09-23'
     for the night of 23 Sep -> 24 Sep. */
  date: string;
  selections: RoomSelection[];
};

type RoomBookingDetails = {
  checkInDate: string;
  checkOutDate: string;
  numRooms: string;
  nightlySelections: NightlyRoomSelection[];
  guestDetails: string;
  notes: string;
};

/*
 * Kept as a quick overall estimate alongside the per-night,
 * per-category RoomQuantitySelector below, per product direction.
 */
const ROOM_COUNT_OPTIONS = [
  'Less than 10',
  '11', '12', '13', '14', '15',
  '16', '17', '18', '19', '20',
  'More than 20',
];

/*
 * Turns a check-in/check-out date pair into one entry per night
 * stayed. Check-in is the first night; check-out is the morning
 * the guest leaves and is not itself a night -- so 23rd -> 26th is
 * 3 nights (23->24, 24->25, 25->26), never 4.
 */
function computeNights(
  checkInDate: string,
  checkOutDate: string
): { start: string; end: string }[] {
  if (!checkInDate || !checkOutDate) return [];

  /*
   * Parse and format the dates as plain y/m/d values via
   * Date.UTC, rather than mixing a locally-constructed Date with
   * toISOString() (which reads back in UTC) -- that mismatch is
   * what previously shifted every night a day earlier for anyone
   * west of UTC... no, ahead of UTC (e.g. IST). Staying in UTC
   * for both construction and formatting sidesteps the browser's
   * timezone entirely, so the dates typed into the check-in/
   * check-out fields are exactly the dates that come back out.
   */
  const parseAsUTC = (value: string) => {
    const [y, m, d] = value.split('-').map(Number);
    return Date.UTC(y, (m || 1) - 1, d || 1);
  };

  const formatFromUTC = (ms: number) =>
    new Date(ms).toISOString().slice(0, 10);

  const start = parseAsUTC(checkInDate);
  const end = parseAsUTC(checkOutDate);

  if (
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    end <= start
  ) {
    return [];
  }

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const nights: { start: string; end: string }[] = [];
  let cursor = start;

  while (cursor < end) {
    const next = cursor + ONE_DAY_MS;

    nights.push({
      start: formatFromUTC(cursor),
      end: formatFromUTC(next),
    });

    cursor = next;
  }

  return nights;
}

function createEmptyRoomDetails(): RoomBookingDetails {
  return {
    checkInDate: '',
    checkOutDate: '',
    numRooms: '',
    nightlySelections: [],
    guestDetails: '',
    notes: '',
  };
}

type BookingType = 'venue' | 'room' | 'venue_room';

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
     BOOKING TYPE (Venue / Room / Venue + Room)
  ========================================================== */

  const [bookingType, setBookingType] =
    useState<BookingType>('venue');

  const [roomDetails, setRoomDetails] =
    useState<RoomBookingDetails>(
      createEmptyRoomDetails()
    );

  const [bookingReference, setBookingReference] =
    useState('');

  const includesVenue =
    bookingType === 'venue' ||
    bookingType === 'venue_room';

  const includesRoom =
    bookingType === 'room' ||
    bookingType === 'venue_room';

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
    setRoomDetails((current) => ({
      ...current,
      nightlySelections: current.nightlySelections.map(
        (night) =>
          night.date === nightDate
            ? { ...night, selections }
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
    setRoomDetails((current) => ({
      ...current,
      nightlySelections: current.nightlySelections.map(
        (night) => ({ ...night, selections })
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
       NUMBER OF EVENTS (venue booking only)
    -------------------------------------------------------- */

    if (includesVenue) {
      if (!form.numberOfEvents) {
        setError(
          'Please select the number of events.'
        );

        return;
      }

      /* ------------------------------------------------------
         EVENT ARRAY
      ------------------------------------------------------ */

      if (
        form.events.length !==
        Number(form.numberOfEvents)
      ) {
        setError(
          'Please select the number of events again.'
        );

        return;
      }

      /* ------------------------------------------------------
         VALIDATE EVERY EVENT
      ------------------------------------------------------ */

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
    }

    /* --------------------------------------------------------
       ROOM DETAILS (room booking only)
    -------------------------------------------------------- */

    if (includesRoom) {
      if (!roomDetails.checkInDate) {
        setError(
          'Please select a check-in date.'
        );
        return;
      }

      if (!roomDetails.checkOutDate) {
        setError(
          'Please select a check-out date.'
        );
        return;
      }

      if (
        roomDetails.checkOutDate <=
        roomDetails.checkInDate
      ) {
        setError(
          'Check-out date must be after the check-in date.'
        );
        return;
      }

      if (!roomDetails.numRooms) {
        setError(
          'Please select the number of rooms.'
        );
        return;
      }

      if (
        (venue?.rooms?.length || 0) > 0 &&
        roomDetails.nightlySelections.some(
          (night) => night.selections.length === 0
        )
      ) {
        setError(
          'Please select at least one room category for every night of the stay.'
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
              numRooms:
                includesRoom
                  ? roomDetails.numRooms
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

  function formatShortDate(date: string) {
    if (!date) return '';

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
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

                )}

                {/* =================================================
                    ROOM DETAILS (room booking)
                ================================================= */}

                {(bookingType === 'room' ||
                  bookingType === 'venue_room') && (

                  <div className="formSection">

                    <span className="kicker">
                      ROOM DETAILS
                    </span>

                    <h2>
                      Plan your stay
                    </h2>

                    <div className="formGrid">

                      {/* CHECK-IN DATE */}

                      <label>
                        <span>
                          Check-in date *
                        </span>
                        <input
                          type="date"
                          value={
                            roomDetails.checkInDate
                          }
                          onChange={(e) =>
                            updateRoomField(
                              'checkInDate',
                              e.target.value
                            )
                          }
                        />
                      </label>

                      {/* CHECK-OUT DATE */}

                      <label>
                        <span>
                          Check-out date *
                        </span>
                        <input
                          type="date"
                          value={
                            roomDetails.checkOutDate
                          }
                          onChange={(e) =>
                            updateRoomField(
                              'checkOutDate',
                              e.target.value
                            )
                          }
                        />
                      </label>

                      {/* NUMBER OF ROOMS */}

                      <label>
                        <span>
                          Number of rooms *
                        </span>
                        <select
                          value={
                            roomDetails.numRooms
                          }
                          onChange={(e) =>
                            updateRoomField(
                              'numRooms',
                              e.target.value
                            )
                          }
                        >
                          <option value="">
                            Select
                          </option>
                          {ROOM_COUNT_OPTIONS.map((n) => (
                            <option
                              key={n}
                              value={n}
                            >
                              {n}
                            </option>
                          ))}
                        </select>
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

                )}

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
                    Review Booking →
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

                      <div>
                        <span>Number of rooms</span>
                        <strong>
                          {roomDetails.numRooms}
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
                                            `${s.roomName} — ${s.quantity}`
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
                      : 'Proceed to Pay →'}

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