# The Venue Search — Full MVP Foundation

A premium destination-wedding venue discovery and booking platform built with Next.js, TypeScript, Supabase and Framer Motion.

## Included
- Premium wedding-focused landing page with cinematic hero video slot, parallax-style visual treatment, motion, horizontal collection cards and responsive design.
- Udaipur-first venue discovery, filters, curated collections and venue detail pages.
- Login UI for passwordless Supabase magic-link auth.
- Couple flow: discover → evaluate → compare/shortlist → enquiry → hold/book → track.
- 72-hour hold model and database-level anti-double-booking function.
- - Planner workspace UI.
- Venue partner page.
- Admin allowlist UI for `thevenuesearch@gmail.com`.
- Supabase schema, RLS policies, booking functions and seed venues.
- API routes for health, venue reads, booking requests and secure holds.

## Run locally
1. Install Node.js 20+.
2. `npm install`
3. Copy `.env.example` to `.env.local`.
4. Create a Supabase project.
5. Run `supabase/schema.sql` in Supabase SQL Editor.
6. Add your Supabase URL and anon key to `.env.local`.
7. Add `SUPABASE_SERVICE_ROLE_KEY` for secure enquiry storage, `RESEND_API_KEY` and `RESEND_FROM_EMAIL` for enquiry notifications, then add Razorpay keys and a hosted hero video URL later.
8. `npm run dev`
9. Open `http://localhost:3000`.

## Supabase Auth
Enable the Email provider in Supabase Authentication and use an email template that displays `{{ .Token }}` so users receive a 6-digit OTP. For production, configure your Site URL and Redirect URLs to your deployed domain. The auth trigger creates a `profiles` row automatically, stores the submitted name/mobile details, and assigns the admin role when the email is `thevenuesearch@gmail.com`.

## Production payment integration
Booking enquiries currently use the enquiry API; the database is payment-safe, but real Razorpay confirmation should be connected server-side using Razorpay webhooks before launch. Never expose the Razorpay secret or Supabase service-role key in browser code.

## Deployment
Deploy this Next.js project to Vercel. Add all `.env.local` values as Vercel environment variables. The Supabase project remains the database/auth layer.

## Product basis
The UI and workflow reflect the supplied Venue Search pitch deck and progress overview: verified profiles, smart discovery, planner-first workflows, assisted booking, a Udaipur launch, Instant Hold / Instant Book, a 72-hour hold expiry, multi-event wedding view and the no-double-booking guarantee.

### Cursor interaction
The updated UI includes a cinematic desktop cursor: a lagging magnetic-style ring, contextual labels on links/buttons, a soft pointer glow, hero spotlight tracking, and click ripples. It automatically disables on touch devices and when `prefers-reduced-motion` is enabled.
