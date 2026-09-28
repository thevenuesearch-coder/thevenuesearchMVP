const ZOHO_ACCOUNTS_BASE = 'https://accounts.zoho.in';
const ZOHO_API_BASE = 'https://www.zohoapis.in/invoice/v3';
const DEFAULT_REDIRECT_URI = 'https://venuesearch.in/api/zoho/callback';

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export async function getZohoAccessToken() {
  const params = new URLSearchParams({
    refresh_token: requiredEnv('ZOHO_REFRESH_TOKEN'),
    client_id: requiredEnv('ZOHO_CLIENT_ID'),
    client_secret: requiredEnv('ZOHO_CLIENT_SECRET'),
    redirect_uri: process.env.ZOHO_REDIRECT_URI || DEFAULT_REDIRECT_URI,
    grant_type: 'refresh_token',
  });
  const response = await fetch(`${ZOHO_ACCOUNTS_BASE}/oauth/v2/token?${params.toString()}`, { method: 'POST', cache: 'no-store' });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error(`Zoho token refresh failed: ${data.error || data.message || response.statusText}`);
  return data.access_token as string;
}

async function zohoFetch<T>(path: string, accessToken: string, organizationId: string | undefined, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Zoho-oauthtoken ${accessToken}`);
  headers.set('Content-Type', 'application/json');
  if (organizationId) headers.set('X-com-zoho-invoice-organizationid', organizationId);
  const response = await fetch(`${ZOHO_API_BASE}${path}`, { ...init, headers, cache: 'no-store' });
  const data = await response.json();
  if (!response.ok || (typeof data.code === 'number' && data.code !== 0)) throw new Error(`Zoho API error: ${data.message || response.statusText}`);
  return data as T;
}

async function getOrganizationId(accessToken: string) {
  if (process.env.ZOHO_ORGANIZATION_ID) return process.env.ZOHO_ORGANIZATION_ID;
  const data = await zohoFetch<{ organizations?: Array<{ organization_id: string; is_default_org?: boolean }> }>('/organizations', accessToken, undefined);
  const organization = data.organizations?.find((item) => item.is_default_org) || data.organizations?.[0];
  if (!organization?.organization_id) throw new Error('Unable to determine Zoho Invoice organization.');
  return String(organization.organization_id);
}

async function getZohoTaxId(accessToken: string, organizationId: string) {
  if (process.env.ZOHO_TAX_ID) return process.env.ZOHO_TAX_ID;

  const data = await zohoFetch<{
    taxes?: Array<{ tax_id: string; tax_name?: string; tax_percentage?: number }>;
  }>('/settings/taxes?per_page=200', accessToken, organizationId);

  const gst18 = data.taxes?.find(
    (tax) =>
      tax.tax_name?.trim().toLowerCase() === 'gst18' &&
      Number(tax.tax_percentage) === 18,
  );

  if (!gst18?.tax_id) {
    throw new Error(
      'Zoho GST18 tax was not found. Set ZOHO_TAX_ID in Vercel to the GST18 tax/group ID from Zoho Invoice.',
    );
  }

  return String(gst18.tax_id);
}

async function getOrCreateContact(accessToken: string, organizationId: string, details: { fullName: string; email: string; mobile: string }) {
  const params = new URLSearchParams({ email: details.email, per_page: '200' });
  const existing = await zohoFetch<{ contacts?: Array<{ contact_id: string; email?: string }> }>(`/contacts?${params.toString()}`, accessToken, organizationId);
  const matching = existing.contacts?.find((contact) => contact.email?.toLowerCase() === details.email.toLowerCase());
  if (matching?.contact_id) return matching.contact_id;

  const created = await zohoFetch<{ contact?: { contact_id: string } }>('/contacts', accessToken, organizationId, {
    method: 'POST',
    body: JSON.stringify({
      contact_name: details.fullName,
      contact_type: 'customer',
      email: details.email,
      mobile: details.mobile,
      currency_code: 'INR',
      payment_terms: 0,
    }),
  });
  if (!created.contact?.contact_id) throw new Error('Zoho did not return a contact ID.');
  return created.contact.contact_id;
}

export async function createZohoInvoiceForBooking(details: {
  fullName: string;
  email: string;
  mobile: string;
  venueName: string;
  venueCity: string;
  bookingIds: string[];
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amountInr: number;
}) {
  const accessToken = await getZohoAccessToken();
  const organizationId = await getOrganizationId(accessToken);
  const contactId = await getOrCreateContact(accessToken, organizationId, {
    fullName: details.fullName,
    email: details.email,
    mobile: details.mobile,
  });
  const taxId = await getZohoTaxId(accessToken, organizationId);
  const today = new Date().toISOString().slice(0, 10);

  const invoice = await zohoFetch<{ invoice?: { invoice_id: string; invoice_number?: string } }>('/invoices', accessToken, organizationId, {
    method: 'POST',
    body: JSON.stringify({
      customer_id: contactId,
      currency_code: 'INR',
      date: today,
      reference_number: details.razorpayPaymentId,
      payment_terms: 0,
      is_inclusive_tax: true,
      line_items: [{
        name: 'VenueSearch Booking Confirmation Fee',
        description: `${details.venueName} (${details.venueCity}) — booking IDs: ${details.bookingIds.join(', ')} — Razorpay order: ${details.razorpayOrderId}`,
        quantity: 1,
        rate: details.amountInr,
        tax_id: taxId,
      }],
    }),
  });

  const invoiceId = invoice.invoice?.invoice_id;
  if (!invoiceId) throw new Error('Zoho did not return an invoice ID.');

  const payment = await zohoFetch<{ payment?: { payment_id: string } }>('/customerpayments', accessToken, organizationId, {
    method: 'POST',
    body: JSON.stringify({
      customer_id: contactId,
      payment_mode: 'others',
      amount: details.amountInr,
      date: today,
      reference_number: details.razorpayPaymentId,
      description: `Razorpay payment for VenueSearch order ${details.razorpayOrderId}`,
      invoices: [{ invoice_id: invoiceId, amount_applied: details.amountInr }],
    }),
  });

  try {
    const emailBody = `
<div style="margin:0;padding:32px 16px;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e7eaf0;border-radius:16px;overflow:hidden;box-shadow:0 4px 18px rgba(15,23,42,0.06);">
    <div style="padding:24px 28px;border-bottom:1px solid #eef1f5;background:#ffffff;">
      <img src="https://venuesearch.in/logo.png" alt="VenueSearch" style="display:block;max-width:190px;max-height:64px;width:auto;height:auto;">
    </div>
    <div style="padding:34px 32px 30px;">
      <p style="margin:0 0 18px;font-size:24px;line-height:1.3;font-weight:700;color:#111827;">Thank you for your booking</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4b5563;">
        Thank you for your booking with <strong style="color:#111827;">VenueSearch</strong>.
      </p>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#4b5563;">
        Your booking payment has been received successfully. The official invoice document will be shared with you soon.
      </p>
      <div style="margin:0 0 24px;padding:18px 20px;background:#f8fafc;border:1px solid #e8edf3;border-radius:12px;">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Venue</p>
        <p style="margin:0;font-size:16px;font-weight:600;color:#111827;">${details.venueName}</p>
      </div>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6b7280;">
        If you have any questions, please contact us at
        <a href="mailto:bookings@venuesearch.in" style="color:#2563eb;text-decoration:none;">bookings@venuesearch.in</a>.
      </p>
    </div>
    <div style="padding:20px 28px;background:#0b123b;color:#dbe2ff;text-align:center;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#ffffff;">The Venue Search Private Limited</p>
      <p style="margin:0;font-size:12px;line-height:1.6;">
        <a href="https://venuesearch.in" style="color:#dbe2ff;text-decoration:none;">venuesearch.in</a>
        &nbsp;•&nbsp; bookings@venuesearch.in
      </p>
    </div>
  </div>
  <p style="max-width:640px;margin:16px auto 0;text-align:center;font-size:11px;color:#9ca3af;">
    This is an automated email from VenueSearch.
  </p>
</div>`;

    await zohoFetch(`/invoices/${invoiceId}/email?send_attachment=true`, accessToken, organizationId, {
      method: 'POST',
      body: JSON.stringify({
        send_from_org_email_id: true,
        to_mail_ids: [details.email],
        subject: `Thank You for Booking with VenueSearch — ${details.venueName}`,
        body: emailBody,
      }),
    });
  } catch (emailError) {
    console.error('Zoho invoice email failed:', emailError);
  }

  return {
    organizationId,
    contactId,
    invoiceId,
    invoiceNumber: invoice.invoice?.invoice_number || null,
    zohoPaymentId: payment.payment?.payment_id || null,
  };
}
