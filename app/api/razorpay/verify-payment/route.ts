import { NextResponse } from 'next/server';
import crypto from 'crypto';

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

    /*
     * Payment signature is valid.
     *
     * At this stage we know that the
     * Razorpay response belongs to the
     * order created by our server.
     *
     * Supabase booking creation will be
     * added after this flow is tested.
     */
    console.log(
      'Razorpay payment verified successfully:',
      {
        orderId:
          razorpay_order_id,
        paymentId:
          razorpay_payment_id,
      }
    );

    return NextResponse.json({
      success: true,
      message:
        'Payment verified successfully.',
      orderId:
        razorpay_order_id,
      paymentId:
        razorpay_payment_id,
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