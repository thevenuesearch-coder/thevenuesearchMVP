import { NextResponse } from 'next/server';

const SCOPES = [
  'ZohoInvoice.settings.READ',
  'ZohoInvoice.contacts.READ',
  'ZohoInvoice.contacts.CREATE',
  'ZohoInvoice.invoices.CREATE',
  'ZohoInvoice.invoices.READ',
  'ZohoInvoice.customerpayments.CREATE',
].join(',');

export async function GET() {
  const clientId = process.env.ZOHO_CLIENT_ID;
  if (!clientId) return NextResponse.json({ success: false, error: 'ZOHO_CLIENT_ID is not configured.' }, { status: 500 });

  const redirectUri = process.env.ZOHO_REDIRECT_URI || 'https://venuesearch.in/api/zoho/callback';
  const params = new URLSearchParams({
    scope: SCOPES,
    client_id: clientId,
    state: crypto.randomUUID(),
    response_type: 'code',
    redirect_uri: redirectUri,
    access_type: 'offline',
    prompt: 'consent',
  });

  return NextResponse.redirect(`https://accounts.zoho.in/oauth/v2/auth?${params.toString()}`);
}
