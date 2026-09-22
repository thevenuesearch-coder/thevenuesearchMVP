import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';
import { parseGuestCount } from '../../../../lib/parse-guest-count';

/*
 * Single source of truth for the booking fee, shared with the
 * client (app/book/page.tsx reads the same NEXT_PUBLIC_ var) so
 * the amount shown to the customer always matches what gets
 * charged. This is a flat booking-confirmation fee -- not real
 * venue or room pricing, which isn't available from a verified
 * source -- exactly like the original instant-book design.
 */
const BOOKING_AMOUNT =
  Number(process.env.NEXT_PUBLIC_BOOKING_FEE_INR) || 25000;

/*
 * Bookings that already occupy a date for this venue.
 */
const BLOCKING_STATUSES = [
  'held',
  'payment_pending',
  'under_review',
  'confirmed',
];

type IncomingEvent = {
  venueSpace?: string;
  venueSpaceName?: string;
  eventDate?: string;
  eventType?: string;
  guestCount?: string;
  notes?: string;
};

function buildVenueBookingNotes(event: IncomingEvent) {
  const metadata = {
    venueSpaceId: event.venueSpace || null,
    venueSpaceName: event.venueSpaceName || event.venueSpace || null,
    notes: event.notes || null,
  };

  return `TVS_BOOKING_META:${JSON.stringify(metadata)}`;
}

type BookingType = 'venue' | 'room' | 'venue_room';

