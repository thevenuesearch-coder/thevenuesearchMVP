'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { getVenueById } from '../../../lib/data';

export default function VenuePage() {
  const params = useParams();

  const venueId =
    typeof params?.id === 'string'
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : '';

  const venue = useMemo(
    () => getVenueById(venueId),
    [venueId]
  );

  const [activeImage, setActiveImage] = useState(0);
  const [selectedSpace, setSelectedSpace] = useState(0);
  const [saved, setSaved] = useState(false);

  if (!venue) {
    return (
      <main className="not-found">
        <div>
          <h1>Venue not found</h1>

          <Link href="/explore">
            ← Back to venues
          </Link>
        </div>

        <style jsx>{`
          .not-found {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #f7f5f0;
            color: #111;
            text-align: center;
          }

          .not-found h1 {
            font-family: Georgia, serif;
            font-size: 48px;
            font-weight: 400;
            margin-bottom: 20px;
          }

          .not-found a {
            color: #168fc1;
            text-decoration: none;
          }
        `}</style>
      </main>
    );
  }

  const spaces = venue.venueSpaces || [];

  const currentSpace =
    spaces[selectedSpace] || spaces[0];

  const galleryImages = [
    venue.image,
    ...spaces
      .map((space) => space.image)
      .filter(
        (image) =>
          image &&
          image !== venue.image
      ),
  ].filter(Boolean);

  const currentImage =
    galleryImages[activeImage] || venue.image;

  function previousImage() {
    setActiveImage((current) =>
      current === 0
        ? galleryImages.length - 1
        : current - 1
    );
  }

  function nextImage() {
    setActiveImage((current) =>
      current === galleryImages.length - 1
        ? 0
        : current + 1
    );
  }

  function selectSpace(index: number) {
    setSelectedSpace(index);

    const spaceImage =
      spaces[index]?.image;

    if (spaceImage) {
      const imageIndex =
        galleryImages.indexOf(spaceImage);

      if (imageIndex >= 0) {
        setActiveImage(imageIndex);
      }
    }
  }

  return (
    <main className="venue-page">

      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="hero">

        <img
          src={currentImage}
          alt={
            currentSpace?.name ||
            venue.name
          }
          className="hero-image"
        />

        <div className="hero-overlay" />

        {/* Back button */}
        <Link
          href="/explore"
          className="hero-back"
          aria-label="Back to explore"
        >
          ←
        </Link>

        {/* Save button */}
        <button
          type="button"
          className={`hero-save ${
            saved ? 'saved' : ''
          }`}
          onClick={() =>
            setSaved((value) => !value)
          }
          aria-label="Save venue"
        >
          {saved ? '♥' : '♡'}
        </button>

        {/* Image counter */}
        {galleryImages.length > 1 && (
          <div className="image-counter">
            <span>
              {String(activeImage + 1).padStart(
                2,
                '0'
              )}
            </span>

            <span className="counter-line" />

            <span>
              {String(
                galleryImages.length
              ).padStart(2, '0')}
            </span>
          </div>
        )}

        {/* HERO TEXT */}
        <div className="hero-content">

          <p className="hero-location">
            {venue.city},{' '}
            {venue.country}
          </p>

          {venue.verified && (
            <span className="verified">
              <span>✓</span>
              Verified venue
            </span>
          )}

          <h1>
            {venue.name}
          </h1>

          <p className="hero-description">
            {venue.desc}
          </p>

        </div>

        {/* =================================================
            HERO ARROWS
            Positioned separately from the text
            ================================================= */}

        {galleryImages.length > 1 && (
          <div className="hero-navigation">

            <button
              type="button"
              onClick={previousImage}
              aria-label="Previous image"
            >
              <span>←</span>
            </button>

            <button
              type="button"
              onClick={nextImage}
              aria-label="Next image"
            >
              <span>→</span>
            </button>

          </div>
        )}

      </section>


      {/* =====================================================
          THUMBNAILS
          ===================================================== */}

      {galleryImages.length > 1 && (
        <section className="thumbnail-section">

          <div className="thumbnail-track">

            {galleryImages.map(
              (image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  className={`thumbnail ${
                    activeImage === index
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setActiveImage(index)
                  }
                >
                  <img
                    src={image}
                    alt={`${venue.name} ${
                      index + 1
                    }`}
                  />
                </button>
              )
            )}

          </div>

        </section>
      )}


      {/* =====================================================
          VENUE CONTENT
          ===================================================== */}

      <section className="venue-content">

        <div className="content-main">

          <span className="section-kicker">
            THE VENUE
          </span>

          <h2>
            A destination designed
            <br />
            for memorable celebrations.
          </h2>

          <p className="lead">
            {venue.desc}
          </p>

          {/* Tags */}

          <div className="tags">

            {venue.tags?.map(
              (tag) => (
                <span key={tag}>
                  {tag}
                </span>
              )
            )}

          </div>


          {/* =================================================
              SPACES
              ================================================= */}

          <section className="spaces-section">

            <div className="section-heading">

              <div>

                <span className="section-kicker">
                  EXPLORE THE SPACES
                </span>

                <h3>
                  Spaces at this property
                </h3>

              </div>

              <span className="space-count">
                {spaces.length} spaces
              </span>

            </div>


            {spaces.length > 0 && (
              <div className="space-showcase">

                <div className="space-image">

                  <img
                    src={currentSpace.image}
                    alt={currentSpace.name}
                  />

                </div>


                <div className="space-details">

                  <span className="space-label">
                    VENUE SPACE
                  </span>

                  <h4>
                    {currentSpace.name}
                  </h4>

                  <p>
                    {currentSpace.description}
                  </p>

                  <div className="capacity">

                    <span>
                      Capacity
                    </span>

                    <strong>
                      Up to{' '}
                      {currentSpace.capacity}{' '}
                      guests
                    </strong>

                  </div>


                  <div className="space-tags">

                    {currentSpace.tags?.map(
                      (tag) => (
                        <span key={tag}>
                          {tag}
                        </span>
                      )
                    )}

                  </div>

                </div>

              </div>
            )}


            {/* Space selector */}

            {spaces.length > 1 && (
              <div className="space-selector">

                {spaces.map(
                  (space, index) => (
                    <button
                      type="button"
                      key={space.id}
                      className={
                        selectedSpace === index
                          ? 'selected'
                          : ''
                      }
                      onClick={() =>
                        selectSpace(index)
                      }
                    >

                      <span>
                        {String(
                          index + 1
                        ).padStart(2, '0')}
                      </span>

                      <strong>
                        {space.name}
                      </strong>

                      <small>
                        Up to{' '}
                        {space.capacity}
                      </small>

                    </button>
                  )
                )}

              </div>
            )}

          </section>

        </div>


        {/* =================================================
            BOOKING / ENQUIRY CARD
            ================================================= */}

        <aside className="action-column">

          <div className="action-card">

            <div className="action-top">

              <span>
                PLAN YOUR EVENT
              </span>

              <button
                type="button"
                className="card-heart"
                onClick={() =>
                  setSaved(
                    (value) => !value
                  )
                }
              >
                {saved ? '♥' : '♡'}
              </button>

            </div>


            <h3>
              Ready to
              <br />
              celebrate?
            </h3>


            <p>
              Choose how you would like
              to proceed with{' '}
              {venue.name}.
            </p>


            <div className="action-buttons">

              <Link
                href={`/book?venue=${venue.id}${
                  currentSpace
                    ? `&space=${currentSpace.id}`
                    : ''
                }`}
                className="book-button"
              >
                <span>
                  Book The Venue
                </span>

                <span>
                  →
                </span>
              </Link>


              <Link
                href={`/enquiry?venue=${venue.id}${
                  currentSpace
                    ? `&space=${currentSpace.id}`
                    : ''
                }`}
                className="enquiry-button"
              >
                <span>
                  Drop an Enquiry
                </span>

                <span>
                  →
                </span>
              </Link>

            </div>


            <div className="action-note">

              <span>✓</span>

              <p>
                Our team will assist you
                with the next step.
              </p>

            </div>

          </div>


          <div className="help-card">

            <div className="help-icon">
              ?
            </div>

            <div>

              <strong>
                Need help choosing?
              </strong>

              <p>
                Our venue team can help
                you find the right space
                for your celebration.
              </p>

            </div>

          </div>

        </aside>

      </section>


      {/* =====================================================
          STYLES
          ===================================================== */}

      <style jsx>{`

        .venue-page {
          min-height: 100vh;
          background: #f7f5f0;
          color: #111;
        }


        /* ===================================================
           HERO
           =================================================== */

        .hero {
          position: relative;

          width: 100%;

          height: calc(100vh - 82px);

          min-height: 650px;

          overflow: hidden;

          background: #111;
        }


        .hero-image {
          position: absolute;

          inset: 0;

          width: 100%;
          height: 100%;

          object-fit: cover;

          object-position: center;

          display: block;

          transform: scale(1.01);
        }


        .hero-overlay {
          position: absolute;

          inset: 0;

          background:
            linear-gradient(
              to bottom,
              rgba(0, 0, 0, 0.08) 0%,
              rgba(0, 0, 0, 0.02) 35%,
              rgba(0, 0, 0, 0.16) 55%,
              rgba(0, 0, 0, 0.88) 100%
            );

          z-index: 1;
        }


        /* ===================================================
           BACK BUTTON
           =================================================== */

        .hero-back {
          position: absolute;

          top: 35px;
          left: 45px;

          width: 50px;
          height: 50px;

          border-radius: 50%;

          display: grid;
          place-items: center;

          color: white;

          background:
            rgba(0, 0, 0, 0.2);

          border:
            1px solid
            rgba(255, 255, 255, 0.3);

          backdrop-filter: blur(8px);

          text-decoration: none;

          font-size: 21px;

          z-index: 5;

          transition: 0.2s ease;
        }


        .hero-back:hover {
          background: white;
          color: #111;
        }


        /* ===================================================
           SAVE
           =================================================== */

        .hero-save {
          position: absolute;

          top: 35px;
          right: 45px;

          width: 56px;
          height: 56px;

          border-radius: 50%;

          border:
            1px solid
            rgba(255, 255, 255, 0.35);

          background:
            rgba(0, 0, 0, 0.25);

          color: white;

          font-size: 25px;

          cursor: pointer;

          backdrop-filter: blur(10px);

          z-index: 5;

          transition: 0.2s ease;
        }


        .hero-save:hover,
        .hero-save.saved {
          background: white;
          color: #111;
        }


        /* ===================================================
           IMAGE COUNTER
           =================================================== */

        .image-counter {
          position: absolute;

          top: 51px;
          right: 120px;

          display: flex;
          align-items: center;

          gap: 8px;

          color: white;

          font-size: 10px;

          letter-spacing: 0.12em;

          z-index: 5;
        }


        .counter-line {
          width: 20px;
          height: 1px;

          background:
            rgba(255,255,255,.5);
        }


        /* ===================================================
           HERO CONTENT
           =================================================== */

        .hero-content {
          position: absolute;

          left: 6.5%;
          bottom: 125px;

          width: min(1000px, 80%);

          color: white;

          z-index: 4;
        }


        .hero-location {
          margin: 0 0 10px;

          font-size: 15px;

          color:
            rgba(255,255,255,.88);
        }


        .verified {
          display: inline-flex;

          align-items: center;

          gap: 7px;

          padding: 8px 14px;

          border-radius: 30px;

          background:
            rgba(255,255,255,.14);

          border:
            1px solid
            rgba(255,255,255,.25);

          backdrop-filter: blur(10px);

          font-size: 11px;

          margin-bottom: 15px;
        }


        .verified span {
          color: #43d79c;
        }


        .hero-content h1 {
          margin: 0;

          max-width: 1050px;

          font-family:
            Georgia,
            'Times New Roman',
            serif;

          font-size:
            clamp(50px, 6vw, 90px);

          line-height: 0.94;

          font-weight: 400;

          letter-spacing: -0.045em;
        }


        .hero-description {
          max-width: 760px;

          margin: 20px 0 0;

          color:
            rgba(255,255,255,.82);

          font-size: 15px;

          line-height: 1.6;
        }


        /* ===================================================
           HERO NAVIGATION
           
           IMPORTANT:
           The arrows are now completely independent from
           the text and are positioned at the bottom-left.
           =================================================== */

        .hero-navigation {
          position: absolute;

          left: 6.5%;
          bottom: 35px;

          display: flex;

          align-items: center;

          gap: 10px;

          z-index: 6;
        }


        .hero-navigation button {
          width: 52px;
          height: 52px;

          padding: 0;

          border-radius: 50%;

          border:
            1px solid
            rgba(255,255,255,.55);

          background:
            rgba(0,0,0,.22);

          color: white;

          display: grid;
          place-items: center;

          cursor: pointer;

          backdrop-filter: blur(10px);

          font-size: 20px;

          line-height: 1;

          transition:
            background .2s ease,
            color .2s ease,
            transform .2s ease;
        }


        .hero-navigation button:hover {
          background: white;

          color: #111;

          transform:
            translateY(-2px);
        }


        .hero-navigation button span {
          display: block;

          transform:
            translateY(-1px);
        }


        /* ===================================================
           THUMBNAILS
           =================================================== */

        .thumbnail-section {
          background: #f7f5f0;

          padding:
            18px 5%;

          border-bottom:
            1px solid #e3e0da;
        }


        .thumbnail-track {
          display: flex;

          gap: 10px;

          overflow-x: auto;

          scrollbar-width: none;
        }


        .thumbnail-track::-webkit-scrollbar {
          display: none;
        }


        .thumbnail {
          width: 90px;
          height: 60px;

          flex: 0 0 auto;

          padding: 0;

          border:
            2px solid transparent;

          background: transparent;

          cursor: pointer;

          overflow: hidden;

          border-radius: 3px;
        }


        .thumbnail.active {
          border-color: #159fc3;
        }


        .thumbnail img {
          width: 100%;
          height: 100%;

          object-fit: cover;

          display: block;
        }


        /* ===================================================
           MAIN CONTENT
           =================================================== */

        .venue-content {
          width:
            min(
              1400px,
              calc(100% - 100px)
            );

          margin: auto;

          padding:
            90px 0 120px;

          display: grid;

          grid-template-columns:
            minmax(0, 1.45fr)
            minmax(330px, .65fr);

          gap: 80px;

          align-items: start;
        }


        .section-kicker {
          display: block;

          color: #888;

          font-size: 10px;

          font-weight: 700;

          letter-spacing: .18em;
        }


        .content-main > h2 {
          margin:
            20px 0 25px;

          font-family:
            Georgia,
            'Times New Roman',
            serif;

          font-weight: 400;

          font-size:
            clamp(42px, 5vw, 72px);

          line-height: .98;

          letter-spacing: -.04em;
        }


        .lead {
          max-width: 800px;

          color: #68645e;

          font-size: 18px;

          line-height: 1.8;
        }


        .tags {
          display: flex;

          flex-wrap: wrap;

          gap: 9px;

          margin-top: 28px;
        }


        .tags span {
          padding:
            10px 17px;

          border:
            1px solid #dcd8d0;

          border-radius: 30px;

          color: #555;

          font-size: 11px;
        }


        /* ===================================================
           SPACES
           =================================================== */

        .spaces-section {
          margin-top: 100px;
        }


        .section-heading {
          display: flex;

          align-items: end;

          justify-content: space-between;

          gap: 30px;

          margin-bottom: 30px;
        }


        .section-heading h3 {
          margin: 15px 0 0;

          font-family:
            Georgia,
            'Times New Roman',
            serif;

          font-size:
            clamp(42px, 5vw, 68px);

          font-weight: 400;

          line-height: .95;

          letter-spacing: -.04em;
        }


        .space-count {
          color: #888;

          font-size: 12px;

          white-space: nowrap;
        }


        .space-showcase {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          min-height: 480px;
        }


        .space-image {
          overflow: hidden;

          background: #ddd;
        }


        .space-image img {
          width: 100%;
          height: 100%;

          object-fit: cover;

          display: block;
        }


        .space-details {
          background: #111;

          color: white;

          padding: 55px;

          display: flex;

          flex-direction: column;

          justify-content: center;
        }


        .space-label {
          color: #26b9d7;

          font-size: 10px;

          letter-spacing: .17em;

          font-weight: 700;
        }


        .space-details h4 {
          margin: 18px 0;

          font-family:
            Georgia,
            serif;

          font-weight: 400;

          font-size: 50px;

          line-height: 1;
        }


        .space-details p {
          color: #999;

          font-size: 13px;

          line-height: 1.7;

          max-width: 450px;
        }


        .capacity {
          margin-top: 25px;

          padding-top: 20px;

          border-top:
            1px solid #333;
        }


        .capacity span {
          display: block;

          color: #777;

          font-size: 9px;

          letter-spacing: .13em;

          margin-bottom: 6px;
        }


        .capacity strong {
          font-size: 13px;
        }


        .space-tags {
          display: flex;

          flex-wrap: wrap;

          gap: 7px;

          margin-top: 20px;
        }


        .space-tags span {
          padding:
            7px 11px;

          border:
            1px solid #333;

          color: #aaa;

          font-size: 9px;
        }


        .space-selector {
          margin-top: 12px;

          display: grid;

          grid-template-columns:
            repeat(
              auto-fit,
              minmax(180px, 1fr)
            );

          gap: 8px;
        }


        .space-selector button {
          background: white;

          border:
            1px solid #dedbd4;

          padding: 16px;

          text-align: left;

          cursor: pointer;

          transition: .2s ease;
        }


        .space-selector button:hover,
        .space-selector button.selected {
          background: #111;

          color: white;

          border-color: #111;
        }


        .space-selector span,
        .space-selector strong,
        .space-selector small {
          display: block;
        }


        .space-selector span {
          color: #999;

          font-size: 9px;

          margin-bottom: 8px;
        }


        .space-selector strong {
          font-size: 12px;
        }


        .space-selector small {
          margin-top: 5px;

          color: #999;

          font-size: 9px;
        }


        /* ===================================================
           ACTION CARD
           =================================================== */

        .action-column {
          position: sticky;

          top: 105px;
        }


        .action-card {
          background: #111;

          color: white;

          padding: 38px;

          box-shadow:
            0 25px 60px
            rgba(0,0,0,.12);
        }


        .action-top {
          display: flex;

          justify-content: space-between;

          align-items: center;
        }


        .action-top > span {
          color: #26b9d7;

          font-size: 10px;

          font-weight: 700;

          letter-spacing: .17em;
        }


        .card-heart {
          width: 48px;
          height: 48px;

          border-radius: 50%;

          border:
            1px solid #3c3c3c;

          background: transparent;

          color: white;

          font-size: 21px;

          cursor: pointer;
        }


        .action-card h3 {
          font-family:
            Georgia,
            serif;

          font-size: 45px;

          font-weight: 400;

          line-height: .98;

          margin: 25px 0;
        }


        .action-card > p {
          color: #999;

          font-size: 13px;

          line-height: 1.7;

          margin-bottom: 30px;
        }


        .action-buttons {
          display: flex;

          flex-direction: column;

          gap: 12px;
        }


        .book-button,
        .enquiry-button {
          min-height: 58px;

          display: flex;

          align-items: center;

          justify-content: space-between;

          padding:
            0 20px;

          text-decoration: none;

          font-size: 13px;

          font-weight: 700;

          transition: .2s ease;
        }


        .book-button {
          background:
            linear-gradient(
              135deg,
              #2861d4,
              #20b9d2
            );

          color: white;
        }


        .enquiry-button {
          border:
            1px solid #3c3c3c;

          color: white;

          background: #171717;
        }


        .book-button:hover,
        .enquiry-button:hover {
          transform:
            translateY(-2px);
        }


        .enquiry-button:hover {
          border-color: #27b9d7;

          background: #1c1c1c;
        }


        .action-note {
          display: flex;

          gap: 10px;

          align-items: center;

          border-top:
            1px solid #2d2d2d;

          margin-top: 25px;

          padding-top: 20px;
        }


        .action-note span {
          color: #43d79c;
        }


        .action-note p {
          margin: 0;

          color: #777;

          font-size: 10px;
        }


        .help-card {
          margin-top: 12px;

          padding: 25px;

          background: white;

          display: flex;

          gap: 15px;

          align-items: flex-start;
        }


        .help-icon {
          width: 40px;
          height: 40px;

          flex-shrink: 0;

          border-radius: 50%;

          background: #111;

          color: white;

          display: grid;

          place-items: center;

          font-weight: 700;
        }


        .help-card strong {
          display: block;

          font-size: 13px;

          margin-bottom: 8px;
        }


        .help-card p {
          margin: 0;

          color: #777;

          font-size: 10px;

          line-height: 1.6;
        }


        /* ===================================================
           TABLET
           =================================================== */

        @media (max-width: 1000px) {

          .hero {
            height: 78vh;
            min-height: 580px;
          }


          .venue-content {
            grid-template-columns: 1fr;
          }


          .action-column {
            position: static;
          }

        }


        /* ===================================================
           MOBILE
           =================================================== */

        @media (max-width: 700px) {

          .hero {
            height: 75vh;
            min-height: 560px;
          }


          .hero-back {
            top: 20px;
            left: 20px;

            width: 44px;
            height: 44px;
          }


          .hero-save {
            top: 20px;
            right: 20px;

            width: 48px;
            height: 48px;
          }


          .image-counter {
            top: 38px;
            right: 80px;
          }


          .hero-content {
            left: 24px;

            bottom: 110px;

            width:
              calc(100% - 48px);
          }


          .hero-location {
            font-size: 13px;
          }


          .hero-content h1 {
            font-size: 48px;

            line-height: .96;
          }


          .hero-description {
            font-size: 13px;

            margin-top: 15px;
          }


          /*
           * Arrows remain below the text on mobile.
           */

          .hero-navigation {
            left: 24px;

            bottom: 28px;

            gap: 8px;
          }


          .hero-navigation button {
            width: 46px;
            height: 46px;

            font-size: 18px;
          }


          .venue-content {
            width:
              calc(100% - 36px);

            padding:
              65px 0 80px;

            gap: 60px;
          }


          .content-main > h2 {
            font-size: 43px;
          }


          .spaces-section {
            margin-top: 70px;
          }


          .section-heading {
            align-items: flex-start;

            flex-direction: column;

            gap: 10px;
          }


          .section-heading h3 {
            font-size: 45px;
          }


          .space-showcase {
            grid-template-columns: 1fr;
          }


          .space-image {
            height: 300px;
          }


          .space-details {
            padding:
              35px 25px;
          }


          .space-details h4 {
            font-size: 42px;
          }


          .action-card {
            padding:
              30px 24px;
          }

        }

      `}</style>

    </main>
  );
}