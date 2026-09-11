'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase-browser';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      setUser(user);

      const { data: profileData } =
        await supabase
          .from('profiles')
          .select(
            'full_name, email, mobile, role, created_at'
          )
          .eq('id', user.id)
          .maybeSingle();

      setProfile(profileData);
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  if (loading) {
    return (
      <main className="profilePage">
        <div className="profilePageLoading">
          Loading your profile...
        </div>
      </main>
    );
  }

  const name =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.username ||
    'Guest';

  const email =
    profile?.email ||
    user?.email ||
    '';

  const mobile =
    profile?.mobile ||
    'Not added';

  return (
    <main className="profilePage">

      <div className="profilePageInner">

        {/* Header */}
        <div className="profilePageIntro">

          <span className="kicker">
            YOUR ACCOUNT
          </span>

          <h1>
            Welcome, {name.split(' ')[0]}.
          </h1>

          <p>
            Manage your account and keep track of
            the venues you're considering.
          </p>

        </div>

        <div className="profileGrid">

          {/* Personal details */}
          <section className="profileCard">

            <div className="profileCardHeading">
              <div>
                <span className="profileCardKicker">
                  ACCOUNT
                </span>

                <h2>
                  Personal details
                </h2>
              </div>

              <div className="profilePageAvatar">
  <svg
    width="30"
    height="30"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c.8-3.8 3.2-5.8 7-5.8s6.2 2 7 5.8" />
  </svg>
</div>
            </div>

            <div className="profileDetails">

              <div className="profileDetail">
                <span>
                  Full name
                </span>

                <strong>
                  {name}
                </strong>
              </div>

              <div className="profileDetail">
                <span>
                  Email address
                </span>

                <strong>
                  {email}
                </strong>
              </div>

              <div className="profileDetail">
                <span>
                  Mobile number
                </span>

                <strong>
                  {mobile}
                </strong>
              </div>

            </div>

          </section>

          {/* Shortlist */}
          <section className="profileCard profileShortlistCard">

            <div className="profileCardHeading">
              <div>
                <span className="profileCardKicker">
                  YOUR VENUES
                </span>

                <h2>
                  Your shortlist
                </h2>
              </div>

              <span className="profileHeart">
                ♡
              </span>
            </div>

            <p className="profileCardDescription">
              Your saved venues will appear here
              as you explore The Venue Search.
            </p>

            <Link
              href="/wishlist"
              className="primaryBtn"
            >
              View my shortlist →
            </Link>

          </section>

        </div>

        {/* Quick actions */}
        <section className="profileQuickActions">

          <Link
            href="/wishlist"
            className="profileQuickAction"
          >
            <span>♡</span>

            <div>
              <strong>
                Shortlisted venues
              </strong>

              <small>
                View venues you've saved
              </small>
            </div>

            <b>→</b>
          </Link>

          <Link
            href="/book"
            className="profileQuickAction"
          >
            <span>◷</span>

            <div>
              <strong>
                My enquiries
              </strong>

              <small>
                View your venue enquiries
              </small>
            </div>

            <b>→</b>
          </Link>

          <Link
            href="/explore"
            className="profileQuickAction"
          >
            <span>⌕</span>

            <div>
              <strong>
                Explore venues
              </strong>

              <small>
                Discover your next venue
              </small>
            </div>

            <b>→</b>
          </Link>

        </section>

      </div>

    </main>
  );
}