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
     * MOVE THE BOOKING TO ADMIN REVIEW
     *
     * Payment verification does not mean the venue has approved
     * the booking. The booking remains blocking for availability,
     * but its customer-facing/admin-review status is now
     * 'under_review'. The admin must explicitly confirm it.
     * ==========================================================
     */

    const { data: updated, error: updateError } = await admin
      .from('booking_requests')
      .update({
        status: 'under_review',
        payment_id: razorpay_payment_id,
      })
      .in('id', bookingIds)
      .eq('payment_order_id', razorpay_order_id)
      .eq('status', 'payment_pending')
      .select('id, wedding_id');

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

    return NextResponse.json({
      success: true,
      message: 'Payment verified and booking is under admin review.',
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
