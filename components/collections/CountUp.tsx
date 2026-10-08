'use client';

import { animate, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';

/*
 * Animated counter. The final number is what the server renders (so it is
 * in the HTML, readable without JavaScript and by crawlers); once the
 * counter scrolls into view it counts up to that same number.
 */
export function CountUp({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!inView || reduce || !el) return;

    const controls = animate(0, value, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (v) => {
        el.textContent = Math.round(v).toLocaleString('en-IN');
      },
    });

    return () => controls.stop();
  }, [inView, reduce, value]);

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString('en-IN')}
    </span>
  );
}
