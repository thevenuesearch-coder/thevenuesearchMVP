'use client';

import { LazyMotion, domAnimation } from 'framer-motion';
import type { ReactNode } from 'react';

/*
 * One LazyMotion provider for the whole Collections page. `domAnimation`
 * is the same lightweight feature set the home-page search box already
 * ships, so this adds no new animation code to the bundle.
 */
export function MotionRoot({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
