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

function eventRows(events: any[]): string {
  return events
    .map((event, index) => {
      const venueSpaceName =
        event?.venueSpaceName ||
        event?.venueSpace ||
        'Not provided';

      return `
        <div
          style="
            margin: 0 0 20px;
            border: 1px solid #e7e3dc;
            border-radius: 12px;
            overflow: hidden;
          "
        >
          <div
            style="
              padding: 16px 20px;
              background: #151515;
              color: #ffffff;
              font-size: 16px;
              font-weight: 600;
            "
          >
            Event ${index + 1}
          </div>

          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="border-collapse: collapse;"
          >
            <tr>
              <td style="padding: 12px 20px; color: #777777; width: 40%;">
                Venue space
              </td>
              <td style="padding: 12px 20px; font-weight: 600;">
                ${escapeHtml(venueSpaceName)}
              </td>
            </tr>

            <tr>
              <td style="padding: 12px 20px; color: #777777;">
                Event date
              </td>
              <td style="padding: 12px 20px;">
                ${escapeHtml(formatDate(event?.eventDate))}
              </td>
            </tr>

            <tr>
              <td style="padding: 12px 20px; color: #777777;">
                Event type
              </td>
              <td style="padding: 12px 20px;">
                ${escapeHtml(event?.eventType || 'Not provided')}
              </td>
            </tr>

            <tr>
              <td style="padding: 12px 20px; color: #777777;">
                Guest count
              </td>
              <td style="padding: 12px 20px;">
                ${escapeHtml(event?.guestCount || 'Not provided')}
              </td>
            </tr>

            <tr>
              <td style="padding: 12px 20px; color: #777777;">
                Meal timing
              </td>
              <td style="padding: 12px 20px;">
                ${escapeHtml(event?.mealTiming || event?.meal || 'Not provided')}
              </td>
            </tr>

            <tr>
              <td style="padding: 12px 20px; color: #777777;">
                Meal category
              </td>
              <td style="padding: 12px 20px;">
                ${escapeHtml(event?.mealCategory || event?.mealType || 'Not provided')}
              </td>
            </tr>

            <tr>
              <td style="padding: 12px 20px; color: #777777; vertical-align: top;">
                Special notes
              </td>
              <td style="padding: 12px 20px; line-height: 1.6;">
                ${escapeHtml(event?.notes || 'No notes provided.')}
              </td>
            </tr>
          </table>
        </div>
      `;
    })
    .join('');
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error('RESEND_API_KEY is missing.');

      return NextResponse.json(
        {
          success: false,
          error:
            'Email service is not configured. RESEND_API_KEY is missing.',
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const {
      venueName,
      venueId,
      venueCity,
      venueDestination,
      mode,
      fullName,
      email,
      mobile,
      numberOfEvents,
      events,
    } = body;

    const requiredFields = {
      venueName,
      fullName,
      email,
      mobile,
      numberOfEvents,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(
        ([, value]) =>
          !value || String(value).trim() === ''
      )
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one event is required.',
        },
        { status: 400 }
      );
    }

    const resend = new Resend(apiKey);

    const safeVenueName = escapeHtml(venueName);
    const safeVenueId = escapeHtml(venueId || 'Not provided');
    const safeVenueCity = escapeHtml(venueCity || 'Not provided');
    const safeVenueDestination = escapeHtml(
      venueDestination || 'Not provided'
    );
    const safeMode = escapeHtml(mode || 'instant-book');
    const safeFullName = escapeHtml(fullName);
    const safeEmail = escapeHtml(email);
    const safeMobile = escapeHtml(mobile);
    const safeNumberOfEvents = escapeHtml(numberOfEvents);

    const fromEmail =
      process.env.RESEND_FROM_EMAIL ||
      'The Venue Search <onboarding@resend.dev>';

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [ADMIN_EMAIL],
      subject: `Venue Booking Document Request — ${venueName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <title>Venue Booking Document Request</title>
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
                max-width: 760px;
                margin: 40px auto;
                background: #ffffff;
                border: 1px solid #e7e3dc;
              "
            >
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
                  Venue Booking Document Requested
                </h1>

                <p
                  style="
                    margin: 10px 0 0;
                    color: #cccccc;
                    font-size: 14px;
                  "
                >
                  A customer has requested the venue booking document.
                </p>
              </div>

              <div style="padding: 28px 32px 10px;">
                <h2 style="margin: 0 0 18px; font-size: 18px;">
                  Venue Details
                </h2>

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="border-collapse: collapse;"
                >
                  <tr>
                    <td style="padding: 10px 0; color: #777777; width: 40%;">
                      Venue
                    </td>
                    <td style="padding: 10px 0; font-weight: 600;">
                      ${safeVenueName}
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 10px 0; color: #777777;">
                      Venue ID
                    </td>
                    <td style="padding: 10px 0;">
                      ${safeVenueId}
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 10px 0; color: #777777;">
                      City
                    </td>
                    <td style="padding: 10px 0;">
                      ${safeVenueCity}
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 10px 0; color: #777777;">
                      Destination
                    </td>
                    <td style="padding: 10px 0;">
                      ${safeVenueDestination}
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 10px 0; color: #777777;">
                      Booking mode
                    </td>
                    <td style="padding: 10px 0;">
                      ${safeMode}
                    </td>
                  </tr>
                </table>
              </div>

              <div style="padding: 20px 32px 10px;">
                <h2 style="margin: 0 0 18px; font-size: 18px;">
                  Customer Details
                </h2>

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="border-collapse: collapse;"
                >
                  <tr>
                    <td style="padding: 10px 0; color: #777777; width: 40%;">
                      Full name
                    </td>
                    <td style="padding: 10px 0; font-weight: 600;">
                      ${safeFullName}
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 10px 0; color: #777777;">
                      Email
                    </td>
                    <td style="padding: 10px 0;">
                      ${safeEmail}
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 10px 0; color: #777777;">
                      Mobile
                    </td>
                    <td style="padding: 10px 0;">
                      ${safeMobile}
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 10px 0; color: #777777;">
                      Number of events
                    </td>
                    <td style="padding: 10px 0;">
                      ${safeNumberOfEvents}
                    </td>
                  </tr>
                </table>
              </div>

              <div style="padding: 20px 32px;">
                <h2 style="margin: 0 0 18px; font-size: 18px;">
                  Booking Details
                </h2>

                ${eventRows(events)}
              </div>

              <div
                style="
                  padding: 20px 32px;
                  border-top: 1px solid #eeeeee;
                  color: #888888;
                  font-size: 12px;
                "
              >
                This request was submitted through The Venue Search.
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('RESEND DOCUMENT REQUEST ERROR:', error);

      return NextResponse.json(
        {
          success: false,
          error:
            error.message ||
            'Resend failed to send the document request email.',
        },
        { status: 500 }
      );
    }

    console.log(
      'VENUE BOOKING DOCUMENT REQUEST SENT:',
      data?.id
    );

    return NextResponse.json({
      success: true,
      message: 'Venue booking document request submitted successfully.',
      emailId: data?.id || null,
    });
  } catch (error) {
    console.error(
      'VENUE BOOKING DOCUMENT REQUEST SERVER ERROR:',
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
