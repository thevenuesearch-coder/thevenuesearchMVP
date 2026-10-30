'use client';

import {
  LazyMotion,
  domAnimation,
  m,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { useEffect, useRef } from 'react';
import { imgProps } from '../../lib/image';

type CollageVenue = { id: string; name: string; image: string };

/*
 * Parallax depth per card. Centre card moves least; outer cards move more and
 * in different directions so the stack reads as real depth, not one sliding
 * sheet. dx/dy are pixels, rx/ry are degrees of tilt at the hero's edge.
 */
const DEPTH = [
  { dx: 26, dy: 16, ry: 7, rx: 5 },
  { dx: -18, dy: 12, ry: -5, rx: 4 },
  { dx: 8, dy: 6, ry: 3, rx: 2 },
  { dx: -24, dy: -14, ry: -7, rx: 5 },
];

const SLOTS = ['s1', 's2', 's3', 's4'];

function Shot({
  venue,
  i,
  sx,
  sy,
}: {
  venue: CollageVenue;
  i: number;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
}) {
  const d = DEPTH[i];
  /* Motion values drive transforms directly — no React re-render per frame. */
  const x = useTransform(sx, [-1, 1], [-d.dx, d.dx]);
  const y = useTransform(sy, [-1, 1], [-d.dy, d.dy]);
  const rotateY = useTransform(sx, [-1, 1], [-d.ry, d.ry]);
  const rotateX = useTransform(sy, [-1, 1], [d.rx, -d.rx]);

  return (
    <figure className={`shot ${SLOTS[i]}`}>
      <div className="shotFloat">
        <m.div
          className="shotPar"
          style={{ x, y, rotateX, rotateY, transformPerspective: 900 }}
        >
          <img
            {...imgProps(venue.image, venue.name, {
              width: 420,
              height: 560,
              sizes:
                i === 2
                  ? '(max-width:1100px) 40vw, 24vw'
                  : '(max-width:1100px) 32vw, 18vw',
              priority: i === 2,
            })}
          />
          {i === 2 && <figcaption>{venue.name}</figcaption>}
        </m.div>
      </div>
    </figure>
  );
}

/*
 * Four overlapping venue photographs for the home hero, built from real venue
 * records. Interaction layers (kept separate so transforms never fight):
 *   .shot      position, size, static tilt, hover lift (CSS `scale`/`translate`)
 *   .shotFloat slow organic float (CSS keyframes)
 *   .shotPar   cursor parallax + tilt (Framer Motion values, spring-smoothed)
 */
export function HeroCollage({ venues }: { venues: CollageVenue[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 16, mass: 0.7 });
  const sy = useSpring(my, { stiffness: 60, damping: 16, mass: 0.7 });

  useEffect(() => {
    const root = rootRef.current;
    const hero = root?.closest<HTMLElement>('.heroV2');
    if (!hero) return;

    /* Cursor tracking only for a real mouse and when motion is welcome. */
    const mq = window.matchMedia(
      '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'
    );
    if (!mq.matches) return;

    let raf = 0;
    let nx = 0;
    let ny = 0;

    const flush = () => {
      raf = 0;
      mx.set(nx);
      my.set(ny);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(flush);
    };
    const clamp = (n: number) => Math.max(-1, Math.min(1, n));

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = hero.getBoundingClientRect();
      nx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2));
      ny = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2));
      schedule();
    };
    const onLeave = () => {
      nx = 0;
      ny = 0;
      schedule();
    };

    hero.addEventListener('pointermove', onMove, { passive: true });
    hero.addEventListener('pointerleave', onLeave);

    return () => {
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mx, my]);

  const shots = venues.slice(0, 4);
  if (shots.length < 3) return null;

  return (
    <LazyMotion features={domAnimation}>
      <div className="heroCollage" ref={rootRef} aria-label="Featured venues">
        <p className="tagline" aria-hidden="true">
          Extraordinary venues.
          <br />
          Unforgettable celebrations.
        </p>
        {shots.map((v, i) => (
          <Shot key={v.id} venue={v} i={i} sx={sx} sy={sy} />
        ))}
      </div>
    </LazyMotion>
  );
}
