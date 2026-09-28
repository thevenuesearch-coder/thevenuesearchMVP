import { NextResponse } from 'next/server';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error || !code) {
    return NextResponse.json(
      {
        success: false,
        error: error || 'No Zoho authorization code received.',
      },
      { status: 400 }
    );
  }

  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const redirectUri =
    process.env.ZOHO_REDIRECT_URI ||
    'https://venuesearch.in/api/zoho/callback';

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { success: false, error: 'Zoho OAuth is not configured.' },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch(
    `https://accounts.zoho.in/oauth/v2/token?${params.toString()}`,
    { method: 'POST', cache: 'no-store' }
  );
  const data = await response.json();

  if (!response.ok || !data.refresh_token) {
    return NextResponse.json(
      { success: false, error: data.error || data.message || 'Token exchange failed.' },
      { status: 500 }
    );
  }

  return new NextResponse(
    `<!doctype html>
<html><head><meta charset="utf-8"><title>VenueSearch Zoho Connected</title></head>
<body style="font-family:Arial,sans-serif;max-width:760px;margin:40px auto;padding:24px;line-height:1.6">
<h1>Zoho Invoice authorization successful</h1>
<p>Copy this refresh token into Vercel Production as <strong>ZOHO_REFRESH_TOKEN</strong>.</p>
<p><strong>Do not share this token publicly.</strong></p>
<textarea readonly style="width:100%;height:130px;padding:12px">${escapeHtml(String(data.refresh_token))}</textarea>
<p>Then add/redeploy the Production environment variable and test a booking.</p>
</body></html>`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    }
  );
}
