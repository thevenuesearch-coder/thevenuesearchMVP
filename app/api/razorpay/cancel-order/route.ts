import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/*
 * Called when the customer closes the Razorpay checkout modal
 * without completing payment. Distinct from a failed signature
 * verification (see verify-payment) -- this is the customer
 * choosing not to pay, not a payment attempt that broke.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, bookingIds } = body;

    if (
      !orderId ||
      !Array.isArray(bookingIds) ||
      bookingIds.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: 'Missing order or booking IDs.' },
        { status: 400 }
      );
    }

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { success: false, error: 'Service not configured.' },
        { status: 500 }
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    /*
     * Only ever cancels rows still sitting in payment_pending --
     * never touches a row that somehow already confirmed (e.g.
     * a race with a webhook/retry), and never touches rows that
     * aren't this order's.
     */
    await admin
      .from('booking_requests')
      .update({ status: 'cancelled' })
      .in('id', bookingIds)
      .eq('payment_order_id', orderId)
      .eq('status', 'payment_pending');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel-order error:', error);

    return NextResponse.json(
      { success: false, error: 'Unable to cancel.' },
      { status: 500 }
    );
  }
}
