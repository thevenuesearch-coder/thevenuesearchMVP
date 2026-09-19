import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const ADMIN_EMAIL = 'thevenuesearch@gmail.com';

type BookingEvent = {
  venueSpace?: string;
  eventDate?: string;
  eventType?: string;
  guestCount?: string | number;
  meal?: string;
  mealType?: string;
  notes?: string;
};

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value: unknown): string {
  if (!value) return 'Not provided';

  const date = new Date(`${String(value)}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatBookingFee(value: unknown): string {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return '₹25,000';
  }

  return `₹${amount.toLocaleString('en-IN')}`;
}

function eventRow(
  label: string,
  value: unknown
): string {
  return `
    <tr>
      <td
        style="
          padding: 9px 0;
          color: #777777;
          width: 40%;
          vertical-align: top;
        "
      >
        ${escapeHtml(label)}
      </td>

      <td
        style="
          padding: 9px 0;
          font-weight: 500;
          vertical-align: top;
        "
      >
        ${escapeHtml(value || 'Not provided')}
      </td>
    </tr>
  `;
}

export async function POST(request: Request) {
  try {
    /*
     * ============================================================
     * CHECK RESEND API KEY
     * ============================================================
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
     * ============================================================
     * READ REQUEST
     * ============================================================
     */

    const body = await request.json();

    const {
      venueName,
      venueId,
      mode,
      fullName,
      email,
      mobile,
      numberOfEvents,
      events,
      bookingFee,
      stage,
    } = body;

    /*
     * ============================================================
     * VALIDATE BASIC BOOKING INFORMATION
     * ============================================================
     */

    const requiredFields = {
      venueName,
      fullName,
      email,
      mobile,
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
     * ============================================================
     * VALIDATE EVENTS
     *
     * New booking structure:
     *
     * events: [
     *   {
     *     venueSpace,
     *     eventDate,
     *     eventType,
     *     guestCount,
     *     meal,
     *     mealType,
     *     notes
     *   }
     * ]
     * ============================================================
     */

    let bookingEvents: BookingEvent[] = [];

    if (Array.isArray(events)) {
      bookingEvents = events;
    }

    /*
     * Backward compatibility:
     *
     * If an older frontend sends one event using the old
     * top-level fields, convert it into the new events array.
     *
     * This prevents old deployed pages from immediately
     * breaking while the new frontend is being deployed.
     */

    if (
      bookingEvents.length === 0 &&
      body.eventDate &&
      body.eventType &&
      body.guestCount
    ) {
      bookingEvents = [
        {
          venueSpace:
            body.venueSpace || '',
          eventDate:
            body.eventDate,
          eventType:
            body.eventType,
          guestCount:
            body.guestCount,
          meal:
            body.meal || '',
          mealType:
            body.mealType || '',
          notes:
            body.notes || '',
        },
      ];
    }

    if (bookingEvents.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'At least one event is required for the booking.',
        },
        { status: 400 }
      );
    }

    /*
     * ============================================================
     * VALIDATE EACH EVENT
     * ============================================================
     */

    for (
      let index = 0;
      index < bookingEvents.length;
      index++
    ) {
      const event = bookingEvents[index];

      const eventNumber = index + 1;

      if (
        !event.eventDate ||
        String(event.eventDate).trim() === ''
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Event ${eventNumber}: event date is required.`,
          },
          { status: 400 }
        );
      }

      if (
        !event.eventType ||
        String(event.eventType).trim() === ''
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Event ${eventNumber}: event type is required.`,
          },
          { status: 400 }
        );
      }

      if (
        event.guestCount === undefined ||
        event.guestCount === null ||
        String(event.guestCount).trim() === ''
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Event ${eventNumber}: guest count is required.`,
          },
          { status: 400 }
        );
      }

      /*
       * Meal is required for the new booking flow.
       */

      if (
        !event.meal ||
        String(event.meal).trim() === ''
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Event ${eventNumber}: meal preference is required.`,
          },
          { status: 400 }
        );
      }

      /*
       * Meal type is required for the new booking flow.
       */

      if (
        !event.mealType ||
        String(event.mealType).trim() === ''
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Event ${eventNumber}: meal type is required.`,
          },
          { status: 400 }
        );
      }
    }

    /*
     * ============================================================
     * CREATE RESEND CLIENT
     * ============================================================
     */

    const resend = new Resend(apiKey);

    /*
     * ============================================================
     * SAFE BASIC DATA
     * ============================================================
     */

    const safeVenueName =
      escapeHtml(venueName);

    const safeVenueId =
      escapeHtml(venueId || 'Not provided');

    const safeMode =
      escapeHtml(
        mode || 'instant-book'
      );

    const safeFullName =
      escapeHtml(fullName);

    const safeEmail =
      escapeHtml(email);

    const safeMobile =
      escapeHtml(mobile);

    const safeNumberOfEvents =
      escapeHtml(
        numberOfEvents ||
          bookingEvents.length
      );

    const safeBookingFee =
      escapeHtml(
        formatBookingFee(bookingFee)
      );

    const bookingStage =
      stage === 'review'
        ? 'Review Booking'
        : 'Proceed to Payment';

    /*
     * ============================================================
     * BUILD EVENT HTML
     * ============================================================
     */

    const eventsHtml = bookingEvents
      .map((event, index) => {
        const safeSpace =
          escapeHtml(
            event.venueSpace ||
              'Not specified'
          );

        const safeDate =
          escapeHtml(
            formatDate(
              event.eventDate
            )
          );

        const safeType =
          escapeHtml(
            event.eventType ||
              'Not specified'
          );

        const safeGuests =
          escapeHtml(
            event.guestCount ||
              'Not specified'
          );

        const safeMeal =
          escapeHtml(
            event.meal ||
              'Not specified'
          );

        const safeMealType =
          escapeHtml(
            event.mealType ||
              'Not specified'
          );

        const safeNotes =
          escapeHtml(
            event.notes ||
              'No notes provided.'
          );

        return `
          <div
            style="
              margin-bottom: 24px;
              border: 1px solid #e8e5df;
              background: #ffffff;
            "
          >

            <div
              style="
                padding: 16px 20px;
                background: #151515;
                color: #ffffff;
              "
            >
              <div
                style="
                  font-size: 11px;
                  letter-spacing: 2px;
                  text-transform: uppercase;
                  color: #9fd8e8;
                  margin-bottom: 5px;
                "
              >
                EVENT ${index + 1}
              </div>

              <div
                style="
                  font-size: 18px;
                  font-weight: 600;
                "
              >
                ${safeType}
              </div>
            </div>

            <div style="padding: 18px 20px;">

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="border-collapse: collapse;"
              >

                ${eventRow(
                  'Venue space',
                  safeSpace
                )}

                ${eventRow(
                  'Event date',
                  safeDate
                )}

                ${eventRow(
                  'Event type',
                  safeType
                )}

                ${eventRow(
                  'Guest count',
                  safeGuests
                )}

                ${eventRow(
                  'Meal',
                  safeMeal
                )}

                ${eventRow(
                  'Meal type',
                  safeMealType
                )}

              </table>

              <div
                style="
                  margin-top: 14px;
                  padding: 14px;
                  background: #f7f5f1;
                  font-size: 13px;
                  line-height: 1.6;
                "
              >
                <div
                  style="
                    color: #777777;
                    margin-bottom: 5px;
                  "
                >
                  Event notes
                </div>

                <div>
                  ${safeNotes}
                </div>
              </div>

            </div>
          </div>
        `;
      })
      .join('');

    /*
     * ============================================================
     * SEND EMAIL
     * ============================================================
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

                <!-- VENUE DETAILS -->

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

                    ${eventRow(
                      'Venue',
                      safeVenueName
                    )}

                    ${eventRow(
                      'Venue ID',
                      safeVenueId
                    )}

                    ${eventRow(
                      'Booking mode',
                      safeMode
                    )}

                    ${eventRow(
                      'Number of events',
                      safeNumberOfEvents
                    )}

                  </table>

                </div>

                <!-- CUSTOMER DETAILS -->

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

                    ${eventRow(
                      'Full name',
                      safeFullName
                    )}

                    ${eventRow(
                      'Email',
                      safeEmail
                    )}

                    ${eventRow(
                      'Mobile',
                      safeMobile
                    )}

                  </table>

                </div>

                <!-- EVENTS -->

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

                  ${eventsHtml}

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
     * ============================================================
     * RESEND ERROR
     * ============================================================
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
     * ============================================================
     * SUCCESS
     * ============================================================
     */

    console.log(
      'BOOKING EMAIL SENT:',
      data?.id
    );

    return NextResponse.json({
      success: true,
      message:
        'Booking details sent successfully.',
      emailId:
        data?.id || null,
    });

  } catch (error) {
    /*
     * ============================================================
     * UNEXPECTED SERVER ERROR
     * ============================================================
     */

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