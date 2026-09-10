import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'thevenuesearch@gmail.com';

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character] || character));
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = clean(body.fullName);
    const email = clean(body.email);
    const mobile = clean(body.mobile);
    const eventDate = clean(body.eventDate);
    const eventType = clean(body.eventType);
    const budget = clean(body.budget);
    const guestCount = clean(body.guestCount);
    const notes = clean(body.notes);
    const venueName = clean(body.venueName);
    const venueId = clean(body.venueId);
    const mode = clean(body.mode) || 'enquiry';

    if (!fullName || !email || !mobile || !eventDate || !eventType || !budget || !guestCount || !venueName) {
      return NextResponse.json({ error: 'Please complete all required fields.' }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let enquiryId = '';

    if (serviceRoleKey && supabaseUrl) {
      const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
      let resolvedVenueId: string | null = null;
      if (venueId) {
        const { data } = await admin.from('venues').select('id').eq('id', venueId).maybeSingle();
        resolvedVenueId = data?.id || null;
      }
      if (!resolvedVenueId && venueId) {
        const { data } = await admin.from('venues').select('id').eq('slug', venueId).maybeSingle();
        resolvedVenueId = data?.id || null;
      }

      const parsedGuestCount = guestCount === '600+' ? 600 : Number.parseInt(guestCount.split('–')[0], 10);
      const { data: enquiry, error } = await admin.from('enquiries').insert({
        venue_id: resolvedVenueId,
        full_name: fullName,
        email,
        mobile,
        event_date: eventDate,
        guest_count: Number.isFinite(parsedGuestCount) ? parsedGuestCount : null,
        event_type: eventType,
        budget,
        message: notes || null,
        status: 'new',
      }).select('id').single();

      if (error) {
        console.error('Supabase enquiry insert failed:', error);
        return NextResponse.json({ error: 'We could not save your enquiry. Please try again.' }, { status: 500 });
      }
      enquiryId = enquiry.id;
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!resendApiKey || !fromEmail) {
      return NextResponse.json({ error: 'Email service is not configured yet. Add RESEND_API_KEY and RESEND_FROM_EMAIL in Vercel.' }, { status: 503 });
    }

    const emailRows = [
      ['Venue', venueName],
      ['Enquiry type', mode === 'proposal' ? 'Get a proposal' : mode === 'hold' ? 'Booking enquiry / Instant Hold interest' : 'Venue enquiry'],
      ['Full name', fullName], ['Email', email], ['Mobile', mobile], ['Event date', eventDate],
      ['Event type', eventType], ['Guest count', guestCount], ['Budget', budget], ['Notes', notes || '—'], ['Enquiry ID', enquiryId || '—'],
    ];

    const html = `<!doctype html><html><body style="margin:0;background:#f5f2ed;font-family:Arial,sans-serif;color:#151515;padding:32px"><div style="max-width:680px;margin:auto;background:#fff;padding:36px;border-radius:18px"><p style="letter-spacing:2px;font-size:12px;color:#258ec7;font-weight:700">THE VENUE SEARCH</p><h1 style="font-size:30px;margin:8px 0 10px">New booking enquiry</h1><p style="color:#666">A new enquiry has been submitted from the Venue Search website.</p><table style="width:100%;border-collapse:collapse;margin-top:24px">${emailRows.map(([label, value]) => `<tr><td style="padding:12px 0;border-bottom:1px solid #eee;font-weight:700;width:34%;vertical-align:top">${escapeHtml(label)}</td><td style="padding:12px 0;border-bottom:1px solid #eee">${escapeHtml(value)}</td></tr>`).join('')}</table></div></body></html>`;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromEmail,
        to: [ADMIN_EMAIL],
        reply_to: email,
        subject: `New Venue Search enquiry — ${venueName} — ${eventDate}`,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const emailError = await emailResponse.text();
      console.error('Resend email failed:', emailError);
      return NextResponse.json({ error: 'Your enquiry was saved, but the notification email could not be sent. Please try again.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, enquiryId });
  } catch (error) {
    console.error('Enquiry submission failed:', error);
    return NextResponse.json({ error: 'Something went wrong while submitting your enquiry.' }, { status: 500 });
  }
}
