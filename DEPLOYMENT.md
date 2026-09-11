# Deployment checklist

## Supabase
1. Create project.
2. SQL Editor → run `supabase/schema.sql`.
3. Optional: run `supabase/seed.sql`.
4. Authentication → Providers → Email enabled.
5. Authentication → URL Configuration → set production Site URL and `/auth/callback` redirect.
6. Confirm RLS is enabled and test with a non-admin user.

## Vercel
Import the project or connect the Git repository.
Set:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server-side only when needed)
- NEXT_PUBLIC_APP_URL
- NEXT_PUBLIC_HERO_VIDEO_URL (optional)
- RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET when payment backend is connected
- ADMIN_EMAIL=thevenuesearch@gmail.com

## Existing hosting link
The supplied Bolt hosting URL can be used as the reference/demo environment. This package is structured so the production deployment can be moved to Vercel while Supabase remains the backend/database/auth layer.

## Booking enquiry email setup

The current booking engine is intentionally operating as an enquiry system. Submitting the form:
1. validates the required customer and event details;
2. stores the enquiry in Supabase when `SUPABASE_SERVICE_ROLE_KEY` is configured;
3. sends all submitted details to `thevenuesearch@gmail.com` through Resend;
4. shows the customer the confirmation modal: “Booking enquiry submitted successfully.”

Add these Vercel environment variables:
- `RESEND_API_KEY` — your Resend API key.
- `RESEND_FROM_EMAIL` — a sender address on a domain verified in Resend, for example `The Venue Search <enquiries@yourdomain.com>`.

After adding the `budget` column to the existing `public.enquiries` table (or rerunning the updated `supabase/schema.sql` in a fresh project), redeploy the application.
