'use client';

import { m, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

/*
 * Scroll-reveal: fades and lifts content in once as it enters the
 * viewport. Skipped entirely for visitors who prefer reduced motion.
 * The content is always in the server-rendered HTML; `data-reveal` lets a
 * <noscript> rule keep it visible when JavaScript is off.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <m.div
      data-reveal
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}
