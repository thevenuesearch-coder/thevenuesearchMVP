import type { RoomSelection } from '../components/RoomQuantitySelector';

export type { RoomSelection };

/* ============================================================
   SHARED BOOKING TYPES
   Split out of the old single-page /book flow so /book,
   /book/rooms and /book/review can all use the same shapes.
============================================================ */

export type EventDetails = {
  eventDate: string;
  guestCount: string;
  venueSpace: string;
  eventType: string;
  mealTiming: string;
  mealCategory: string;
  notes: string;
};

export type NightlyRoomSelection = {
  /* ISO date (yyyy-mm-dd) of the night's start -- e.g. '2026-09-23'
     for the night of 23 Sep -> 24 Sep. */
  date: string;
  selections: RoomSelection[];
};

export type RoomBookingDetails = {
  checkInDate: string;
  checkOutDate: string;
  nightlySelections: NightlyRoomSelection[];
  guestDetails: string;
  notes: string;
};

export type BookingType = 'venue' | 'room' | 'venue_room';

export type BookingForm = {
  fullName: string;
  email: string;
  mobile: string;
  numberOfEvents: string;
  events: EventDetails[];
};

/*
 * Turns a check-in/check-out date pair into one entry per night
 * stayed. Check-in is the first night; check-out is the morning
 * the guest leaves and is not itself a night -- so 23rd -> 26th is
 * 3 nights (23->24, 24->25, 25->26), never 4.
 */
export function computeNights(
  checkInDate: string,
  checkOutDate: string
): { start: string; end: string }[] {
  if (!checkInDate || !checkOutDate) return [];

  /*
   * Parse and format the dates as plain y/m/d values via
   * Date.UTC, rather than mixing a locally-constructed Date with
   * toISOString() (which reads back in UTC) -- that mismatch
   * shifts every night a day earlier for anyone ahead of UTC
   * (e.g. IST). Staying in UTC for both construction and
   * formatting sidesteps the browser's timezone entirely, so the
   * dates typed into the check-in/check-out fields are exactly
   * the dates that come back out.
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

export function createEmptyEvent(): EventDetails {
  return {
    eventDate: '',
    guestCount: '',
    venueSpace: '',
    eventType: '',
    mealTiming: '',
    mealCategory: '',
    notes: '',
  };
}

export function createEmptyRoomDetails(): RoomBookingDetails {
  return {
    checkInDate: '',
    checkOutDate: '',
    nightlySelections: [],
    guestDetails: '',
    notes: '',
  };
}

export const initialBookingForm: BookingForm = {
  fullName: '',
  email: '',
  mobile: '',
  numberOfEvents: '',
  events: [],
};

/*
 * Single source of truth shared with the server (see
 * /api/razorpay/create-order), so what's displayed always matches
 * what Razorpay actually charges. This is the platform's flat
 * booking fee -- not a room price. Per-room pricing is
 * deliberately not shown anywhere in the booking flow, since
 * venue_rooms has no price column and nothing here should invent
 * one.
 */
export const BOOKING_FEE_INR =
  Number(process.env.NEXT_PUBLIC_BOOKING_FEE_INR) || 25000;

export function formatDate(date: string) {
  if (!date) return '';

  return new Date(`${date}T00:00:00`).toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );
}

export function formatShortDate(date: string) {
  if (!date) return '';

  return new Date(`${date}T00:00:00`).toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
    }
  );
}

/* ============================================================
   BOOKING DRAFT (cross-route persistence)

   /book, /book/rooms and /book/review are separate pages, so the
   guest's in-progress selections have to survive real navigation
   (not just React state) -- including a page refresh, which
   sessionStorage does for free. Scoped per venue+space so
   switching venues can't leak a stale draft from a different
   property into the new booking.
============================================================ */

export type BookingDraft = {
  bookingType: BookingType;
  form: BookingForm;
  roomDetails: RoomBookingDetails;
};

function draftKey(venueSlug: string, spaceSlug: string | null) {
  return `tvs_booking_draft:${venueSlug}:${spaceSlug || ''}`;
}

export function saveBookingDraft(
  venueSlug: string,
  spaceSlug: string | null,
  draft: BookingDraft
) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(
      draftKey(venueSlug, spaceSlug),
      JSON.stringify(draft)
    );
  } catch {
    // sessionStorage can throw in private-browsing modes with
    // storage disabled -- the draft simply won't survive
    // navigation in that case, which is a acceptable degradation
    // rather than something to surface as an error.
  }
}

export function loadBookingDraft(
  venueSlug: string,
  spaceSlug: string | null
): BookingDraft | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(
      draftKey(venueSlug, spaceSlug)
    );

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.bookingType ||
      !parsed.form ||
      !parsed.roomDetails
    ) {
      return null;
    }

    return parsed as BookingDraft;
  } catch {
    return null;
  }
}

export function clearBookingDraft(
  venueSlug: string,
  spaceSlug: string | null
) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem(
      draftKey(venueSlug, spaceSlug)
    );
  } catch {
    // See saveBookingDraft.
  }
}

/*
 * A draft is usable for the Rooms step only once the parts that
 * step needs are actually filled in -- if a venue booking's
 * events aren't done yet, or there's no draft at all (e.g. the
 * guest opened /book/rooms directly), send them back to /book
 * rather than showing a broken room-selection screen.
 */
export function draftHasRequiredEvents(
  draft: BookingDraft
): boolean {
  if (
    draft.bookingType !== 'venue' &&
    draft.bookingType !== 'venue_room'
  ) {
    return true;
  }

  return (
    draft.form.events.length > 0 &&
    draft.form.events.every(
      (event) =>
        event.eventType &&
        event.eventDate &&
        event.guestCount &&
        event.venueSpace &&
        event.mealTiming &&
        event.mealCategory
    ) &&
    Boolean(
      draft.form.fullName.trim() &&
      draft.form.email.trim() &&
      draft.form.mobile.trim()
    )
  );
}

export function draftHasRequiredRooms(
  draft: BookingDraft
): boolean {
  if (
    draft.bookingType !== 'room' &&
    draft.bookingType !== 'venue_room'
  ) {
    return true;
  }

  return Boolean(
    draft.roomDetails.checkInDate &&
    draft.roomDetails.checkOutDate &&
    draft.roomDetails.nightlySelections.length > 0
  );
}
