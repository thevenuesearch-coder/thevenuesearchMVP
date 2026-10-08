'use client';

import Link from 'next/link';
import { m, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useId, useRef, useState } from 'react';
import { imgProps } from '../../lib/image';
import type { CollectionPhoto, CollectionVenue } from '../../lib/collections';
import { CountUp } from './CountUp';
import {
  BedIcon,
  BuildingIcon,
  GuestsIcon,
  PinIcon,
  SpacesIcon,
} from './icons';
import styles from './collections.module.css';

/* Large gallery image with a gentle scroll parallax and a soft cross-fade. */
function Stage({ photo }: { photo: CollectionPhoto }) {
  const reduce = useReducedMotion();
  const frame = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: frame,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['-4%', '4%']);

  return (
    <div ref={frame} className={styles.stage}>
      <m.div
        key={photo.src}
        className={styles.stageMotion}
        style={reduce ? undefined : { y }}
        initial={reduce ? false : { opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          {...imgProps(photo.src, photo.alt, {
            width: 1200,
            height: 900,
            sizes: '(max-width: 62rem) 100vw, 55vw',
          })}
        />
      </m.div>
      <span className={styles.caption}>{photo.caption}</span>
    </div>
  );
}

/*
 * Interactive showcase: pick a venue, flip through its photos, see its key
 * facts. Every venue's panel is in the server-rendered HTML (the inactive
 * ones are just `hidden`), so the content stays crawlable.
 */
export function VenueShowcase({ venues }: { venues: CollectionVenue[] }) {
  const uid = useId();
  const [active, setActive] = useState(0);
  const [photo, setPhoto] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const select = (next: number, focus = false) => {
    setActive(next);
    setPhoto(0);
    if (focus) tabRefs.current[next]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent, i: number) => {
    const last = venues.length - 1;
    const map: Record<string, number> = {
      ArrowRight: i === last ? 0 : i + 1,
      ArrowLeft: i === 0 ? last : i - 1,
      Home: 0,
      End: last,
    };
    if (event.key in map) {
      event.preventDefault();
      select(map[event.key], true);
    }
  };

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Choose a venue">
        {venues.map((venue, i) => (
          <button
            key={venue.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            id={`${uid}-tab-${i}`}
            role="tab"
            type="button"
            aria-selected={i === active}
            aria-controls={`${uid}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            className={i === active ? styles.tabActive : styles.tab}
            onClick={() => select(i)}
            onKeyDown={(event) => onKeyDown(event, i)}
          >
            {venue.photos[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                {...imgProps(venue.photos[0].src, '', {
                  width: 96,
                  height: 96,
                  sizes: '40px',
                })}
              />
            )}
            <span>{venue.name}</span>
          </button>
        ))}
      </div>

      {venues.map((venue, i) => {
        const current = venue.photos[i === active ? photo : 0];

        return (
          <div
            key={venue.id}
            id={`${uid}-panel-${i}`}
            role="tabpanel"
            aria-labelledby={`${uid}-tab-${i}`}
            hidden={i !== active}
            className={styles.panel}
          >
            <div className={styles.showcaseMedia}>
              {current ? (
                <Stage photo={current} />
              ) : (
                <div className={styles.stage} aria-hidden="true" />
              )}

              {venue.photos.length > 1 && (
                <ul
                  className={styles.thumbs}
                  aria-label={`${venue.name} photos`}
                >
                  {venue.photos.map((p, n) => (
                    <li key={p.src}>
                      <button
                        type="button"
                        className={
                          n === photo ? styles.thumbActive : styles.thumb
                        }
                        onClick={() => setPhoto(n)}
                        aria-label={`Show photo: ${p.caption}`}
                        aria-pressed={n === photo}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          {...imgProps(p.src, p.alt, {
                            width: 168,
                            height: 120,
                            sizes: '84px',
                          })}
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.showcaseInfo}>
              {venue.type && <p className={styles.kicker}>{venue.type}</p>}

              <h3 className={styles.showcaseTitle}>{venue.name}</h3>

              {venue.location && (
                <p className={styles.location}>
                  <PinIcon />
                  {venue.location}
                </p>
              )}

              {venue.description && (
                <p className={styles.desc}>{venue.description}</p>
              )}

              {(venue.capacity ||
                venue.spaceCount > 0 ||
                venue.roomCount > 0) && (
                <dl className={styles.statsGrid}>
                  {venue.capacity && (
                    <div className={styles.stat}>
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
                      </dd>
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
                  {venue.type && (
                    <div className={styles.stat}>
                      <dt>
                        <BuildingIcon />
                        Venue type
                      </dt>
                      <dd>
                        <span className={styles.statText}>{venue.type}</span>
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

              <Link href={`/venues/${venue.id}`} className={styles.ctaSolid}>
                Explore Venue
                <span aria-hidden="true" className={styles.arrow}>
                  →
                </span>
              </Link>
            </div>
          </div>
        );
      })}
    </>
  );
}
