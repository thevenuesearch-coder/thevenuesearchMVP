import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const NOTIFICATION_EMAIL = 'thevenuesearch@gmail.com';

export async function POST(request: Request) {
  try {
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
    } = body;

    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

    if (
      !venueName ||
      !fullName ||
      !email ||
      !mobile ||
      !eventDate ||
      !eventType ||
      !guestCount ||
      !budget
    ) {
      return NextResponse.json(
        {
          error:
            'Please complete all required booking details.',
        },
        { status: 400 }
      );
    }

    /* -------------------------------------------------------
       SMTP CONFIGURATION
       
       These should match the Gmail SMTP credentials
       already configured for your project.
    ------------------------------------------------------- */

    const smtpHost =
      process.env.SMTP_HOST || 'smtp.gmail.com';

    const smtpPort = Number(
      process.env.SMTP_PORT || 465
    );

    const smtpUser =
      process.env.SMTP_USER;

    const smtpPassword =
      process.env.SMTP_PASS;

    if (!smtpUser || !smtpPassword) {
      console.error(
        'SMTP configuration is missing.'
      );

      return NextResponse.json(
        {
          error:
            'Email service is not configured. Please check SMTP environment variables.',
        },
        { status: 500 }
      );
    }

    /* -------------------------------------------------------
       CREATE TRANSPORTER
    ------------------------------------------------------- */

    const transporter =
      nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

    /* -------------------------------------------------------
       FORMAT BOOKING FEE
    ------------------------------------------------------- */

    const formattedBookingFee =
      typeof bookingFee === 'number'
        ? `₹${bookingFee.toLocaleString('en-IN')}`
        : bookingFee || 'Not specified';

    /* -------------------------------------------------------
       EMAIL SUBJECT
    ------------------------------------------------------- */

    const subject =
      `New Instant Booking Review — ${venueName}`;

    /* -------------------------------------------------------
       SEND EMAIL
    ------------------------------------------------------- */

    await transporter.sendMail({
      from: `"The Venue Search" <${smtpUser}>`,
      to: NOTIFICATION_EMAIL,
      replyTo: email,
      subject,

      text: `
New Instant Booking Review

Venue
${venueName}

Venue ID
${venueId || 'Not provided'}

Booking Mode
${mode || 'instant-book'}

Customer Details
----------------
Full Name: ${fullName}
Email: ${email}
Mobile: ${mobile}

Event Details
-------------
Event Date: ${eventDate}
Event Type: ${eventType}
Guest Count: ${guestCount}
Budget: ${budget}

Booking Fee
-----------
${formattedBookingFee}

Notes
-----
${notes || 'No additional notes provided.'}

This booking has reached the Review Booking stage.
Payment has not been completed yet.
      `.trim(),

      html: `
        <div style="
          font-family: Arial, Helvetica, sans-serif;
          background:#f5f3ef;
          padding:32px;
          color:#171717;
        ">

          <div style="
            max-width:680px;
            margin:0 auto;
            background:#ffffff;
            border:1px solid #e6e1d8;
          ">

            <div style="
              padding:28px 32px;
              border-bottom:1px solid #e6e1d8;
            ">
              <div style="
                font-size:12px;
                letter-spacing:2px;
                color:#777;
                margin-bottom:10px;
              ">
                THE VENUE SEARCH
              </div>

              <h1 style="
                margin:0;
                font-size:26px;
                font-weight:500;
              ">
                New Instant Booking Review
              </h1>

              <p style="
                margin:10px 0 0;
                color:#666;
                font-size:14px;
              ">
                A customer has reached the Review Booking stage.
              </p>
            </div>

            <div style="padding:32px;">

              <h2 style="
                font-size:18px;
                margin:0 0 18px;
              ">
                Venue
              </h2>

              <div style="
                background:#f8f6f2;
                padding:18px;
                margin-bottom:28px;
              ">
                <strong style="font-size:18px;">
                  ${escapeHtml(venueName)}
                </strong>

                <div style="
                  margin-top:7px;
                  color:#777;
                  font-size:13px;
                ">
                  Venue ID: ${escapeHtml(
                    venueId || 'Not provided'
                  )}
                </div>
              </div>

              <h2 style="
                font-size:18px;
                margin:0 0 18px;
              ">
                Customer Details
              </h2>

              ${detailRow(
                'Full Name',
                fullName
              )}

              ${detailRow(
                'Email',
                email
              )}

              ${detailRow(
                'Mobile',
                mobile
              )}

              <h2 style="
                font-size:18px;
                margin:30px 0 18px;
              ">
                Event Details
              </h2>

              ${detailRow(
                'Event Date',
                eventDate
              )}

              ${detailRow(
                'Event Type',
                eventType
              )}

              ${detailRow(
                'Guest Count',
                guestCount
              )}

              ${detailRow(
                'Budget',
                budget
              )}

              <h2 style="
                font-size:18px;
                margin:30px 0 18px;
              ">
                Booking Details
              </h2>

              ${detailRow(
                'Booking Mode',
                mode || 'instant-book'
              )}

              ${detailRow(
                'Instant Booking Fee',
                formattedBookingFee
              )}

              <h2 style="
                font-size:18px;
                margin:30px 0 18px;
              ">
                Notes
              </h2>

              <div style="
                background:#f8f6f2;
                border:1px solid #ebe6dd;
                padding:16px;
                line-height:1.6;
                font-size:14px;
                white-space:pre-wrap;
              ">
                ${escapeHtml(
                  notes ||
                    'No additional notes provided.'
                )}
              </div>

              <div style="
                margin-top:30px;
                padding:16px;
                background:#fff8e8;
                border:1px solid #f0dfb5;
                font-size:13px;
                color:#6b5a2b;
              ">
                <strong>Payment status:</strong>
                Payment has not been completed yet.
                This email was generated when the customer
                clicked "Review booking".
              </div>

            </div>

            <div style="
              padding:20px 32px;
              border-top:1px solid #e6e1d8;
              color:#888;
              font-size:12px;
            ">
              The Venue Search · Booking Notification
            </div>

          </div>

        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message:
        'Booking review sent successfully.',
    });
  } catch (error) {
    console.error(
      'Booking review email error:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Unable to send booking details. Please try again.',
      },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function detailRow(
  label: string,
  value: string
) {
  return `
    <div style="
      display:flex;
      justify-content:space-between;
      gap:20px;
      padding:11px 0;
      border-bottom:1px solid #eeeae3;
      font-size:14px;
    ">
      <span style="color:#777;">
        ${escapeHtml(label)}
      </span>

      <strong style="
        text-align:right;
        font-weight:500;
      ">
        ${escapeHtml(String(value))}
      </strong>
    </div>
  `;
}