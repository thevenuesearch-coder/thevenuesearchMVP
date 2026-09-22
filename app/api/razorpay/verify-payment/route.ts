import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || 'thevenuesearch@gmail.com';

/*
 * ==============================================================
 * ADMIN ALERT — payment succeeded but confirming the booking
 * failed
 *
 * Rare (the booking row already exists as payment_pending by
 * this point -- this only fires if the UPDATE itself fails),
 * but if it happens it needs a human immediately.
 * ==============================================================
 */
async function sendBookingFailureAlert(details: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
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
        subject: `URGENT: Payment succeeded but booking confirmation failed`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px;">
            <h2 style="color:#b33;">A customer was charged but their booking could not be confirmed.</h2>
            <table cellpadding="6">
              <tr><td><strong>Razorpay order ID</strong></td><td>${details.razorpayOrderId}</td></tr>
              <tr><td><strong>Razorpay payment ID</strong></td><td>${details.razorpayPaymentId}</td></tr>
              <tr><td><strong>Customer</strong></td><td>${details.fullName}</td></tr>
              <tr><td><strong>Email</strong></td><td>${details.email}</td></tr>
              <tr><td><strong>Mobile</strong></td><td>${details.mobile}</td></tr>
              <tr><td><strong>Reason</strong></td><td>${details.reason}</td></tr>
            </table>
            <p>Check Razorpay and Supabase (booking_requests, filter by payment_order_id) and confirm manually.</p>
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

async function sendAdminBookingEmail(details: {
  fullName: string;
  email: string;
  mobile: string;
  venueName: string;
  venueCity: string;
  bookings: Array<{
    eventDate: string | null;
    eventType: string | null;
    guestCount: number | null;
    bookingType: string | null;
    checkinDate: string | null;
    checkoutDate: string | null;
    numRooms: number | null;
    roomSelections:
      | { roomId: string; roomName: string; quantity: number }[]
      | null;
  }>;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    'The Venue Search <onboarding@resend.dev>';

  if (!resendApiKey) {
    console.error('RESEND_API_KEY is missing. Admin booking email was not sent.');
    return;
  }

  const formatDate = (value: string | null) => {
    if (!value) return '—';
    const date = new Date(value + 'T00:00:00');
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
  };

  const bookingRows = details.bookings
    .map((booking, index) => {
      const isRoom =
        booking.bookingType === 'room' ||
        Boolean(booking.checkinDate) ||
        Boolean(booking.checkoutDate) ||
        Boolean(booking.numRooms);

      if (isRoom) {
        const categoryLine =
          booking.roomSelections && booking.roomSelections.length > 0
            ? booking.roomSelections
                .map((s) => `${s.roomName} × ${s.quantity}`)
                .join(', ')
            : `${booking.numRooms || '—'} rooms`;

        return `
          <tr>
            <td style="padding:10px;border:1px solid #ddd;">Room booking ${index + 1}</td>
            <td style="padding:10px;border:1px solid #ddd;">
              ${formatDate(booking.checkinDate)} to ${formatDate(booking.checkoutDate)}
            </td>
            <td style="padding:10px;border:1px solid #ddd;">
              ${categoryLine}
            </td>
          </tr>
        `;
      }

      return `
        <tr>
          <td style="padding:10px;border:1px solid #ddd;">${booking.eventType || 'Event'}</td>
          <td style="padding:10px;border:1px solid #ddd;">${formatDate(booking.eventDate)}</td>
          <td style="padding:10px;border:1px solid #ddd;">${booking.guestCount || '—'} guests</td>
        </tr>
      `;
    })
    .join('');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: ['thevenuesearch@gmail.com'],
        subject: `Booking confirmed — ${details.venueName} — ${details.fullName}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:720px;margin:auto;padding:28px;color:#171717;">
            <h2 style="margin-bottom:8px;">New Venue Booking Confirmed</h2>
            <p style="font-size:16px;line-height:1.6;">
              The user <strong>${details.fullName}</strong> has booked
              <strong>${details.venueName}</strong>.
            </p>

            <table style="width:100%;border-collapse:collapse;margin:22px 0;">
              <tr><td style="padding:10px;border:1px solid #ddd;"><strong>Venue</strong></td><td style="padding:10px;border:1px solid #ddd;">${details.venueName}</td></tr>
              <tr><td style="padding:10px;border:1px solid #ddd;"><strong>City</strong></td><td style="padding:10px;border:1px solid #ddd;">${details.venueCity || '—'}</td></tr>
              <tr><td style="padding:10px;border:1px solid #ddd;"><strong>Customer</strong></td><td style="padding:10px;border:1px solid #ddd;">${details.fullName}</td></tr>
              <tr><td style="padding:10px;border:1px solid #ddd;"><strong>Email</strong></td><td style="padding:10px;border:1px solid #ddd;">${details.email}</td></tr>
              <tr><td style="padding:10px;border:1px solid #ddd;"><strong>Mobile</strong></td><td style="padding:10px;border:1px solid #ddd;">${details.mobile}</td></tr>
            </table>

            <h3>Booking information</h3>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <th style="padding:10px;border:1px solid #ddd;text-align:left;">Event / Room</th>
                <th style="padding:10px;border:1px solid #ddd;text-align:left;">Date(s)</th>
                <th style="padding:10px;border:1px solid #ddd;text-align:left;">Details</th>
              </tr>
              ${bookingRows}
            </table>

            <p style="margin-top:24px;line-height:1.6;">
              <strong>Payment:</strong> Paid<br/>
              <strong>Razorpay Payment ID:</strong> ${details.bookings.length ? 'Verified' : 'Verified'}
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      console.error(
        'Admin booking email failed:',
        await response.text()
      );
    }
  } catch (error) {
    console.error('Admin booking email error:', error);
  }
}

export async function POST(request: Request) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Razorpay secret key is missing.',
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingIds,
      fullName,
      email,
      mobile,
    } = body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !Array.isArray(bookingIds) ||
      bookingIds.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Incomplete Razorpay payment response.',
        },
        { status: 400 }
      );
    }

    /*
     * ==========================================================
     * SIGNATURE VERIFICATION
     * ==========================================================
     */

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const expectedBuffer = Buffer.from(
      generatedSignature,
      'utf8'
    );

    const receivedBuffer = Buffer.from(
      razorpay_signature,
      'utf8'
    );

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      console.error(
        'SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL missing.'
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'Payment succeeded, but the booking service is not fully configured. Our team has been notified.',
        },
        { status: 500 }
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const isValid =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!isValid) {
      console.error(
        'Invalid Razorpay payment signature.',
        { razorpay_order_id }
      );

      /*
       * Mark the pending rows as genuinely failed rather than
       * leaving them stuck in payment_pending -- this frees
       * the venue date immediately instead of waiting on the
       * 45-minute expiry job.
       */
      await admin
        .from('booking_requests')
        .update({ status: 'failed' })
        .in('id', bookingIds)
        .eq('payment_order_id', razorpay_order_id)
        .eq('status', 'payment_pending');

      return NextResponse.json(
        {
          success: false,
          error: 'Payment signature verification failed.',
        },
        { status: 400 }
      );
    }

    /*
     * ==========================================================
     * CONFIRM THE BOOKING
     *
     * The booking is confirmed only after Razorpay signature
     * verification succeeds.
     * ==========================================================
     */

    const { data: updated, error: updateError } = await admin
      .from('booking_requests')
      .update({
        status: 'confirmed',
        payment_id: razorpay_payment_id,
      })
      .in('id', bookingIds)
      .eq('payment_order_id', razorpay_order_id)
      .eq('status', 'payment_pending')
      .select(
        'id, wedding_id, venue_id, event_date, event_type, guest_count, booking_type, checkin_date, checkout_date, num_rooms, room_type, room_guest_count'
      );

    if (
      updateError ||
      !updated ||
      updated.length !== bookingIds.length
    ) {
      const reason = updateError
        ? updateError.message
        : `Expected to confirm ${bookingIds.length} row(s), updated ${updated?.length || 0}.`;

      console.error(
        'Failed to confirm booking after payment:',
        reason
      );

      await sendBookingFailureAlert({
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        fullName: fullName || 'Unknown',
        email: email || 'Unknown',
        mobile: mobile || 'Unknown',
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
     * Payment is verified and the booking is confirmed.
     * Notify the admin with the booking details.
     */
    try {
      const bookingIdsForEmail = updated.map((booking) => booking.id);

      const { data: bookingDetails, error: bookingDetailsError } =
        await admin
          .from('booking_requests')
          .select(
            'id, venue_id, event_date, event_type, guest_count, booking_type, checkin_date, checkout_date, num_rooms, room_selections'
          )
          .in('id', bookingIdsForEmail);

      if (bookingDetailsError) {
        console.error(
          'Unable to load booking details for admin email:',
          bookingDetailsError
        );
      } else {
        const venueId = bookingDetails?.[0]?.venue_id;

        const { data: venue } = venueId
          ? await admin
              .from('venues')
              .select('name, city')
              .eq('id', venueId)
              .maybeSingle()
          : { data: null };

        await sendAdminBookingEmail({
          fullName: fullName || 'Customer',
          email: email || '—',
          mobile: mobile || '—',
          venueName: venue?.name || 'Venue',
          venueCity: venue?.city || '—',
          bookings: (bookingDetails || []).map((booking: any) => ({
            eventDate: booking.event_date || null,
            eventType: booking.event_type || null,
            guestCount: booking.guest_count || null,
            bookingType: booking.booking_type || null,
            checkinDate: booking.checkin_date || null,
            checkoutDate: booking.checkout_date || null,
            numRooms: booking.num_rooms || null,
            roomSelections: booking.room_selections || null,
          })),
        });
      }
    } catch (emailError) {
      console.error(
        'Admin booking notification failed:',
        emailError
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and booking confirmed.',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      weddingId: updated[0]?.wedding_id,
      bookingIds: updated.map((b) => b.id),
    });
  } catch (error) {
    console.error(
      'RAZORPAY PAYMENT VERIFICATION ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Unable to verify Razorpay payment.',
      },
      { status: 500 }
    );
  }
}
