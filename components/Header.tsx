'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '../lib/supabase-browser';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  /*
   * Header scroll effect
   */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  /*
   * Load authenticated user and profile
   */
  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user ?? null);

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email, mobile, role')
          .eq('id', user.id)
          .maybeSingle();

        setProfile(profileData ?? null);
      }
    }

    loadUser();

    /*
     * Listen for authentication changes
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;

        setUser(currentUser);

        if (currentUser) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email, mobile, role')
            .eq('id', currentUser.id)
            .maybeSingle();

          setProfile(profileData ?? null);
        } else {
          setProfile(null);
          setProfileOpen(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /*
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  /*
   * Sign out
   */
  async function handleSignOut() {
    const supabase = createClient();

    await supabase.auth.signOut();

    setUser(null);
    setProfile(null);
    setProfileOpen(false);

    window.location.href = '/';
  }

  /*
   * Admin account
   */
  const isAdmin =
    user?.email?.toLowerCase() ===
    'thevenuesearch@gmail.com';

  /*
   * User display information
   */
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.username ||
    'My Account';

  const displayEmail =
    profile?.email ||
    user?.email ||
    '';

  /*
   * Generate initials
   */
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (name: string) => name[0]
      )
      .join('')
      .toUpperCase() || 'U';

  return (
    <header
      className={
        scrolled
          ? 'nav scrolled'
          : 'nav'
      }
    >
      {/* =========================================
          BRAND
         ========================================= */}

      <Link
        href="/"
        className="brand"
      >
        <img
          src="/logo.png"
          alt="The Venue Search"
        />

        <span>
          The Venue
          <br />
          <b>Search.</b>
        </span>
      </Link>

      {/* =========================================
          MAIN NAVIGATION
         ========================================= */}

      <nav>
        <Link href="/explore">
          Explore
        </Link>

        <Link href="/collections">
          Collections
        </Link>

        <Link href="/how-it-works">
          How it works
        </Link>

        <Link href="/for-venues">
          For venues
        </Link>
      </nav>

      {/* =========================================
          RIGHT SIDE ACTIONS
         ========================================= */}

      <div className="navActions">

        {/* Shortlist */}
        <Link
          className="textBtn"
          href="/wishlist"
          aria-label="Shortlist"
          title="Shortlist"
        >
          ♡
        </Link>

        {/* =======================================
            LOGGED OUT
           ======================================= */}

        {!user && (
          <Link
            data-cursor="view"
            className="outlineBtn"
            href="/login"
          >
            Sign in
          </Link>
        )}

        {/* =======================================
            LOGGED IN
           ======================================= */}

        {user && (
          <div
            className="profileMenu"
            ref={profileRef}
          >

            {/* User avatar only — NO ARROW */}
            <button
              type="button"
              className="profileTrigger"
              onClick={() =>
                setProfileOpen(
                  (value) => !value
                )
              }
              aria-label="Open account menu"
              aria-expanded={profileOpen}
            >
              <span className="profileAvatar">
                {initials}
              </span>
            </button>

            {/* =================================
                PROFILE DROPDOWN
               ================================= */}

            {profileOpen && (
              <div className="profileDropdown">

                {/* User information */}
                <div className="profileDropdownHeader">

                  <div className="profileLargeAvatar">
                    {initials}
                  </div>

                  <div className="profileIdentity">
                    <strong>
                      {displayName}
                    </strong>

                    <span>
                      {displayEmail}
                    </span>
                  </div>

                </div>

                <div className="profileDivider" />

                {/* My Profile */}
                <Link
                  href="/profile"
                  className="profileMenuItem"
                  onClick={() =>
                    setProfileOpen(false)
                  }
                >
                  <span className="profileMenuIcon">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    >
                      <circle
                        cx="12"
                        cy="8"
                        r="4"
                      />

                      <path
                        d="M4 21c.8-4.1 3.5-6 8-6s7.2 1.9 8 6"
                      />
                    </svg>
                  </span>

                  <span>
                    <strong>
                      My Profile
                    </strong>

                    <small>
                      Personal details
                    </small>
                  </span>
                </Link>

                {/* My Shortlist */}
                <Link
                  href="/wishlist"
                  className="profileMenuItem"
                  onClick={() =>
                    setProfileOpen(false)
                  }
                >
                  <span className="profileMenuIcon">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    >
                      <path d="M20.8 8.7c0 5.5-8.8 10.3-8.8 10.3S3.2 14.2 3.2 8.7A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z" />
                    </svg>
                  </span>

                  <span>
                    <strong>
                      My Shortlist
                    </strong>

                    <small>
                      Saved venues
                    </small>
                  </span>
                </Link>

                {/* My Bookings */}
                <Link
                  href="/book"
                  className="profileMenuItem"
                  onClick={() =>
                    setProfileOpen(false)
                  }
                >
                  <span className="profileMenuIcon">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    >
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="16"
                        rx="2"
                      />

                      <path d="M16 3v4M8 3v4M3 10h18" />
                    </svg>
                  </span>

                  <span>
                    <strong>
                      My Bookings
                    </strong>

                    <small>
                      Enquiries & bookings
                    </small>
                  </span>
                </Link>

                {/* =================================
                    ADMIN ONLY
                   ================================= */}

                {isAdmin && (
                  <>
                    <div className="profileDivider" />

                    <Link
                      href="/planner"
                      className="profileMenuItem adminMenuItem"
                      onClick={() =>
                        setProfileOpen(false)
                      }
                    >
                      <span className="profileMenuIcon">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        >
                          <rect
                            x="3"
                            y="3"
                            width="7"
                            height="7"
                            rx="1"
                          />

                          <rect
                            x="14"
                            y="3"
                            width="7"
                            height="7"
                            rx="1"
                          />

                          <rect
                            x="3"
                            y="14"
                            width="7"
                            height="7"
                            rx="1"
                          />

                          <rect
                            x="14"
                            y="14"
                            width="7"
                            height="7"
                            rx="1"
                          />
                        </svg>
                      </span>

                      <span>
                        <strong>
                          Planner
                        </strong>

                        <small>
                          Admin dashboard
                        </small>
                      </span>
                    </Link>
                  </>
                )}

                <div className="profileDivider" />

                {/* Sign out */}
                <button
                  type="button"
                  className="profileMenuItem profileSignOut"
                  onClick={handleSignOut}
                >
                  <span className="profileMenuIcon">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    >
                      <path d="M10 17l5-5-5-5" />
                      <path d="M15 12H3" />
                      <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
                    </svg>
                  </span>

                  <span>
                    <strong>
                      Sign out
                    </strong>

                    <small>
                      End this session
                    </small>
                  </span>
                </button>

              </div>
            )}
          </div>
        )}

        {/* Find your venue */}
        <Link
          data-cursor="open"
          className="primaryBtn"
          href="/explore"
        >
          Find your venue
        </Link>

      </div>
    </header>
  );
}