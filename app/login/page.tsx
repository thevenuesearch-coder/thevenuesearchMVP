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

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  function validateDetails() {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/[\s-]/g, '');

    if (cleanUsername.length < 2) return 'Please enter your username.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return 'Please enter a valid email address.';
    if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) return 'Please enter a valid mobile number.';
    return '';
  }

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
    const { error: otpError } = await createClient().auth.signInWithOtp({
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

    setLoading(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    setStep('otp');
    setCooldown(30);
    setMessage(`We sent a 6-digit verification code to ${cleanEmail}.`);
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    const cleanOtp = otp.replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setError('Please enter the 6-digit code sent to your email.');
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/[\s-]/g, '');
    const supabase = createClient();
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanOtp,
      type: 'email',
    });

    if (verifyError) {
      setLoading(false);
      setError(verifyError.message);
      return;
    }

    if (data.user) {
      await supabase.from('profiles').update({
        full_name: username.trim(),
        email: cleanEmail,
        mobile: cleanPhone,
      }).eq('id', data.user.id);
    }

    setLoading(false);
    router.replace('/planner');
  }

  async function resendCode() {
    if (cooldown > 0 || resending) return;
    setError('');
    setMessage('');
    setResending(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/[\s-]/g, '');
    const { error: resendError } = await createClient().auth.signInWithOtp({
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

    setResending(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setCooldown(30);
    setMessage(`A new verification code was sent to ${cleanEmail}.`);
  }

  return (
    <main className="auth">
      <div className="authCard">
        <img src="/logo.png" alt="The Venue Search" />
        <span className="kicker">WELCOME TO THE VENUE SEARCH</span>
        <h1>{step === 'details' ? 'Create your wedding workspace.' : 'Verify your email.'}</h1>
        <p>
          {step === 'details'
            ? 'Enter your details to get started. We will send a secure one-time code to your email.'
            : `Enter the 6-digit code we sent to ${email.trim().toLowerCase()}.`}
        </p>

        {step === 'details' ? (
          <form onSubmit={sendCode}>
            <label>
              Username
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
            <label>
              Email address
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
            <label>
              Mobile number
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                autoComplete="tel"
              />
            </label>
            <button data-cursor="open" disabled={loading} className="primaryBtn full">
              {loading ? 'Sending code…' : 'Send verification code →'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode}>
            <label>
              Verification code
              <input
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="otpInput"
                autoFocus
              />
            </label>
            <button data-cursor="open" disabled={loading} className="primaryBtn full">
              {loading ? 'Verifying…' : 'Verify & continue →'}
            </button>
            <div className="authActions">
              <button type="button" className="textBtn" onClick={() => { setStep('details'); setOtp(''); setError(''); setMessage(''); }}>
                ← Change details
              </button>
              <button type="button" className="textBtn" disabled={cooldown > 0 || resending} onClick={resendCode}>
                {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        {message && <small className="authMessage">{message}</small>}
        {error && <small className="error">{error}</small>}
        <small>By continuing, you agree to use Venue Search for genuine venue enquiries and bookings.</small>
      </div>
    </main>
  );
}
