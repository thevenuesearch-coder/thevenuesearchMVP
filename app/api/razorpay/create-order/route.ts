import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const BOOKING_AMOUNT = 25000;

export async function POST(request: Request) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    /*
     * Check environment variables
     */
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

    /*
     * Read request body
     */
    const body = await request.json();

    const {
      venueId,
      venueName,
      fullName,
      email,
      mobile,
      eventDate,
    } = body;

    /*
     * Validate booking information
     */
    if (
      !venueId ||
      !venueName ||
      !fullName ||
      !email ||
      !mobile ||
      !eventDate
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

    /*
     * Create Razorpay client
     */
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    /*
     * Create Razorpay order
     *
     * Razorpay amount is always sent in the
     * smallest currency unit.
     *
     * ₹25,000 = 2,500,000 paise
     */
    const order = await razorpay.orders.create({
      amount: BOOKING_AMOUNT * 100,
      currency: 'INR',
      receipt: `TVS_${Date.now()}`,
      notes: {
        venue_id: String(venueId),
        venue_name: String(venueName),
        customer_name: String(fullName),
        customer_email: String(email),
        customer_mobile: String(mobile),
        event_date: String(eventDate),
      },
    });

    console.log(
      'Razorpay order created successfully:',
      order.id
    );

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (error: any) {
    /*
     * IMPORTANT:
     * Return the actual Razorpay error so that
     * we can diagnose Test Mode/API problems.
     *
     * Never return the secret key.
     */
    console.error(
      'RAZORPAY CREATE ORDER ERROR:',
      error
    );

    const razorpayError =
      error?.error || error;

    return NextResponse.json(
      {
        success: false,
        error:
          razorpayError?.description ||
          error?.description ||
          error?.message ||
          'Unable to create Razorpay order.',
        code:
          razorpayError?.code ||
          error?.code ||
          null,
      },
      { status: 500 }
    );
  }
}