export async function POST(request: Request) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error(
        'Razorpay environment variables are missing.'
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'Razorpay environment variables are missing. Check .env.local.',
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const {
      venueId,
      venueName,
      venueCity,
      userId,
      fullName,
      email,
      mobile,
      events,
    } = body;

    const bookingType: BookingType =
      body.bookingType === 'room' ||
      body.bookingType === 'venue_room'
        ? body.bookingType
        : 'venue';

    const includesVenue =
      bookingType === 'venue' ||
      bookingType === 'venue_room';

    const includesRoom =
      bookingType === 'room' ||
      bookingType === 'venue_room';

    const {
      checkinDate,
      checkoutDate,
      numRooms,
      roomGuestCount,
      roomType,
      guestDetails,
      roomNotes,
    } = body;

    /*
     * ==========================================================
     * VALIDATE
     * ==========================================================
     */

    if (
      !venueId ||
      !venueName ||
      !fullName ||
      !email ||
      !mobile ||
      !userId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Required booking information is missing.',
        },
        { status: 400 }
      );
    }

    const eventList: IncomingEvent[] = Array.isArray(events)
      ? events
      : [];

    if (includesVenue) {
      if (eventList.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'At least one event is required.',
          },
          { status: 400 }
        );
      }

      for (const event of eventList) {
        if (
          !event.eventDate ||
          !event.eventType ||
          !event.guestCount
        ) {
          return NextResponse.json(
            {
              success: false,
              error:
                'Required event information is missing.',
            },
            { status: 400 }
          );
        }
      }
    }

    if (includesRoom) {
      if (
        !checkinDate ||
        !checkoutDate ||
        !numRooms ||
        !roomGuestCount
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Required room booking information is missing.',
          },
          { status: 400 }
        );
      }

      if (checkoutDate <= checkinDate) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Check-out date must be after the check-in date.',
          },
          { status: 400 }
        );
      }
    }

    /*
     * ==========================================================
     * SUPABASE (service role -- writing payment_pending rows
     * and reading other users' bookings for the availability
     * check both require bypassing RLS)
     * ==========================================================
     */

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      console.error(
        'SUPABASE_SERVICE_ROLE_KEY is missing.'
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'Booking service is not fully configured. Please contact support.',
        },
        { status: 500 }
      );
    }

    const admin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    /*
     * ==========================================================
     * AVAILABILITY PRE-CHECK (venue event dates only -- a hotel
     * has many rooms, so room bookings have no single-date
     * scarcity to check against here)
     * ==========================================================
     */

    if (includesVenue) {
      const eventDates = Array.from(
        new Set(eventList.map((e) => e.eventDate))
      );

      const { data: conflicts, error: conflictError } =
        await admin
          .from('booking_requests')
          .select('event_date, status')
          .eq('venue_id', venueId)
          .in('event_date', eventDates)
          .in('status', BLOCKING_STATUSES);

      if (conflictError) {
        console.error(
          'Availability check failed:',
          conflictError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              'Unable to confirm availability right now. Please try again.',
          },
          { status: 500 }
        );
      }

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              'One of the selected dates is no longer available for this venue. Please choose a different date.',
          },
          { status: 409 }
        );
      }
    }

    /*
     * ==========================================================
     * CREATE RAZORPAY ORDER
     * ==========================================================
     */

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount: BOOKING_AMOUNT * 100,
      currency: 'INR',
      receipt: `TVS_${Date.now()}`,
      notes: {
        venue_id: String(venueId),
        venue_name: String(venueName),
        booking_type: bookingType,
        customer_name: String(fullName),
        customer_email: String(email),
        customer_mobile: String(mobile),
      },
    });

    /*
     * ==========================================================
     * CREATE THE BOOKING AS 'payment_pending'
     *
     * Writing this now -- before payment actually happens --
     * is what lets us show a real Pending state and reserves
     * the venue date(s) at the database level (the existing
     * unique index already blocks a second payment_pending/
     * confirmed row for the same venue+date). If the customer
     * never completes payment, a scheduled job expires this
     * row after 45 minutes so it stops blocking the date.
     * ==========================================================
     */

    const { data: wedding, error: weddingError } =
      await admin
        .from('weddings')
        .insert({
          owner_id: userId,
          title: `${fullName}'s celebration at ${venueName}`,
          city: venueCity || 'Hyderabad',
        })
        .select('id')
        .single();

    if (weddingError || !wedding) {
      console.error(
        'Failed to create wedding record:',
        weddingError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'Unable to start this booking. Please try again.',
        },
        { status: 500 }
      );
    }

    const bookingRows: Record<string, unknown>[] = [];

    if (includesVenue) {
      for (const event of eventList) {
        bookingRows.push({
          wedding_id: wedding.id,
          venue_id: venueId,
          user_id: userId,
          booking_type: bookingType,
          event_date: event.eventDate,
          guest_count: parseGuestCount(event.guestCount),
          event_type: event.eventType || null,
          mode: 'instant_book',
          notes: buildVenueBookingNotes(event),
          status: 'payment_pending',
          payment_order_id: order.id,
        });
      }
    }

    if (includesRoom) {
      bookingRows.push({
        wedding_id: wedding.id,
        venue_id: venueId,
        user_id: userId,
        booking_type: bookingType,
        event_date: null,
        mode: 'instant_book',
        notes: roomNotes || null,
        status: 'payment_pending',
        payment_order_id: order.id,
        checkin_date: checkinDate,
        checkout_date: checkoutDate,
        num_rooms: parseGuestCount(String(numRooms)),
        room_guest_count: parseGuestCount(
          String(roomGuestCount)
        ),
        room_type: roomType || null,
        guest_details: guestDetails || null,
      });
    }

    const { data: bookings, error: bookingError } =
      await admin
        .from('booking_requests')
        .insert(bookingRows)
        .select('id');

    if (bookingError) {
      console.error(
        'Failed to create payment_pending booking rows (likely a date conflict):',
        bookingError,
        { bookingRows }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'One of the selected dates was just booked by someone else. Please choose a different date.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      weddingId: wedding.id,
      bookingIds: (bookings || []).map((b) => b.id),
    });
  } catch (error: any) {
    console.error(
      'RAZORPAY CREATE ORDER ERROR:',
      error
    );

    const razorpayError = error?.error || error;

    return NextResponse.json(
      {
        success: false,
        error:
          razorpayError?.description ||
          error?.description ||
          error?.message ||
          'Unable to create Razorpay order.',
        code: razorpayError?.code || error?.code || null,
      },
      { status: 500 }
    );
  }
}
