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
  const today = new Date().toISOString().slice(0, 10);

  const invoice = await zohoFetch<{ invoice?: { invoice_id: string; invoice_number?: string } }>('/invoices', accessToken, organizationId, {
    method: 'POST',
    body: JSON.stringify({
      customer_id: contactId,
      currency_code: 'INR',
      date: today,
      reference_number: details.razorpayPaymentId,
      payment_terms: 0,
      line_items: [{
        name: 'VenueSearch Booking Confirmation Fee',
        description: `${details.venueName} (${details.venueCity}) — booking IDs: ${details.bookingIds.join(', ')} — Razorpay order: ${details.razorpayOrderId}`,
        quantity: 1,
        rate: details.amountInr,
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
    await zohoFetch(`/invoices/${invoiceId}/email`, accessToken, organizationId, {
      method: 'POST',
      body: JSON.stringify({
        send_from_org_email_id: true,
        to_mail_ids: [details.email],
        subject: `VenueSearch booking invoice — ${details.venueName}`,
        body: 'Thank you for your booking with VenueSearch. Your invoice for the booking confirmation fee is attached.',
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
