'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { imgProps } from '../../lib/image';
import styles from './journey.module.css';

/*
 * "From search to certainty" -- the journey section on the home page.
 *
 * Every step below is a real, working part of the site (the same routes
 * and wording the How it works page uses):
 *   Discover  -> /explore            search by destination, type, guests
 *   Compare   -> /compare            up to four venues side by side
 *   Shortlist -> /profile#shortlist  saved favourites
 *   Hold      -> /how-it-works#faq   Instant Hold (explained in the FAQ)
 *   Book      -> /how-it-works       holding or booking online
 *
 * Geometry lives in one 1200 x 1000 coordinate space. The SVG draws the
 * rings and leader lines in it, and the HTML annotations are positioned
 * with the same numbers expressed as percentages, so lines and labels
 * always meet exactly at any size.
 */

const W = 1200;
const H = 1000;
const CX = 600;
const CY = 500;
const R_BEZEL = 350;
const R_ORBIT = 390;
const R_OUTER = 430;

type Side = 'left' | 'right';

type Step = {
  n: string;
  title: string;
  text: string;
  href: string;
  /* Anchor angle on the orbit ring, degrees clockwise from 3 o'clock. */
  angle: number;
  side: Side;
  /* Where the label block starts/ends (x) and its line y, in 1200 x 1000. */
  edge: number;
};

const STEPS: Step[] = [
  {
    n: '01',
    title: 'Discover',
    text: 'Search by destination, type and guests.',
    href: '/explore',
    angle: 235,
    side: 'left',
    edge: 236,
  },
  {
    n: '02',
    title: 'Compare',
    text: 'Up to four venues, side by side.',
    href: '/compare',
    angle: 305,
    side: 'right',
    edge: 964,
  },
  {
    n: '03',
    title: 'Shortlist',
    text: 'Save favourites and return anytime.',
    href: '/profile#shortlist',
    angle: 0,
    side: 'right',
    edge: 1006,
  },
  {
    n: '04',
    title: 'Hold',
    text: 'Provisionally reserve a date.',
    href: '/how-it-works#faq',
    angle: 55,
    side: 'right',
    edge: 964,
  },
  {
    n: '05',
    title: 'Book',
    text: 'Secure your date online.',
    href: '/how-it-works',
    angle: 125,
    side: 'left',
    edge: 236,
  },
];

const rad = (deg: number) => (deg * Math.PI) / 180;
const f = (n: number) => n.toFixed(2);

const anchor = (angle: number) => ({
  x: CX + R_ORBIT * Math.cos(rad(angle)),
  y: CY + R_ORBIT * Math.sin(rad(angle)),
});

/* Fine tick marks just outside the bezel, like a watch dial. */
const TICKS = Array.from({ length: 72 }, (_, i) => {
  const a = rad(i * 5);
  const long = i % 6 === 0;
  const r1 = R_BEZEL + 6;
  const r2 = R_BEZEL + (long ? 18 : 12);
  return `M${f(CX + r1 * Math.cos(a))} ${f(CY + r1 * Math.sin(a))}L${f(
    CX + r2 * Math.cos(a)
  )} ${f(CY + r2 * Math.sin(a))}`;
}).join('');

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

