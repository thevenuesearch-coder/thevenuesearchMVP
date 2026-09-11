'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase-browser';

export default function Wishlist() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUser(user);
      setLoading(false);
    }

    checkAuth();
  }, []);

  /*
   * Loading state
   */
  if (loading) {
    return (
      <main className="page narrow">
        <div className="centerIntro">
          <span className="kicker">YOUR SHORTLIST</span>
          <h1>Loading your shortlist.</h1>
          <p>
            Just a moment while we load your saved venues.
          </p>
        </div>
      </main>
    );
  }

  /*
   * User is NOT logged in
   */
  if (!user) {
    return (
      <main className="page narrow">
        <div className="centerIntro">
          <span className="kicker">
            YOUR SHORTLIST
          </span>

          <h1>
            Keep the places that feel right.
          </h1>

          <p>
            Sign in to save venues, compare them
            and bring them into a wedding workspace.
          </p>

          <Link
            data-cursor="open"
            className="primaryBtn"
            href="/login"
          >
            Sign in to continue →
          </Link>
        </div>
      </main>
    );
  }

  /*
   * User IS logged in
   */
  return (
    <main className="page narrow">
      <div className="centerIntro">

        <span className="kicker">
          YOUR SHORTLIST
        </span>

        <h1>
          Your saved places.
        </h1>

        <p>
          Your shortlisted venues will appear here
          as you explore The Venue Search.
        </p>

        <Link
          data-cursor="open"
          className="primaryBtn"
          href="/explore"
        >
          Explore venues →
        </Link>

      </div>
    </main>
  );
}