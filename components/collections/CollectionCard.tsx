'use client';

import Link from 'next/link';
import { m, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { imgProps } from '../../lib/image';
import type { CollectionVenue } from '../../lib/collections';
import { CountUp } from './CountUp';
import { BedIcon, ChevronIcon, GuestsIcon, PinIcon, SpacesIcon } from './icons';
import styles from './collections.module.css';

/*
 * One collection card, photo first: a swipeable gallery (CSS scroll-snap,
 * so touch and trackpad work with no drag library) with the venue name set
 * over the image, a filmstrip of every photo underneath, then a compact
 * stat infographic, verified highlights and a CTA. Stats a venue doesn't
 * have are not rendered.
 */
export function CollectionCard({
  venue,
  maxCapacity,
  priority = false,
}: {
  venue: CollectionVenue;
  maxCapacity: number;
  priority?: boolean;
}) {
  const reduce = useReducedMotion();
  const track = useRef<HTMLUListElement>(null);
  const strip = useRef<HTMLUListElement>(null);
  const thumbs = useRef<Array<HTMLButtonElement | null>>([]);
  const frame = useRef(0);
  const [index, setIndex] = useState(0);

  const photos = venue.photos;
  const many = photos.length > 1;
  const current = photos[Math.min(index, photos.length - 1)];

  const onScroll = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = track.current;
      if (!el || !el.clientWidth) return;
      setIndex(Math.round(el.scrollLeft / el.clientWidth));
    });
  }, []);

  const goTo = (target: number) => {
    const el = track.current;
    if (!el) return;
    const next = (target + photos.length) % photos.length;
    el.scrollTo({
      left: next * el.clientWidth,
      behavior: reduce ? 'auto' : 'smooth',
    });
  };

  /* Keep the active filmstrip thumbnail in view (scrolls the strip only). */
  useEffect(() => {
    const list = strip.current;
    const thumb = thumbs.current[index];
    if (!list || !thumb) return;

    list.scrollTo({
      left: thumb.offsetLeft - list.clientWidth / 2 + thumb.offsetWidth / 2,
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [index, reduce]);

  const share =
    venue.capacity && maxCapacity > 0
      ? Math.max(8, Math.round((venue.capacity / maxCapacity) * 100))
      : 0;

  return (
    <article className={styles.card}>
      <div
        className={styles.gallery}
        role="group"
        aria-roledescription="carousel"
        aria-label={`${venue.name} photos`}
      >
        {photos.length > 0 ? (
          <ul
            ref={track}
            className={styles.track}
            onScroll={onScroll}
            tabIndex={0}
            aria-label={`${venue.name} photo gallery, swipe or use arrow keys`}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') {
                event.preventDefault();
                goTo(index + 1);
              }
              if (event.key === 'ArrowLeft') {
                event.preventDefault();
                goTo(index - 1);
              }
            }}
          >
            {photos.map((photo, i) => (
              <li
                key={photo.src}
                className={styles.slide}
                aria-label={`${i + 1} of ${photos.length}: ${photo.caption}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  {...imgProps(photo.src, photo.alt, {
                    width: 1000,
                    height: 700,
                    sizes: '(max-width: 760px) 100vw, 50vw',
                    priority: priority && i === 0,
                  })}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.noPhoto} aria-hidden="true" />
        )}

        {/* Name, type and place sit over the photo (kept as real headings/links). */}
        <div className={styles.overlay}>
          {venue.type && <p className={styles.kicker}>{venue.type}</p>}

          <h3 className={styles.cardTitle}>
            <Link href={`/venues/${venue.id}`}>{venue.name}</Link>
          </h3>

          {venue.location && (
            <p className={styles.location}>
              <PinIcon />
              {venue.location}
            </p>
          )}
        </div>

        {current && (
          <span className={styles.caption} aria-hidden="true">
            {current.caption}
          </span>
        )}

        {many && (
          <>
            <span className={styles.counter} aria-hidden="true">
              {index + 1} / {photos.length}
            </span>

            <button
              type="button"
              className={`${styles.nav} ${styles.navPrev}`}
              onClick={() => goTo(index - 1)}
              aria-label={`Previous photo of ${venue.name}`}
            >
              <ChevronIcon dir="left" />
            </button>
            <button
              type="button"
              className={`${styles.nav} ${styles.navNext}`}
              onClick={() => goTo(index + 1)}
              aria-label={`Next photo of ${venue.name}`}
            >
              <ChevronIcon dir="right" />
            </button>
          </>
        )}
      </div>

      {many && (
        <ul
          ref={strip}
          className={styles.film}
          aria-label={`${venue.name} photo strip`}
        >
          {photos.map((photo, i) => (
            <li key={photo.src}>
              <button
                ref={(el) => {
                  thumbs.current[i] = el;
                }}
                type="button"
                className={
                  i === index ? styles.filmThumbActive : styles.filmThumb
                }
                onClick={() => goTo(i)}
                aria-label={`Show photo ${i + 1}: ${photo.caption}`}
                aria-current={i === index}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  {...imgProps(photo.src, '', {
                    width: 136,
                    height: 96,
                    sizes: '68px',
                  })}
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.body}>
        {venue.description && (
          <p className={styles.desc}>{venue.description}</p>
        )}

        {(venue.capacity || venue.spaceCount > 0 || venue.roomCount > 0) && (
          <dl className={styles.stats}>
            {venue.capacity && (
              <div className={`${styles.stat} ${styles.statWide}`}>
                <dt>
                  <GuestsIcon />
                  Guest capacity
                </dt>
                <dd>
                  <span className={styles.statNote}>Up to</span>
                  <CountUp
                    value={venue.capacity}
                    className={styles.statValue}
                  />
                  {venue.capacityMin ? (
                    <span className={styles.statNote}>
                      from {venue.capacityMin.toLocaleString('en-IN')}
                    </span>
                  ) : null}
                </dd>
                <span className={styles.bar} aria-hidden="true">
                  <m.span
                    className={styles.barFill}
                    initial={reduce ? false : { scaleX: 0 }}
                    whileInView={{ scaleX: share / 100 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    style={
                      reduce
                        ? { transform: `scaleX(${share / 100})` }
                        : undefined
                    }
                  />
                </span>
              </div>
            )}

            {venue.spaceCount > 0 && (
              <div className={styles.stat}>
                <dt>
                  <SpacesIcon />
                  Event spaces
                </dt>
                <dd>
                  <CountUp
                    value={venue.spaceCount}
                    className={styles.statValue}
                  />
                </dd>
              </div>
            )}

            {venue.roomCount > 0 && (
              <div className={styles.stat}>
                <dt>
                  <BedIcon />
                  Room categories
                </dt>
                <dd>
                  <CountUp
                    value={venue.roomCount}
                    className={styles.statValue}
                  />
                </dd>
              </div>
            )}
          </dl>
        )}

        {venue.highlights.length > 0 && (
          <ul
            className={styles.chips}
            aria-label="Verified amenities and services"
          >
            {venue.highlights.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        )}

        <div className={styles.ctaRow}>
          <Link href={`/venues/${venue.id}`} className={styles.cta}>
            Explore venue
            <span aria-hidden="true" className={styles.arrow}>
              →
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}