export function JourneyShowcase() {
  const rootRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<'pre' | 'in'>('pre');
  const [active, setActive] = useState<number | null>(null);

  /* Reveal once, when the section scrolls into view. */
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      /* Very old browsers: show everything, just not synchronously. */
      const t = window.setTimeout(() => setState('in'), 0);
      return () => window.clearTimeout(t);
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState('in');
          io.disconnect();
        }
      },
      { threshold: 0.18 }
    );

    io.observe(node);
    return () => io.disconnect();
  }, []);

  /* Gentle parallax on fine pointers; skipped for reduced motion. */
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || calm.matches) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;

    const apply = () => {
      raf = 0;
      frame.style.setProperty('--px', tx.toFixed(3));
      frame.style.setProperty('--py', ty.toFixed(3));
    };

    const onMove = (event: PointerEvent) => {
      const box = frame.getBoundingClientRect();
      tx = ((event.clientX - box.left) / box.width - 0.5) * 2;
      ty = ((event.clientY - box.top) / box.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      tx = 0;
      ty = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    frame.addEventListener('pointermove', onMove, { passive: true });
    frame.addEventListener('pointerleave', onLeave, { passive: true });

    return () => {
      frame.removeEventListener('pointermove', onMove);
      frame.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const on = useCallback((i: number) => () => setActive(i), []);
  const off = useCallback(() => setActive(null), []);

  return (
    <section
      ref={rootRef}
      className={styles.section}
      data-state={state}
      aria-labelledby="journey-title"
    >
      <noscript>
        <style>{`[data-state="pre"] * { opacity: 1 !important; transform: none !important; clip-path: none !important; }`}</style>
      </noscript>

      <span className={styles.corner} aria-hidden="true">
        <i />
        The journey
      </span>

      <div className={styles.grid}>
        {/* ------------------------------------------------ copy */}
        <div className={styles.copy}>
          <span className={`${styles.kicker} ${styles.rise}`} style={{ ['--d' as string]: '0ms' }}>
            From search to certainty
          </span>

          <h2 id="journey-title" className={styles.headline}>
            <span className={styles.line}>
              <span style={{ ['--d' as string]: '80ms' }}>Discover.</span>
            </span>
            <span className={styles.line}>
              <span style={{ ['--d' as string]: '170ms' }}>Compare.</span>
            </span>
            <span className={styles.line}>
              <span style={{ ['--d' as string]: '260ms' }}>Hold.</span>
            </span>
            <span className={styles.line}>
              <span className={styles.accent} style={{ ['--d' as string]: '350ms' }}>
                Book.
              </span>
            </span>
          </h2>

          <p className={`${styles.lead} ${styles.rise}`} style={{ ['--d' as string]: '470ms' }}>
            One wedding view connects the main venue with mehendi, sangeet and
            haldi spaces. Enquiries, Instant Holds and Instant Books stay
            clearly separated so every decision has a defined next step.
          </p>

          <div className={`${styles.actions} ${styles.rise}`} style={{ ['--d' as string]: '560ms' }}>
            <Link href="/explore" className={styles.cta} data-cursor="view">
              <span className={styles.ctaArrow} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
              <span className={styles.ctaLabel}>Explore Venues</span>
            </Link>

            <Link href="/how-it-works" className={styles.ghost} data-cursor="view">
              <span>How it works</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17 17 7M8 7h9v9" />
              </svg>
            </Link>
          </div>
        </div>

        {/* ---------------------------------------------- visual */}
        <div className={styles.visual}>
          <div
            ref={frameRef}
            className={styles.frame}
            data-active={active === null ? undefined : active}
          >
            <svg
              className={styles.rings}
              viewBox={`0 0 ${W} ${H}`}
              aria-hidden="true"
              focusable="false"
            >
              <g className={styles.ringsDrift}>
                <circle className={styles.ringOuter} cx={CX} cy={CY} r={R_OUTER} />
                <circle className={styles.ringBezel} cx={CX} cy={CY} r={R_BEZEL} pathLength={1} />
                <path className={styles.ticks} d={TICKS} />
                <g className={styles.orbitSpin}>
                  <circle className={styles.ringOrbit} cx={CX} cy={CY} r={R_ORBIT} />
                </g>
              </g>

              {/* four-point star, a small editorial flourish */}
              <path
                className={styles.star}
                d="M78 470 Q78 500 48 500 Q78 500 78 530 Q78 500 108 500 Q78 500 78 470Z"
              />
              <path className={styles.cross} d="M1128 70v22M1117 81h22" />
              <path className={styles.cross} d="M72 64v22M61 75h22" />

              {STEPS.map((s, i) => {
                const a = anchor(s.angle);
                const end = s.side === 'left' ? s.edge + 8 : s.edge - 8;
                const y = a.y;
                return (
                  <g
                    key={s.n}
                    className={`${styles.leader} ${active === i ? styles.leaderOn : ''}`}
                    style={{ ['--d' as string]: `${700 + i * 110}ms` }}
                  >
                    <path d={`M${f(a.x)} ${f(y)}L${f(end)} ${f(y)}`} />
                    <circle className={styles.leaderEnd} cx={end} cy={y} r="3.5" />
                    <circle className={styles.halo} cx={a.x} cy={a.y} r="16" />
                    <circle className={styles.dot} cx={a.x} cy={a.y} r="8" />
                    <text
                      className={styles.dotNum}
                      x={a.x}
                      y={a.y + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {i + 1}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className={styles.disc}>
              <div className={styles.discInner}>
                <img
                  {...imgProps(
                    '/images/venues/tajlake.png',
                    'Taj Lake Palace rising from Lake Pichola at sunset, Udaipur',
                    { width: 1672, height: 941, sizes: '(max-width: 900px) 70vw, 560px' }
                  )}
                  className={styles.photo}
                />
                <span className={styles.vignette} aria-hidden="true" />
              </div>
            </div>

            <Link
              href="/venues/taj-lake-palace-udaipur"
              className={styles.plate}
              data-cursor="view"
            >
              <span>Plate 01</span>
              Taj Lake Palace, Udaipur
            </Link>

            {/* Annotations around the visual (tablet and desktop). */}
            <ol className={styles.notes} aria-label="The booking journey">
              {STEPS.map((s, i) => {
                const a = anchor(s.angle);
                const style =
                  s.side === 'left'
                    ? { right: pct(W - s.edge, W), top: pct(a.y - 18, H) }
                    : { left: pct(s.edge, W), top: pct(a.y - 18, H) };
                return (
                  <li
                    key={s.n}
                    className={`${styles.note} ${s.side === 'left' ? styles.noteLeft : styles.noteRight}`}
                    style={{ ...style, ['--d' as string]: `${760 + i * 110}ms` }}
                  >
                    <Link
                      href={s.href}
                      onMouseEnter={on(i)}
                      onMouseLeave={off}
                      onFocus={on(i)}
                      onBlur={off}
                      data-cursor="view"
                    >
                      <span className={styles.noteNum}>{s.n}</span>
                      <strong>{s.title}</strong>
                      <span className={styles.noteText}>{s.text}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Same journey as a tidy list on phones. */}
          <ol className={styles.list} aria-label="The booking journey">
            {STEPS.map((s) => (
              <li key={s.n} style={{ ['--d' as string]: `${600 + Number(s.n) * 70}ms` }}>
                <Link href={s.href} data-cursor="view">
                  <span className={styles.listNum}>{s.n}</span>
                  <span className={styles.listBody}>
                    <strong>{s.title}</strong>
                    <span>{s.text}</span>
                  </span>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <p className={styles.foot} aria-hidden="true">
        <span>Destination venues across India</span>
        <span>Discover&nbsp;&nbsp;×&nbsp;&nbsp;Compare&nbsp;&nbsp;×&nbsp;&nbsp;Hold&nbsp;&nbsp;×&nbsp;&nbsp;Book</span>
      </p>
    </section>
  );
}
