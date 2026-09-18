import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const ADMIN_EMAIL = 'thevenuesearch@gmail.com';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(request: Request) {
  try {
    /*
     * ============================================
     * CHECK RESEND API KEY
     * ============================================
     */

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error(
        'RESEND_API_KEY is missing from environment variables.'
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'Email service is not configured. RESEND_API_KEY is missing.',
        },
        { status: 500 }
      );
    }

    /*
     * ============================================
     * READ REQUEST
     * ============================================
     */

    const body = await request.json();

    const {
      venueName,
      venueId,
      mode,
      fullName,
      email,
      mobile,
      eventDate,
      eventType,
      guestCount,
      budget,
      notes,
      bookingFee,
      stage,
    } = body;

    /*
     * ============================================
     * VALIDATION
     * ============================================
     */

    const requiredFields = {
      venueName,
      fullName,
      email,
      mobile,
      eventDate,
      eventType,
      guestCount,
    };

    const missingFields = Object.entries(
      requiredFields
    )
      .filter(
        ([, value]) =>
          !value ||
          String(value).trim() === ''
      )
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(
            ', '
          )}`,
        },
        { status: 400 }
      );
    }

    /*
     * ============================================
     * CREATE RESEND CLIENT
     * ============================================
     */

    const resend = new Resend(apiKey);

    /*
     * ============================================
     * FORMAT DATA
     * ============================================
     */

    const safeVenueName =
      escapeHtml(venueName);

    const safeVenueId =
      escapeHtml(venueId);

    const safeMode =
      escapeHtml(mode || 'instant-book');

    const safeFullName =
      escapeHtml(fullName);

    const safeEmail =
      escapeHtml(email);

    const safeMobile =
      escapeHtml(mobile);

    const safeEventDate =
      escapeHtml(eventDate);

    const safeEventType =
      escapeHtml(eventType);

    const safeGuestCount =
      escapeHtml(guestCount);

    const safeBudget =
      escapeHtml(
        budget || 'Not provided'
      );

    const safeNotes =
      escapeHtml(
        notes || 'No notes provided.'
      );

    const safeBookingFee =
      escapeHtml(
        bookingFee
          ? `₹${Number(
              bookingFee
            ).toLocaleString('en-IN')}`
          : '₹25,000'
      );

    const bookingStage =
      stage === 'review'
        ? 'Review Booking'
        : 'Proceed to Payment';

    /*
     * ============================================
     * EMAIL
     * ============================================
     */

    const { data, error } =
      await resend.emails.send({
        from:
          'The Venue Search <onboarding@resend.dev>',

        to: [ADMIN_EMAIL],

        subject:
          stage === 'review'
            ? `Booking Review — ${venueName}`
            : `Payment Started — ${venueName}`,

        html: `
          <!DOCTYPE html>

          <html>
            <head>
              <meta charset="UTF-8" />
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
              />
              <title>
                Venue Search Booking
              </title>
            </head>

            <body
              style="
                margin: 0;
                padding: 0;
                background: #f5f3ef;
                font-family: Arial, Helvetica, sans-serif;
                color: #171717;
              "
            >

              <div
                style="
                  max-width: 720px;
                  margin: 40px auto;
                  background: #ffffff;
                  border: 1px solid #e8e5df;
                "
              >

                <!-- HEADER -->

                <div
                  style="
                    padding: 32px;
                    background: #151515;
                    color: #ffffff;
                  "
                >

                  <div
                    style="
                      font-size: 12px;
                      letter-spacing: 2px;
                      text-transform: uppercase;
                      color: #9fd8e8;
                      margin-bottom: 10px;
                    "
                  >
                    THE VENUE SEARCH
                  </div>

                  <h1
                    style="
                      margin: 0;
                      font-size: 28px;
                      font-weight: 500;
                    "
                  >
                    New Booking Activity
                  </h1>

                  <p
                    style="
                      margin: 10px 0 0;
                      color: #cccccc;
                      font-size: 14px;
                    "
                  >
                    ${escapeHtml(
                      bookingStage
                    )}
                  </p>

                </div>

                <!-- VENUE -->

                <div
                  style="
                    padding: 28px 32px 10px;
                  "
                >

                  <h2
                    style="
                      margin: 0 0 18px;
                      font-size: 18px;
                    "
                  >
                    Venue Details
                  </h2>

                  <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      border-collapse: collapse;
                    "
                  >

                    <tr>
                      <td
                        style="
                          padding: 10px 0;
                          color: #777777;
                          width: 40%;
                        "
                      >
                        Venue
                      </td>

                      <td
                        style="
                          padding: 10px 0;
                          font-weight: 600;
                        "
                      >
                        ${safeVenueName}
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          padding: 10px 0;
                          color: #777777;
                        "
                      >
                        Venue ID
                      </td>

                      <td
                        style="
                          padding: 10px 0;
                        "
                      >
                        ${safeVenueId}
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          padding: 10px 0;
                          color: #777777;
                        "
                      >
                        Booking mode
                      </td>

                      <td
                        style="
                          padding: 10px 0;
                        "
                      >
                        ${safeMode}
                      </td>
                    </tr>

                  </table>

                </div>

                <!-- CUSTOMER -->

                <div
                  style="
                    padding: 20px 32px 10px;
                  "
                >

                  <h2
                    style="
                      margin: 0 0 18px;
                      font-size: 18px;
                    "
                  >
                    Customer Details
                  </h2>

                  <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      border-collapse: collapse;
                    "
                  >

                    <tr>
                      <td
                        style="
                          padding: 10px 0;
                          color: #777777;
                          width: 40%;
                        "
                      >
                        Full name
                      </td>

                      <td
                        style="
                          padding: 10px 0;
                          font-weight: 600;
                        "
                      >
                        ${safeFullName}
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          padding: 10px 0;
                          color: #777777;
                        "
                      >
                        Email
                      </td>

                      <td
                        style="
                          padding: 10px 0;
                        "
                      >
                        ${safeEmail}
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          padding: 10px 0;
                          color: #777777;
                        "
                      >
                        Mobile
                      </td>

                      <td
                        style="
                          padding: 10px 0;
                        "
                      >
                        ${safeMobile}
                      </td>
                    </tr>

                  </table>

                </div>

                <!-- EVENT -->

                <div
                  style="
                    padding: 20px 32px 10px;
                  "
                >

                  <h2
                    style="
                      margin: 0 0 18px;
                      font-size: 18px;
                    "
                  >
                    Event Details
                  </h2>

                  <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      border-collapse: collapse;
                    "
                  >

                    <tr>
                      <td
                        style="
                          padding: 10px 0;
                          color: #777777;
                          width: 40%;
                        "
                      >
                        Event date
                      </td>

                      <td
                        style="
                          padding: 10px 0;
                        "
                      >
                        ${safeEventDate}
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          padding: 10px 0;
                          color: #777777;
                        "
                      >
                        Event type
                      </td>

                      <td
                        style="
                          padding: 10px 0;
                        "
                      >
                        ${safeEventType}
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          padding: 10px 0;
                          color: #777777;
                        "
                      >
                        Guest count
                      </td>

                      <td
                        style="
                          padding: 10px 0;
                        "
                      >
                        ${safeGuestCount}
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          padding: 10px 0;
                          color: #777777;
                        "
                      >
                        Wedding budget
                      </td>

                      <td
                        style="
                          padding: 10px 0;
                        "
                      >
                        ${safeBudget}
                      </td>
                    </tr>

                  </table>

                </div>

                <!-- NOTES -->

                <div
                  style="
                    padding: 20px 32px;
                  "
                >

                  <h2
                    style="
                      margin: 0 0 18px;
                      font-size: 18px;
                    "
                  >
                    Customer Notes
                  </h2>

                  <div
                    style="
                      background: #f7f5f1;
                      padding: 18px;
                      line-height: 1.6;
                      font-size: 14px;
                    "
                  >
                    ${safeNotes}
                  </div>

                </div>

                <!-- PAYMENT -->

                <div
                  style="
                    margin: 10px 32px 30px;
                    padding: 22px;
                    background: #f7f5f1;
                    border: 1px solid #e8e5df;
                  "
                >

                  <div
                    style="
                      font-size: 13px;
                      color: #777777;
                      margin-bottom: 8px;
                    "
                  >
                    Instant booking fee
                  </div>

                  <div
                    style="
                      font-size: 28px;
                      font-weight: 600;
                    "
                  >
                    ${safeBookingFee}
                  </div>

                </div>

                <!-- FOOTER -->

                <div
                  style="
                    padding: 20px 32px;
                    border-top: 1px solid #eeeeee;
                    color: #888888;
                    font-size: 12px;
                  "
                >
                  This booking notification was
                  automatically generated by
                  The Venue Search.
                </div>

              </div>

            </body>
          </html>
        `,
      });

    /*
     * ============================================
     * RESEND ERROR
     * ============================================
     */

    if (error) {
      console.error(
        'RESEND EMAIL ERROR:',
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message ||
            'Resend failed to send the email.',
        },
        { status: 500 }
      );
    }

    /*
     * ============================================
     * SUCCESS
     * ============================================
     */

    console.log(
      'BOOKING EMAIL SENT:',
      data?.id
    );

    return NextResponse.json({
      success: true,
      message:
        'Booking details sent successfully.',
      emailId: data?.id || null,
    });

  } catch (error) {
    console.error(
      'BOOKING EMAIL SERVER ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unexpected email server error.',
      },
      { status: 500 }
    );
  }
}