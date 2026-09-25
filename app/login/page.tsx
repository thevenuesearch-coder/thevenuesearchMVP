'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase-browser';

export default function Login() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const [step, setStep] = useState<'details' | 'otp'>('details');

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [cooldown, setCooldown] = useState(0);

  /*
   * OTP resend countdown
   */
  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [cooldown]);

  /*
   * Validate user details
   */
  function validateDetails() {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/[\s-]/g, '');

    if (cleanUsername.length < 2) {
      return 'Please enter your name.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return 'Please enter a valid email address.';
    }

    if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
      return 'Please enter a valid mobile number.';
    }

    return '';
  }

  /*
   * Send verification OTP
   */
  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();

    setError('');
    setMessage('');

    const validationError = validateDetails();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/[\s-]/g, '');

    try {
      const supabase = createClient();

      const { error: otpError } =
        await supabase.auth.signInWithOtp({
          email: cleanEmail,

          options: {
            shouldCreateUser: true,

            data: {
              username: username.trim(),
              full_name: username.trim(),
              mobile: cleanPhone,
              phone: cleanPhone,
            },
          },
        });

      if (otpError) {
        setError(
          otpError.message ||
            'Unable to send the verification code. Please try again.'
        );
        return;
      }

      /*
       * Move to OTP verification screen
       */
      setStep('otp');

      /*
       * Supabase has a minimum OTP request interval.
       * Keep the UI cooldown at 60 seconds.
       */
      setCooldown(60);

      setMessage(
        `We sent a 6-digit verification code to ${cleanEmail}.`
      );
    } catch (err) {
      console.error('OTP request failed:', err);

      setError(
        'Unable to send the verification code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Verify 6-digit OTP
   */
  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();

    setError('');
    setMessage('');

    /*
     * Only allow numbers
     */
    const cleanOtp = otp.replace(/\D/g, '');

    /*
     * OTP must contain exactly 6 digits
     */
    if (cleanOtp.length !== 6) {
      setError(
        'Please enter the 6-digit verification code sent to your email.'
      );
      return;
    }

    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/[\s-]/g, '');

    try {
      const supabase = createClient();

      /*
       * Verify OTP with Supabase
       */
      const {
        data,
        error: verifyError,
      } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: 'email',
      });

      /*
       * OTP verification failed
       */
      if (verifyError) {
        setError(
          verifyError.message ||
            'The verification code is incorrect or expired.'
        );
        return;
      }

      /*
       * OTP verified successfully
       */
      if (data.user) {
        /*
         * Create or update the user's profile.
         *
         * This requires the profiles table and
         * appropriate RLS policies in Supabase.
         */
        const { error: profileError } =
          await supabase
            .from('profiles')
            .upsert(
              {
                id: data.user.id,
                full_name: username.trim(),
                email: cleanEmail,
                mobile: cleanPhone,
              },
              {
                onConflict: 'id',
              }
            );

        /*
         * Profile sync should NOT prevent login.
         *
         * If there is a database/profile problem,
         * log the actual details in the browser console
         * but continue the authentication flow.
         */
        if (profileError) {
          console.error(
            'Profile sync failed:',
            profileError.message,
            profileError.details,
            profileError.hint,
            profileError.code
          );
        }
      }

      /*
       * IMPORTANT:
       *
       * Normal users go to the HOME PAGE.
       * They do NOT go to /planner.
       *
       * /planner is protected separately for admin access.
       */
      router.replace('/');
    } catch (err) {
      console.error('OTP verification failed:', err);

      setError(
        'Something went wrong while verifying the code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Resend OTP
   */
  async function resendCode() {
    if (cooldown > 0 || resending) {
      return;
    }

    setError('');
    setMessage('');

    setResending(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/[\s-]/g, '');

    try {
      const supabase = createClient();

      const {
        error: resendError,
      } = await supabase.auth.signInWithOtp({
        email: cleanEmail,

        options: {
          shouldCreateUser: true,

          data: {
            username: username.trim(),
            full_name: username.trim(),
            mobile: cleanPhone,
            phone: cleanPhone,
          },
        },
      });

      if (resendError) {
        setError(
          resendError.message ||
            'Unable to resend the verification code.'
        );
        return;
      }

      setCooldown(60);

      setMessage(
        `A new 6-digit verification code was sent to ${cleanEmail}.`
      );
    } catch (err) {
      console.error('Resend OTP failed:', err);

      setError(
        'Unable to resend the verification code. Please try again.'
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="auth">
      <div className="authCard">

        {/* Logo */}
        <img
          src="/logo.png"
          alt="The Venue Search"
        />

        {/* Page label */}
        <span className="kicker">
          WELCOME TO THE VENUE SEARCH
        </span>

        {/* Heading */}
        <h1>
          {step === 'details'
            ? 'Sign in to The Venue Search.'
            : 'Verify your email.'}
        </h1>

        {/* Description */}
        <p>
          {step === 'details'
            ? "Enter your details to continue — we'll create your account automatically if this is your first time. We will send a secure 6-digit verification code to your email."
            : `Enter the 6-digit code we sent to ${email
                .trim()
                .toLowerCase()}.`}
        </p>

        {/* =========================================
            STEP 1 — USER DETAILS
           ========================================= */}

        {step === 'details' ? (
          <form onSubmit={sendCode}>

            {/* Username */}
            <label>
              Username

              <input
                required
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                placeholder="Your name"
                autoComplete="name"
              />
            </label>

            {/* Email */}
            <label>
              Email address

              <input
                required
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            {/* Mobile */}
            <label>
              Mobile number

              <input
                required
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="+91 98765 43210"
                autoComplete="tel"
              />
            </label>

            {/* Send OTP */}
            <button
              type="submit"
              data-cursor="open"
              disabled={loading}
              className="primaryBtn full"
            >
              {loading
                ? 'Sending code…'
                : 'Send verification code →'}
            </button>
          </form>
        ) : (

          /* =========================================
             STEP 2 — OTP VERIFICATION
             ========================================= */

          <form onSubmit={verifyCode}>

            {/* OTP */}
            <label>
              Verification code

              <input
                required
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"

                /*
                 * Frontend accepts maximum 6 characters.
                 */
                maxLength={6}

                value={otp}

                onChange={(e) => {
                  /*
                   * Remove anything that isn't a number
                   * and limit the value to 6 digits.
                   */
                  const value = e.target.value
                    .replace(/\D/g, '')
                    .slice(0, 6);

                  setOtp(value);
                }}

                placeholder="000000"
                className="otpInput"
                autoFocus
              />
            </label>

            {/* Verify button */}
            <button
              type="submit"
              data-cursor="open"
              disabled={loading}
              className="primaryBtn full"
            >
              {loading
                ? 'Verifying…'
                : 'Verify & continue →'}
            </button>

            {/* OTP actions */}
            <div className="authActions">

              {/* Change details */}
              <button
                type="button"
                className="textBtn"
                onClick={() => {
                  setStep('details');
                  setOtp('');
                  setError('');
                  setMessage('');
                }}
              >
                ← Change details
              </button>

              {/* Resend */}
              <button
                type="button"
                className="textBtn"
                disabled={
                  cooldown > 0 || resending
                }
                onClick={resendCode}
              >
                {resending
                  ? 'Sending…'
                  : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : 'Resend code'}
              </button>

            </div>
          </form>
        )}

        {/* Success/info message */}
        {message && (
          <small className="authMessage">
            {message}
          </small>
        )}

        {/* Error message */}
        {error && (
          <small className="error">
            {error}
          </small>
        )}

        {/* Terms */}
        <small>
          By continuing, you agree to use Venue Search
          for genuine venue enquiries and bookings.
        </small>

      </div>
    </main>
  );
}