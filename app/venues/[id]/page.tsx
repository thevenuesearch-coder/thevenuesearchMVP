'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getVenueById } from '../../../lib/data';

export default function VenueDetailsPage() {
  const params = useParams();

  const venueId =
    typeof params?.id === 'string'
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : undefined;

  const venue = venueId ? getVenueById(venueId) : undefined;

  const [selectedSpaceIndex, setSelectedSpaceIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showAllSpaces, setShowAllSpaces] = useState(false);

  const selectedSpace = venue?.venueSpaces?.[selectedSpaceIndex];

  const displayedSpaces = useMemo(() => {
    if (!venue?.venueSpaces) return [];

    return showAllSpaces
      ? venue.venueSpaces
      : venue.venueSpaces.slice(0, 6);
  }, [venue, showAllSpaces]);

  if (!venue) {
    return (
      <main className="not-found">
        <div>
          <div className="not-found-icon">⌂</div>

          <h1>Venue not found</h1>

          <p>
            The venue you are looking for could not be found.
          </p>

          <Link href="/" className="back-button">
            Back to venues
          </Link>
        </div>

        <style jsx>{`
          .not-found {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f7f5f0;
            padding: 40px;
            text-align: center;
            color: #161616;
          }

          .not-found-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 24px;
            border-radius: 50%;
            background: #111;
            color: white;
            display: grid;
            place-items: center;
            font-size: 25px;
          }

          .not-found h1 {
            margin: 0 0 10px;
            font-family: Georgia, serif;
            font-size: 42px;
          }

          .not-found p {
            color: #777;
            margin-bottom: 28px;
          }

          .back-button {
            display: inline-flex;
            padding: 13px 22px;
            border-radius: 999px;
            background: #111;
            color: white;
            text-decoration: none;
            font-weight: 600;
          }
        `}</style>
      </main>
    );
  }

  const heroImage =
    selectedSpace?.image ||
    venue.image ||
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1800&q=85';

  const bookHref = `/book?venue=${encodeURIComponent(
    venue.id
  )}&space=${encodeURIComponent(selectedSpace?.id || '')}`;

  const enquiryHref = `/enquiry?venue=${encodeURIComponent(
  venue.id
)}&space=${encodeURIComponent(
  selectedSpace?.id || ''
)}`;

  return (
    <main className="venue-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="site-header">

        <Link href="/" className="brand">

          <div className="brand-mark">
            <span>V</span>
          </div>

          <div className="brand-text">
            <strong>The Venue</strong>
            <span>Search.</span>
          </div>

        </Link>

        <nav className="desktop-nav">
          <Link href="/">Explore</Link>
          <Link href="/collections">Collections</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/for-venues">For venues</Link>
        </nav>

        <div className="header-actions">

          <Link
            href="/wishlist"
            className="header-heart"
            aria-label="Wishlist"
          >
            ♡
          </Link>

          <Link
            href="/profile"
            className="profile-button"
          >
            VS
          </Link>

          <Link
            href="/"
            className="find-button"
          >
            Find your venue
          </Link>

        </div>

      </header>

      {/* =====================================================
          BREADCRUMB
      ===================================================== */}

      <div className="page-container breadcrumb-wrap">

        <Link href="/">Explore</Link>

        <span>/</span>

        <span>
          {venue.destination || venue.city}
        </span>

        <span>/</span>

        <strong>{venue.name}</strong>

      </div>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="hero-section">

        <div className="hero-image-wrap">

          <img
            src={heroImage}
            alt={selectedSpace?.name || venue.name}
            className="hero-image"
          />

          <div className="hero-overlay" />

          <div className="hero-top-actions">

            <Link
              href="/"
              className="back-circle"
              aria-label="Back"
            >
              ←
            </Link>

            <button
              type="button"
              className={`hero-wishlist ${
                liked ? 'liked' : ''
              }`}
              onClick={() => setLiked(!liked)}
              aria-label="Add to wishlist"
            >
              {liked ? '♥' : '♡'}
            </button>

          </div>

          <div className="hero-counter">
            {selectedSpaceIndex + 1} /{' '}
            {venue.venueSpaces?.length || 1}
          </div>

          <div className="hero-content">

            <div className="verified-pill">
              <span>✓</span>
              Verified venue
            </div>

            <div className="hero-location">
              {venue.city}, {venue.country}
            </div>

            <h1>{venue.name}</h1>

            <div className="hero-meta">

              <span>{venue.type}</span>

              <i>•</i>

              <span>★ {venue.rating}</span>

              <i>•</i>

              <span>
                Up to {venue.capacity.toLocaleString()} guests
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          QUICK INFORMATION
      ===================================================== */}

      <section className="quick-info">

        <div className="page-container quick-info-grid">

          <div className="quick-item">

            <span className="quick-icon">
              ♧
            </span>

            <div>
              <small>Venue type</small>

              <strong>
                {venue.type}
              </strong>
            </div>

          </div>

          <div className="quick-item">

            <span className="quick-icon">
              ◉
            </span>

            <div>
              <small>Guest capacity</small>

              <strong>
                Up to {venue.capacity.toLocaleString()}
              </strong>
            </div>

          </div>

          <div className="quick-item">

            <span className="quick-icon">
              ⌖
            </span>

            <div>
              <small>Location</small>

              <strong>
                {venue.city}
              </strong>
            </div>

          </div>

          <div className="quick-item">

            <span className="quick-icon">
              ★
            </span>

            <div>
              <small>Guest rating</small>

              <strong>
                {venue.rating} / 5
              </strong>
            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <section className="page-container content-section">

        <div className="main-column">

          {/* =================================================
              ABOUT VENUE
          ================================================= */}

          <section className="about-section">

            <div className="section-eyebrow">
              THE VENUE
            </div>

            <h2>
              A destination designed
              <br />
              for memorable celebrations.
            </h2>

            <p className="description">
              {venue.desc ||
                `Discover ${venue.name}, a premium destination for weddings, celebrations and special occasions in ${venue.city}.`}
            </p>

            <div className="tag-list">

              {venue.tags?.slice(0, 8).map((tag) => (
                <span key={tag}>
                  {tag}
                </span>
              ))}

            </div>

          </section>

          {/* =================================================
              VENUE SPACES
          ================================================= */}

          <section className="spaces-section">

            <div className="section-heading">

              <div>

                <div className="section-eyebrow">
                  EXPLORE THE SPACES
                </div>

                <h2>
                  Spaces at this property
                </h2>

              </div>

              <span className="space-count">
                {venue.venueSpaces?.length || 0} spaces
              </span>

            </div>

            {selectedSpace && (

              <div className="featured-space">

                <div className="featured-space-image">

                  <img
                    src={selectedSpace.image}
                    alt={selectedSpace.name}
                  />

                  <div className="featured-image-overlay" />

                  <div className="space-image-label">
                    Selected space
                  </div>

                </div>

                <div className="featured-space-content">

                  <div>

                    <div className="section-eyebrow">
                      VENUE SPACE
                    </div>

                    <h3>
                      {selectedSpace.name}
                    </h3>

                    <p>
                      {selectedSpace.description}
                    </p>

                    <div className="space-details">

                      <div>

                        <span>
                          Capacity
                        </span>

                        <strong>
                          Up to{' '}
                          {selectedSpace.capacity.toLocaleString()}{' '}
                          guests
                        </strong>

                      </div>

                      <div>

                        <span>
                          Best for
                        </span>

                        <strong>
                          {selectedSpace.tags
                            ?.slice(0, 2)
                            .join(' · ') ||
                            'Weddings & Events'}
                        </strong>

                      </div>

                    </div>

                  </div>

                  <Link
                    href={bookHref}
                    className="space-book-button"
                  >
                    Book this space
                    <span>→</span>
                  </Link>

                </div>

              </div>

            )}

            <div className="space-grid">

              {displayedSpaces.map((space, index) => (

                <button
                  key={space.id}
                  type="button"
                  className={`space-card ${
                    selectedSpaceIndex === index
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setSelectedSpaceIndex(index)
                  }
                >

                  <div className="space-card-image">

                    <img
                      src={space.image}
                      alt={space.name}
                    />

                    {selectedSpaceIndex === index && (
                      <div className="selected-mark">
                        ✓
                      </div>
                    )}

                  </div>

                  <div className="space-card-content">

                    <h4>
                      {space.name}
                    </h4>

                    <span>
                      Up to{' '}
                      {space.capacity.toLocaleString()}{' '}
                      guests
                    </span>

                  </div>

                </button>

              ))}

            </div>

            {venue.venueSpaces?.length > 6 && (

              <button
                type="button"
                className="view-all-button"
                onClick={() =>
                  setShowAllSpaces(!showAllSpaces)
                }
              >

                {showAllSpaces
                  ? 'Show fewer spaces'
                  : `View all ${venue.venueSpaces.length} spaces`}

                <span>
                  {showAllSpaces ? '↑' : '↓'}
                </span>

              </button>

            )}

          </section>

          {/* =================================================
              AMENITIES
          ================================================= */}

          <section className="amenities-section">

            <div className="section-eyebrow">
              AMENITIES & FEATURES
            </div>

            <h2>
              Everything you need for your celebration.
            </h2>

            <div className="amenity-grid">

              {(venue.tags?.length
                ? venue.tags.slice(0, 8)
                : [
                    'Wedding celebrations',
                    'Event spaces',
                    'Premium hospitality',
                    'Guest accommodation',
                    'Dining',
                    'Parking',
                    'Event support',
                    'Professional service',
                  ]
              ).map((item, index) => (

                <div
                  className="amenity"
                  key={`${item}-${index}`}
                >

                  <span>✓</span>

                  {item}

                </div>

              ))}

            </div>

          </section>

          {/* =================================================
              LOCATION
          ================================================= */}

          <section className="location-section">

            <div className="section-eyebrow">
              LOCATION
            </div>

            <h2>
              Find the property
            </h2>

            <div className="location-card">

              <div className="location-placeholder">

                <div className="map-pin">
                  ⌖
                </div>

                <div>

                  <strong>
                    {venue.name}
                  </strong>

                  <span>
                    {venue.city}, {venue.country}
                  </span>

                </div>

              </div>

              <div className="location-details">

                <span>
                  Destination
                </span>

                <strong>
                  {venue.destination || venue.city}
                </strong>

              </div>

            </div>

          </section>

        </div>

        {/* ===================================================
            BOOKING / ENQUIRY SIDEBAR
        =================================================== */}

        <aside className="booking-column">

          <div className="booking-card">

            <div className="booking-card-top">

              <div>

                <span className="booking-eyebrow">
                  PLAN YOUR EVENT
                </span>

                <h3>
                  Ready to
                  <br />
                  celebrate?
                </h3>

              </div>

              <button
                type="button"
                className={`card-heart ${
                  liked ? 'liked' : ''
                }`}
                onClick={() =>
                  setLiked(!liked)
                }
                aria-label="Add to wishlist"
              >
                {liked ? '♥' : '♡'}
              </button>

            </div>

            <p className="booking-description">
              Choose how you would like to proceed
              with {venue.name}.
            </p>

            {/* ============================================
                PRIMARY BUTTON
            ============================================ */}

            <Link
              href={bookHref}
              className="booking-action booking-primary"
            >

              <span className="booking-action-icon">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
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

              <span className="booking-action-content">

                <strong>
                  Book The Venue
                </strong>

                <small>
                  Secure your date in minutes
                </small>

              </span>

              <span className="booking-action-arrow">
                →
              </span>

            </Link>

            {/* ============================================
                SECONDARY BUTTON
            ============================================ */}

            <Link
              href={enquiryHref}
              className="booking-action booking-secondary"
            >

              <span className="booking-action-icon">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="14"
                    rx="2"
                  />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </span>

              <span className="booking-action-content">

                <strong>
                  Drop an Enquiry
                </strong>

                <small>
                  Get a quick response from our team
                </small>

              </span>

              <span className="booking-action-arrow">
                →
              </span>

            </Link>

            <div className="booking-note">

              <span>✓</span>

              <p>
                Our team will assist you with the
                next step.
              </p>

            </div>

          </div>

          {/* ================================================
              HELP CARD
          ================================================= */}

          <div className="help-card">

            <div className="help-icon">
              ?
            </div>

            <div>

              <strong>
                Need help choosing?
              </strong>

              <p>
                Our venue team can help you find
                the right space for your celebration.
              </p>

              <Link href="/contact">
                Talk to our team →
              </Link>

            </div>

          </div>

        </aside>

      </section>

      {/* =====================================================
          FINAL CTA
      ===================================================== */}

      <section className="final-cta">

        <div className="final-cta-inner">

          <div className="section-eyebrow">
            READY WHEN YOU ARE
          </div>

          <h2>
            Make your celebration
            <br />
            unforgettable.
          </h2>

          <p>
            Choose your preferred option and
            start planning your event.
          </p>

          <div className="final-actions">

            <Link
              href={bookHref}
              className="final-book-button"
            >
              Book The Venue
              <span>→</span>
            </Link>

            <Link
              href={enquiryHref}
              className="final-enquiry-button"
            >
              Drop an Enquiry
              <span>→</span>
            </Link>

          </div>

        </div>

      </section>

      {/* =====================================================
          STYLES
      ===================================================== */}

      <style jsx>{`

        * {
          box-sizing: border-box;
        }

        .venue-page {
          min-height: 100vh;
          background: #f8f7f3;
          color: #161616;
        }

        .page-container {
          width: min(
            1380px,
            calc(100% - 64px)
          );
          margin: 0 auto;
        }

        /* ================================================
           HEADER
        ================================================= */

        .site-header {
          height: 88px;
          padding: 0 42px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #101010;
          color: white;
          position: relative;
          z-index: 20;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: white;
        }

        .brand-mark {
          width: 42px;
          height: 42px;
          border: 1px solid
            rgba(255,255,255,0.25);
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-family: Georgia, serif;
          font-size: 18px;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
          font-size: 16px;
        }

        .brand-text span {
          color: #39b8dc;
          font-weight: 700;
          margin-top: 3px;
        }

        .desktop-nav {
          display: flex;
          gap: 42px;
          margin-left: 80px;
        }

        .desktop-nav a {
          color: rgba(
            255,
            255,
            255,
            0.8
          );
          text-decoration: none;
          font-size: 14px;
          transition: 0.2s ease;
        }

        .desktop-nav a:hover {
          color: white;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .header-heart {
          color: white;
          font-size: 25px;
          text-decoration: none;
          margin-right: 8px;
        }

        .profile-button {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #f5f3ed;
          color: #111;
          display: grid;
          place-items: center;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          border: 1px solid
            rgba(255,255,255,0.3);
        }

        .find-button {
          text-decoration: none;
          color: white;
          background: linear-gradient(
            135deg,
            #2563eb,
            #1bb5cf
          );
          padding: 15px 24px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 14px;
        }

        /* ================================================
           BREADCRUMB
        ================================================= */

        .breadcrumb-wrap {
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 24px 0;
          font-size: 12px;
          color: #858585;
        }

        .breadcrumb-wrap a {
          color: #555;
          text-decoration: none;
        }

        .breadcrumb-wrap strong {
          color: #222;
          font-weight: 600;
        }

        /* ================================================
           HERO
        ================================================= */

        .hero-section {
          width: min(
            1500px,
            calc(100% - 40px)
          );
          margin: 0 auto;
        }

        .hero-image-wrap {
          height: 650px;
          position: relative;
          overflow: hidden;
          border-radius: 4px;
          background: #ddd;
        }

        .hero-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              to bottom,
              rgba(0,0,0,0.2) 0%,
              transparent 30%,
              rgba(0,0,0,0.72) 100%
            );
        }

        .hero-top-actions {
          position: absolute;
          left: 26px;
          right: 26px;
          top: 26px;
          display: flex;
          justify-content: space-between;
        }

        .back-circle,
        .hero-wishlist {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          border: 1px solid
            rgba(255,255,255,0.45);
          background: rgba(0,0,0,0.25);
          backdrop-filter: blur(10px);
          color: white;
          font-size: 21px;
          text-decoration: none;
          cursor: pointer;
        }

        .hero-wishlist.liked {
          color: #ff5d6c;
        }

        .hero-counter {
          position: absolute;
          bottom: 24px;
          right: 24px;
          background: rgba(0,0,0,0.48);
          color: white;
          padding: 10px 15px;
          border-radius: 999px;
          backdrop-filter: blur(10px);
          font-size: 12px;
          letter-spacing: 0.05em;
        }

        .hero-content {
          position: absolute;
          left: 52px;
          bottom: 48px;
          color: white;
          max-width: 850px;
        }

        .verified-pill {
          display: inline-flex;
          gap: 7px;
          align-items: center;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.15);
          border: 1px solid
            rgba(255,255,255,0.3);
          backdrop-filter: blur(10px);
          font-size: 11px;
          margin-bottom: 17px;
        }

        .verified-pill span {
          color: #6ee7b7;
        }

        .hero-location {
          font-size: 13px;
          opacity: 0.85;
          margin-bottom: 10px;
          letter-spacing: 0.03em;
        }

        .hero-content h1 {
          margin: 0;
          font-family: Georgia,
            'Times New Roman',
            serif;
          font-size: clamp(
            42px,
            5vw,
            76px
          );
          line-height: 0.98;
          font-weight: 400;
          letter-spacing: -0.04em;
        }

        .hero-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 18px;
          font-size: 14px;
          opacity: 0.92;
        }

        .hero-meta i {
          opacity: 0.5;
        }

        /* ================================================
           QUICK INFO
        ================================================= */

        .quick-info {
          border-bottom: 1px solid #dedbd4;
          border-top: 1px solid #dedbd4;
          background: #fbfaf7;
        }

        .quick-info-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
        }

        .quick-item {
          padding: 28px 26px;
          display: flex;
          gap: 14px;
          align-items: center;
          border-right: 1px solid #dedbd4;
        }

        .quick-item:first-child {
          border-left: 1px solid #dedbd4;
        }

        .quick-icon {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #f0eee8;
          display: grid;
          place-items: center;
          font-size: 16px;
        }

        .quick-item small {
          display: block;
          color: #8a8882;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 5px;
        }

        .quick-item strong {
          font-size: 14px;
          font-weight: 600;
        }

        /* ================================================
           CONTENT
        ================================================= */

        .content-section {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            390px;
          gap: 90px;
          padding-top: 100px;
          padding-bottom: 120px;
          align-items: start;
        }

        .main-column {
          min-width: 0;
        }

        .section-eyebrow {
          color: #8d897f;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-bottom: 18px;
        }

        .about-section {
          max-width: 820px;
          padding-bottom: 100px;
        }

        .about-section h2,
        .spaces-section h2,
        .amenities-section h2,
        .location-section h2 {
          font-family: Georgia,
            'Times New Roman',
            serif;
          font-size: clamp(
            36px,
            4vw,
            54px
          );
          line-height: 1.05;
          font-weight: 400;
          letter-spacing: -0.035em;
          margin: 0;
        }

        .description {
          color: #66625c;
          font-size: 17px;
          line-height: 1.8;
          max-width: 720px;
          margin: 28px 0;
        }

        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag-list span {
          border: 1px solid #dad6ce;
          background: #fbfaf7;
          padding: 8px 13px;
          border-radius: 999px;
          color: #65615a;
          font-size: 11px;
        }

        /* ================================================
           SPACES
        ================================================= */

        .spaces-section {
          padding-bottom: 110px;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 30px;
        }

        .space-count {
          color: #88847c;
          font-size: 13px;
        }

        .featured-space {
          display: grid;
          grid-template-columns:
            1.15fr 0.85fr;
          min-height: 440px;
          background: #111;
          color: white;
          overflow: hidden;
          border-radius: 3px;
          margin-bottom: 18px;
        }

        .featured-space-image {
          min-height: 440px;
          position: relative;
        }

        .featured-space-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .featured-image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(0,0,0,0.35),
            transparent 60%
          );
        }

        .space-image-label {
          position: absolute;
          bottom: 20px;
          left: 20px;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(8px);
          padding: 9px 12px;
          border-radius: 999px;
        }

        .featured-space-content {
          padding: 46px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .featured-space-content .section-eyebrow {
          color: #9f9b91;
        }

        .featured-space-content h3 {
          font-family: Georgia, serif;
          font-size: 42px;
          font-weight: 400;
          margin: 0 0 18px;
        }

        .featured-space-content p {
          color: #aaa8a1;
          line-height: 1.7;
          font-size: 14px;
          margin: 0;
        }

        .space-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-top: 35px;
          padding-top: 25px;
          border-top: 1px solid
            rgba(255,255,255,0.14);
        }

        .space-details span {
          display: block;
          color: #8d8a83;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 7px;
        }

        .space-details strong {
          font-size: 13px;
          font-weight: 500;
          line-height: 1.5;
        }

        .space-book-button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #111;
          background: #f4f1e9;
          padding: 15px 18px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          margin-top: 30px;
        }

        .space-grid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 12px;
        }

        .space-card {
          padding: 0;
          border: 1px solid #dedbd4;
          background: #fbfaf7;
          text-align: left;
          cursor: pointer;
          transition: 0.25s ease;
        }

        .space-card:hover,
        .space-card.active {
          border-color: #111;
          transform: translateY(-2px);
        }

        .space-card-image {
          height: 145px;
          position: relative;
          overflow: hidden;
        }

        .space-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }

        .space-card:hover img {
          transform: scale(1.04);
        }

        .selected-mark {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 27px;
          height: 27px;
          border-radius: 50%;
          background: white;
          color: #111;
          display: grid;
          place-items: center;
          font-size: 12px;
          font-weight: 700;
        }

        .space-card-content {
          padding: 15px;
        }

        .space-card-content h4 {
          margin: 0 0 6px;
          font-size: 13px;
          font-weight: 700;
        }

        .space-card-content span {
          color: #87837b;
          font-size: 11px;
        }

        .view-all-button {
          margin-top: 20px;
          background: transparent;
          border: 1px solid #cfcac0;
          padding: 13px 18px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .view-all-button span {
          margin-left: 10px;
        }

        /* ================================================
           AMENITIES
        ================================================= */

        .amenities-section {
          padding: 100px 0;
          border-top: 1px solid #dedbd4;
        }

        .amenities-section h2 {
          max-width: 650px;
          margin-bottom: 45px;
        }

        .amenity-grid {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          border-top: 1px solid #dedbd4;
        }

        .amenity {
          padding: 20px 0;
          border-bottom: 1px solid #dedbd4;
          display: flex;
          align-items: center;
          gap: 13px;
          color: #55514a;
          font-size: 14px;
        }

        .amenity:nth-child(odd) {
          margin-right: 40px;
        }

        .amenity span {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #e9e6de;
          display: grid;
          place-items: center;
          font-size: 11px;
          color: #444;
        }

        /* ================================================
           LOCATION
        ================================================= */

        .location-section {
          padding-top: 100px;
        }

        .location-section h2 {
          margin-bottom: 30px;
        }

        .location-card {
          border: 1px solid #dedbd4;
          background: #fbfaf7;
        }

        .location-placeholder {
          min-height: 260px;
          background:
            linear-gradient(
              135deg,
              #e8e5dd 25%,
              #dedbd2 25%,
              #dedbd2 50%,
              #e8e5dd 50%,
              #e8e5dd 75%,
              #dedbd2 75%
            );
          background-size: 50px 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
        }

        .map-pin {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #111;
          color: white;
          display: grid;
          place-items: center;
          font-size: 20px;
        }

        .location-placeholder strong,
        .location-placeholder span {
          display: block;
        }

        .location-placeholder strong {
          font-size: 15px;
          margin-bottom: 4px;
        }

        .location-placeholder span {
          font-size: 12px;
          color: #777;
        }

        .location-details {
          padding: 20px;
          border-top: 1px solid #dedbd4;
        }

        .location-details span {
          display: block;
          color: #999;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 5px;
        }

        .location-details strong {
          font-size: 14px;
        }

        /* ================================================
           BOOKING CARD
        ================================================= */

        .booking-column {
          position: sticky;
          top: 25px;
        }

        .booking-card {
          background:
            radial-gradient(
              circle at 100% 0%,
              rgba(31, 111, 218, 0.10),
              transparent 35%
            ),
            #101010;
          color: white;
          padding: 32px;
          border-radius: 4px;
          border: 1px solid
            rgba(255,255,255,0.04);
          box-shadow:
            0 24px 70px
            rgba(0,0,0,0.15);
        }

        .booking-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .booking-eyebrow {
          color: #28bddb;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.18em;
        }

        .booking-card h3 {
          font-family: Georgia, serif;
          font-weight: 400;
          font-size: 39px;
          line-height: 1;
          letter-spacing: -0.025em;
          margin: 12px 0 0;
        }

        .card-heart {
          width: 46px;
          height: 46px;
          flex: 0 0 auto;
          border-radius: 50%;
          border: 1px solid
            rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.02);
          color: white;
          cursor: pointer;
          font-size: 21px;
          transition: 0.2s ease;
        }

        .card-heart:hover {
          border-color: rgba(
            255,
            255,
            255,
            0.45
          );
          background: rgba(
            255,
            255,
            255,
            0.06
          );
        }

        .card-heart.liked {
          color: #ff6673;
        }

        .booking-description {
          color: #a7a49d;
          font-size: 13px;
          line-height: 1.7;
          margin: 24px 0 26px;
        }

        /* ================================================
           ACTION BUTTONS
        ================================================= */

        .booking-action {
          width: 100%;
          min-height: 78px;
          display: grid;
          grid-template-columns: 42px 1fr 25px;
          align-items: center;
          gap: 14px;
          padding: 0 18px;
          text-decoration: none;
          border-radius: 12px;
          margin-bottom: 12px;
          transition:
            transform 0.22s ease,
            box-shadow 0.22s ease,
            border-color 0.22s ease,
            background 0.22s ease;
        }

        .booking-action:hover {
          transform: translateY(-2px);
        }

        .booking-primary {
          color: white;
          background: linear-gradient(
            135deg,
            #285bd1 0%,
            #287edc 45%,
            #20b9d1 100%
          );
          box-shadow:
            0 12px 28px
            rgba(35,139,218,0.18);
        }

        .booking-primary:hover {
          box-shadow:
            0 16px 35px
            rgba(35,139,218,0.3);
        }

        .booking-secondary {
          color: white;
          background: rgba(
            255,
            255,
            255,
            0.025
          );
          border: 1px solid
            rgba(255,255,255,0.38);
        }

        .booking-secondary:hover {
          background: rgba(
            255,
            255,
            255,
            0.07
          );
          border-color: rgba(
            255,
            255,
            255,
            0.7
          );
        }

        .booking-action-icon {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: rgba(
            255,
            255,
            255,
            0.12
          );
        }

        .booking-secondary .booking-action-icon {
          background: rgba(
            255,
            255,
            255,
            0.07
          );
        }

        .booking-action-icon svg {
          width: 20px;
          height: 20px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.7;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .booking-action-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .booking-action-content strong {
          font-size: 15px;
          line-height: 1.2;
          font-weight: 700;
        }

        .booking-action-content small {
          color: rgba(
            255,
            255,
            255,
            0.67
          );
          font-size: 10px;
          line-height: 1.3;
        }

        .booking-primary
          .booking-action-content
          small {
          color: rgba(
            255,
            255,
            255,
            0.78
          );
        }

        .booking-action-arrow {
          font-size: 22px;
          font-weight: 400;
          text-align: right;
          transition: transform 0.2s ease;
        }

        .booking-action:hover
          .booking-action-arrow {
          transform: translateX(4px);
        }

        .booking-note {
          display: flex;
          gap: 9px;
          align-items: flex-start;
          margin-top: 23px;
          padding-top: 20px;
          border-top: 1px solid
            rgba(255,255,255,0.10);
        }

        .booking-note > span {
          color: #67d19f;
          font-size: 12px;
        }

        .booking-note p {
          margin: 0;
          color: #77746d;
          font-size: 10px;
          line-height: 1.6;
        }

        /* ================================================
           HELP CARD
        ================================================= */

        .help-card {
          margin-top: 14px;
          padding: 22px;
          background: #eeece5;
          display: flex;
          gap: 14px;
          border-radius: 4px;
        }

        .help-icon {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #111;
          color: white;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
        }

        .help-card strong {
          display: block;
          font-size: 13px;
          margin-bottom: 5px;
        }

        .help-card p {
          color: #77736c;
          font-size: 11px;
          line-height: 1.6;
          margin: 0 0 10px;
        }

        .help-card a {
          color: #111;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
        }

        /* ================================================
           FINAL CTA
        ================================================= */

        .final-cta {
          background: #111;
          color: white;
          text-align: center;
          padding: 120px 30px;
        }

        .final-cta-inner {
          max-width: 700px;
          margin: 0 auto;
        }

        .final-cta .section-eyebrow {
          color: #88857e;
        }

        .final-cta h2 {
          font-family: Georgia, serif;
          font-weight: 400;
          font-size: clamp(
            45px,
            6vw,
            72px
          );
          line-height: 1;
          letter-spacing: -0.04em;
          margin: 0;
        }

        .final-cta p {
          color: #92908a;
          font-size: 14px;
          margin: 24px 0 30px;
        }

        .final-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .final-book-button,
        .final-enquiry-button {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 35px;
          min-width: 190px;
          padding: 16px 20px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          border-radius: 6px;
        }

        .final-book-button {
          background: linear-gradient(
            135deg,
            #285bd1,
            #20b9d1
          );
          color: white;
        }

        .final-enquiry-button {
          border: 1px solid
            rgba(255,255,255,0.3);
          color: white;
        }

        /* ================================================
           TABLET
        ================================================= */

        @media (max-width: 1050px) {

          .desktop-nav {
            gap: 20px;
            margin-left: 20px;
          }

          .content-section {
            grid-template-columns: 1fr;
          }

          .booking-column {
            position: static;
            order: -1;
          }

          .booking-card {
            max-width: 620px;
          }

        }

        /* ================================================
           MOBILE
        ================================================= */

        @media (max-width: 720px) {

          .page-container {
            width: min(
              100% - 32px,
              1380px
            );
          }

          .site-header {
            height: 72px;
            padding: 0 16px;
          }

          .desktop-nav,
          .find-button,
          .header-heart {
            display: none;
          }

          .brand-text {
            font-size: 14px;
          }

          .profile-button {
            width: 40px;
            height: 40px;
          }

          .breadcrumb-wrap {
            padding: 17px 0;
            overflow: hidden;
            white-space: nowrap;
          }

          .hero-section {
            width: 100%;
          }

          .hero-image-wrap {
            height: 600px;
            border-radius: 0;
          }

          .hero-content {
            left: 22px;
            right: 22px;
            bottom: 32px;
          }

          .hero-content h1 {
            font-size: 43px;
          }

          .hero-meta {
            flex-wrap: wrap;
            font-size: 12px;
          }

          .hero-counter {
            right: 20px;
            bottom: 20px;
          }

          .quick-info-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .quick-item {
            padding: 20px 15px;
            border-bottom: 1px solid #dedbd4;
          }

          .quick-item:first-child {
            border-left: 0;
          }

          .content-section {
            padding-top: 65px;
            padding-bottom: 80px;
            gap: 65px;
          }

          .about-section {
            padding-bottom: 65px;
          }

          .about-section h2,
          .spaces-section h2,
          .amenities-section h2,
          .location-section h2 {
            font-size: 37px;
          }

          .description {
            font-size: 15px;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
            gap: 10px;
          }

          .featured-space {
            grid-template-columns: 1fr;
          }

          .featured-space-image {
            height: 300px;
            min-height: 300px;
          }

          .featured-space-content {
            padding: 28px 22px;
          }

          .featured-space-content h3 {
            font-size: 34px;
          }

          .space-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .space-card-image {
            height: 120px;
          }

          .space-card-content {
            padding: 12px;
          }

          .amenities-section {
            padding: 70px 0;
          }

          .amenity-grid {
            grid-template-columns: 1fr;
          }

          .amenity:nth-child(odd) {
            margin-right: 0;
          }

          .location-section {
            padding-top: 70px;
          }

          .booking-card {
            padding: 26px 22px;
            max-width: none;
          }

          .booking-card h3 {
            font-size: 34px;
          }

          .booking-action {
            min-height: 74px;
          }

          .final-cta {
            padding: 90px 22px;
          }

          .final-cta h2 {
            font-size: 45px;
          }

          .final-actions {
            flex-direction: column;
          }

          .final-book-button,
          .final-enquiry-button {
            width: 100%;
            justify-content: space-between;
          }

        }

      `}</style>

    </main>
  );
}
