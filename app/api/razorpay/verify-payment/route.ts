import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { parseGuestCount } from '../../../../lib/parse-guest-count';

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || 'thevenuesearch@gmail.com';

type IncomingEvent = {
  venueSpace?: string;
  eventDate?: string;
  eventType?: string;
  guestCount?: string;
  notes?: string;
};

/*
 * ==============================================================
 * ADMIN ALERT — booking creation failed after payment succeeded
 *
 * This is the one scenario where money has moved but nothing
 * got recorded. It's rare (the pre-payment availability check
 * in create-order should catch most conflicts before charging),
 * but if it happens it needs a human immediately, not just a
 * server log. Best-effort: failure to send this email should
 * never mask the original error returned to the customer.
 * ==============================================================
 */
async function sendBookingFailureAlert(details: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  venueName: string;
  fullName: string;
  email: string;
  mobile: string;
  reason: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    'The Venue Search <onboarding@resend.dev>';

  if (!resendApiKey) {
    console.error(
      'Cannot send booking-failure alert — RESEND_API_KEY missing.'
    );
    return;
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [ADMIN_EMAIL],
        subject: `URGENT: Payment succeeded but booking failed — ${details.venueName}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px;">
            <h2 style="color:#b33;">A customer was charged but their booking could not be saved.</h2>
            <p>This needs manual follow-up — the customer's payment succeeded, but the booking record failed to create.</p>
            <table cellpadding="6">
              <tr><td><strong>Razorpay order ID</strong></td><td>${details.razorpayOrderId}</td></tr>
              <tr><td><strong>Razorpay payment ID</strong></td><td>${details.razorpayPaymentId}</td></tr>
              <tr><td><strong>Venue</strong></td><td>${details.venueName}</td></tr>
              <tr><td><strong>Customer</strong></td><td>${details.fullName}</td></tr>
              <tr><td><strong>Email</strong></td><td>${details.email}</td></tr>
              <tr><td><strong>Mobile</strong></td><td>${details.mobile}</td></tr>
              <tr><td><strong>Reason</strong></td><td>${details.reason}</td></tr>
            </table>
            <p>Check Razorpay for the payment and manually create the booking, or issue a refund if the date genuinely isn't available.</p>
          </div>
        `,
      }),
    });
  } catch (emailError) {
    console.error(
      'Failed to send booking-failure alert email:',
      emailError
    );
  }
}

export async function POST(request: Request) {
  try {
    const keySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Razorpay secret key is missing.',
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,

      venueId,
      venueName,
      venueCity,
      userId,
      mode,
      fullName,
      email,
      mobile,
      events,
    } = body;

    /*
     * Validate Razorpay response
     */
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Incomplete Razorpay payment response.',
        },
        { status: 400 }
      );
    }

    /*
     * Razorpay signature verification
     *
     * Signature is generated from:
     *
     * order_id + "|" + payment_id
     */
    const generatedSignature =
      crypto
        .createHmac(
          'sha256',
          keySecret
        )
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest('hex');

    /*
     * Compare signatures safely
     */
    const expectedBuffer =
      Buffer.from(
        generatedSignature,
        'utf8'
      );

    const receivedBuffer =
      Buffer.from(
        razorpay_signature,
        'utf8'
      );

    if (
      expectedBuffer.length !==
      receivedBuffer.length
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Payment signature verification failed.',
        },
        { status: 400 }
      );
    }

    const isValid =
      crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      );

    if (!isValid) {
      console.error(
        'Invalid Razorpay payment signature.'
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'Payment signature verification failed.',
        },
        { status: 400 }
      );
    }

    console.log(
      'Razorpay payment verified successfully:',
      {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      }
    );

    /*
     * ==========================================================
     * PAYMENT IS VALID — NOW CREATE THE BOOKING
     *
     * Everything below this point only confirms/records the
     * booking. The payment itself already succeeded, so any
     * failure from here on needs to surface loudly (see
     * sendBookingFailureAlert) rather than silently vanish.
     * ==========================================================
     */

    if (
      !venueId ||
      !userId ||
      !fullName ||
      !email ||
      !mobile ||
      !Array.isArray(events) ||
      events.length === 0
    ) {
      const reason =
        'Missing booking details in verify-payment request (venueId/userId/events).';

      console.error(reason, {
        venueId,
        userId,
        eventsCount: Array.isArray(events)
          ? events.length
          : 'not an array',
      });

      await sendBookingFailureAlert({
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        venueName: venueName || 'Unknown venue',
        fullName: fullName || 'Unknown',
        email: email || 'Unknown',
        mobile: mobile || 'Unknown',
        reason,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            'Payment succeeded, but booking details were incomplete. Our team has been notified and will follow up.',
        },
        { status: 500 }
      );
    }

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      const reason =
        'SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL missing on the server.';

      console.error(reason);

      await sendBookingFailureAlert({
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        venueName: venueName || 'Unknown venue',
        fullName,
        email,
        mobile,
        reason,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            'Payment succeeded, but the booking service is not fully configured. Our team has been notified.',
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
     * ----------------------------------------------------------
     * 1. CREATE THE WEDDING (groups multi-event bookings)
     * ----------------------------------------------------------
     */

    const { data: wedding, error: weddingError } =
      await admin
        .from('weddings')
        .insert({
          owner_id: userId,
          title: `${fullName}'s celebration at ${venueName || 'venue'}`,
          city: venueCity || 'Hyderabad',
        })
        .select('id')
        .single();

    if (weddingError || !wedding) {
      const reason = `Failed to create wedding record: ${weddingError?.message}`;

      console.error(reason);

      await sendBookingFailureAlert({
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        venueName: venueName || 'Unknown venue',
        fullName,
        email,
        mobile,
        reason,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            'Payment succeeded, but we could not confirm the booking. Our team has been notified and will follow up shortly.',
        },
        { status: 500 }
      );
    }

    /*
     * ----------------------------------------------------------
     * 2. CREATE ONE BOOKING_REQUESTS ROW PER EVENT
     *
     * Inserted as a single batch: if any event's date conflicts
     * with the confirmed_venue_date_unique constraint (a race
     * against another booking that landed between the
     * create-order pre-check and now), the whole batch is
     * rejected atomically rather than leaving a partial booking.
     * ----------------------------------------------------------
     */

    const bookingRows = (events as IncomingEvent[]).map(
      (event) => ({
        wedding_id: wedding.id,
        venue_id: venueId,
        user_id: userId,
        event_date: event.eventDate,
        guest_count: parseGuestCount(event.guestCount),
        event_type: event.eventType || null,
        mode: mode === 'hold' ? 'hold' : 'instant_book',
        notes: event.notes || null,
        status: 'confirmed',
        payment_order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
      })
    );

    const { data: bookings, error: bookingError } =
      await admin
        .from('booking_requests')
        .insert(bookingRows)
        .select('id');

    if (bookingError) {
      const reason = `Failed to create booking_requests rows (likely a date conflict): ${bookingError.message}`;

      console.error(reason, {
        weddingId: wedding.id,
        bookingRows,
      });

      await sendBookingFailureAlert({
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        venueName: venueName || 'Unknown venue',
        fullName,
        email,
        mobile,
        reason,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            'Payment succeeded, but one of the selected dates was just booked by someone else. Please contact us with your payment ID so we can resolve this — no charge will be lost.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and booking confirmed.',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      weddingId: wedding.id,
      bookingIds: (bookings || []).map((b) => b.id),
    });
  } catch (error) {
    console.error(
      'RAZORPAY PAYMENT VERIFICATION ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          'Unable to verify Razorpay payment.',
      },
      { status: 500 }
    );
  }
}
