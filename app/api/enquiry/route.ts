import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'thevenuesearch@gmail.com';

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>'"]/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      }[character] || character)
  );
}

function clean(value: unknown): string {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function formatDate(date: string): string {
  if (!date) {
    return '—';
  }

  const parts = date.split('-');

  if (parts.length === 3) {
    const [year, month, day] = parts;

    return `${day}-${month}-${year}`;
  }

  return date;
}

export async function POST(
  request: Request
) {
  try {
    /*
     * ==========================================
     * READ REQUEST
     * ==========================================
     */

    const body = await request.json();

    /*
     * ==========================================
     * CUSTOMER DETAILS
     * ==========================================
     */

    const fullName = clean(
      body.fullName
    );

    const email = clean(
      body.email
    );

    const mobile = clean(
      body.mobile
    );

    /*
     * ==========================================
     * EVENT DETAILS
     * ==========================================
     */

    const eventDate = clean(
      body.eventDate
    );

    const eventType = clean(
      body.eventType
    );

    const guestCount = clean(
      body.guestCount
    );

    const budget = clean(
      body.budget
    );

    const notes = clean(
      body.notes
    );

    /*
     * ==========================================
     * VENUE DETAILS
     * ==========================================
     */

    const venueName = clean(
      body.venueName
    );

    const venueId = clean(
      body.venueId
    );

    const venueSpace = clean(
      body.venueSpace
    );

    const venueSpaceId = clean(
      body.venueSpaceId
    );

    /*
     * ==========================================
     * REQUIRED FIELD VALIDATION
     * ==========================================
     */

    if (
      !fullName ||
      !email ||
      !mobile ||
      !eventDate ||
      !eventType ||
      !guestCount ||
      !budget ||
      !venueName
    ) {
      return NextResponse.json(
        {
          error:
            'Please complete all required fields.',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ==========================================
     * EMAIL VALIDATION
     * ==========================================
     */

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error:
            'Please enter a valid email address.',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ==========================================
     * GUEST COUNT
     * ==========================================
     *
     * Supports values such as:
     *
     * 200
     * 200–300
     * 600+
     * ==========================================
     */

    let parsedGuestCount: number | null =
      null;

    if (guestCount === '600+') {
      parsedGuestCount = 600;
    } else {
      const match =
        guestCount.match(/\d+/);

      if (match) {
        parsedGuestCount =
          Number.parseInt(
            match[0],
            10
          );
      }
    }

    /*
     * ==========================================
     * SUPABASE
     * ==========================================
     */

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY;

    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    let enquiryId = '';

    if (
      serviceRoleKey &&
      supabaseUrl
    ) {
      const admin =
        createClient(
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
       * ----------------------------------------
       * RESOLVE VENUE
       * ----------------------------------------
       */

      let resolvedVenueId:
        string | null = null;

      if (venueId) {
        const {
          data,
          error,
        } = await admin
          .from('venues')
          .select('id')
          .eq('id', venueId)
          .maybeSingle();

        if (error) {
          console.error(
            'Venue lookup failed:',
            error
          );
        }

        resolvedVenueId =
          data?.id || null;
      }

      /*
       * ----------------------------------------
       * FALLBACK TO SLUG
       * ----------------------------------------
       */

      if (
        !resolvedVenueId &&
        venueId
      ) {
        const {
          data,
          error,
        } = await admin
          .from('venues')
          .select('id')
          .eq('slug', venueId)
          .maybeSingle();

        if (error) {
          console.error(
            'Venue slug lookup failed:',
            error
          );
        }

        resolvedVenueId =
          data?.id || null;
      }

      /*
       * ----------------------------------------
       * DUPLICATE CHECK
       * ----------------------------------------
       *
       * Guards against double-clicks/retries: if this exact
       * email + venue + event date was already submitted in
       * the last 24 hours, reuse that enquiry instead of
       * creating a duplicate row and sending a second email.
       * ----------------------------------------
       */

      const twentyFourHoursAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();

      const {
        data: existingEnquiry,
        error: duplicateCheckError,
      } = await admin
        .from('enquiries')
        .select('id')
        .eq('email', email)
        .eq('event_date', eventDate)
        .eq(
          'venue_id',
          resolvedVenueId
        )
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (duplicateCheckError) {
        console.error(
          'Enquiry duplicate check failed:',
          duplicateCheckError
        );
        // Non-fatal — fall through and submit normally.
      }

      if (existingEnquiry?.id) {
        return NextResponse.json(
          {
            success: true,
            enquiryId: existingEnquiry.id,
            message:
              'Your enquiry is already being processed.',
          },
          { status: 200 }
        );
      }

      /*
       * ----------------------------------------
       * SAVE ENQUIRY
       * ----------------------------------------
       *
       * We only use the fields that exist
       * in the current enquiries table.
       * ----------------------------------------
       */

      const {
        data: enquiry,
        error: insertError,
      } = await admin
        .from('enquiries')
        .insert({
          venue_id:
            resolvedVenueId,

          full_name:
            fullName,

          email:
            email,

          mobile:
            mobile,

          event_date:
            eventDate,

          guest_count:
            parsedGuestCount,

          event_type:
            eventType,

          budget:
            budget,

          message:
            notes || null,

          status:
            'new',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error(
          'Supabase enquiry insert failed:',
          insertError
        );

        return NextResponse.json(
          {
            error:
              'We could not save your enquiry. Please try again.',
          },
          {
            status: 500,
          }
        );
      }

      enquiryId =
        enquiry?.id || '';
    }

    /*
     * ==========================================
     * RESEND CONFIGURATION
     * ==========================================
     */

    const resendApiKey =
      process.env.RESEND_API_KEY;

    const fromEmail =
      process.env.RESEND_FROM_EMAIL;

    if (
      !resendApiKey ||
      !fromEmail
    ) {
      console.error(
        'Resend environment variables are missing.'
      );

      return NextResponse.json(
        {
          error:
            'Email service is not configured yet. Add RESEND_API_KEY and RESEND_FROM_EMAIL in Vercel.',
        },
        {
          status: 503,
        }
      );
    }

    /*
     * ==========================================
     * DISPLAY VALUES
     * ==========================================
     */

    const displayEventDate =
      formatDate(eventDate);

    /*
     * ==========================================
     * EMAIL ROWS
     * ==========================================
     */

    const emailRows = [
      [
        'Venue',
        venueName,
      ],

      [
        'Venue ID',
        venueId || '—',
      ],

      [
        'Venue Space',
        venueSpace || '—',
      ],

      [
        'Venue Space ID',
        venueSpaceId || '—',
      ],

      [
        'Full Name',
        fullName,
      ],

      [
        'Email',
        email,
      ],

      [
        'Mobile',
        mobile,
      ],

      [
        'Event Date',
        displayEventDate,
      ],

      [
        'Event Type',
        eventType,
      ],

      [
        'Guest Count',
        guestCount,
      ],

      [
        'Budget',
        budget,
      ],

      [
        'Additional Requirements',
        notes || '—',
      ],

      [
        'Enquiry ID',
        enquiryId || '—',
      ],
    ];

    /*
     * ==========================================
     * EMAIL HTML
     * ==========================================
     */

    const html = `
<!doctype html>

<html>

<head>

  <meta
    charset="UTF-8"
  />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>
    New Venue Enquiry
  </title>

</head>

<body
  style="
    margin:0;
    padding:32px;
    background:#f5f2ed;
    font-family:Arial,Helvetica,sans-serif;
    color:#151515;
  "
>

  <div
    style="
      max-width:700px;
      margin:0 auto;
      background:#ffffff;
      border-radius:18px;
      overflow:hidden;
      border:1px solid #e8e3db;
    "
  >

    <!-- HEADER -->

    <div
      style="
        background:#111111;
        padding:36px;
        color:#ffffff;
      "
    >

      <div
        style="
          color:#28b9d8;
          font-size:11px;
          font-weight:700;
          letter-spacing:2px;
          margin-bottom:12px;
        "
      >
        THE VENUE SEARCH
      </div>

      <h1
        style="
          margin:0;
          font-size:30px;
          line-height:1.2;
          font-weight:500;
        "
      >
        New Venue Enquiry
      </h1>

      <p
        style="
          margin:12px 0 0;
          color:#aaa;
          font-size:14px;
          line-height:1.6;
        "
      >
        A new customer enquiry has been
        submitted through The Venue Search.
      </p>

    </div>


    <!-- CONTENT -->

    <div
      style="
        padding:32px;
      "
    >

      <h2
        style="
          margin:0 0 20px;
          font-size:19px;
          font-weight:600;
        "
      >
        Enquiry Details
      </h2>

      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="
          width:100%;
          border-collapse:collapse;
        "
      >

        ${emailRows
          .map(
            ([label, value]) => `
              <tr>

                <td
                  style="
                    width:38%;
                    padding:13px 0;
                    border-bottom:1px solid #eeeeee;
                    color:#777777;
                    font-size:13px;
                    font-weight:600;
                    vertical-align:top;
                  "
                >
                  ${escapeHtml(label)}
                </td>

                <td
                  style="
                    padding:13px 0;
                    border-bottom:1px solid #eeeeee;
                    color:#222222;
                    font-size:13px;
                    line-height:1.5;
                    vertical-align:top;
                  "
                >
                  ${escapeHtml(value)}
                </td>

              </tr>
            `
          )
          .join('')}

      </table>


      <!-- NEXT STEP -->

      <div
        style="
          margin-top:28px;
          padding:18px 20px;
          background:#f5f8fa;
          border:1px solid #e0ebef;
          border-radius:10px;
        "
      >

        <p
          style="
            margin:0;
            color:#555555;
            font-size:13px;
            line-height:1.6;
          "
        >
          <strong>
            Next step:
          </strong>

          Review this enquiry and contact
          the customer using the email or
          mobile number provided above.
        </p>

      </div>

    </div>


    <!-- FOOTER -->

    <div
      style="
        padding:20px 32px;
        background:#faf9f7;
        border-top:1px solid #eeeeee;
        color:#888888;
        font-size:11px;
        line-height:1.5;
      "
    >

      This enquiry was submitted through
      The Venue Search.

    </div>

  </div>

</body>

</html>
`;

    /*
     * ==========================================
     * SEND EMAIL THROUGH RESEND
     * ==========================================
     */

    const emailResponse =
      await fetch(
        'https://api.resend.com/emails',
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${resendApiKey}`,

            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            from: fromEmail,

            to: [
              ADMIN_EMAIL,
            ],

            reply_to: email,

            subject:
              `New Venue Search enquiry — ${venueName} — ${displayEventDate}`,

            html,
          }),
        }
      );

    /*
     * ==========================================
     * EMAIL ERROR
     * ==========================================
     */

    if (
      !emailResponse.ok
    ) {
      const emailError =
        await emailResponse.text();

      console.error(
        'Resend email failed:',
        emailError
      );

      return NextResponse.json(
        {
          error:
            'Your enquiry was saved, but the notification email could not be sent. Please try again.',
        },
        {
          status: 502,
        }
      );
    }

    /*
     * ==========================================
     * SUCCESS
     * ==========================================
     */

    return NextResponse.json(
      {
        success: true,
        enquiryId,
        message:
          'Your enquiry has been submitted successfully.',
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    /*
     * ==========================================
     * UNEXPECTED ERROR
     * ==========================================
     */

    console.error(
      'Enquiry submission failed:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Something went wrong while submitting your enquiry.',
      },
      {
        status: 500,
      }
    );
  }
}