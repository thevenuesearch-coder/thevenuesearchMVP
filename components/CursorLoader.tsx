'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

/*
 * The custom cursor is a desktop-only effect (globals.css hides the
 * native cursor only for `(pointer: fine)` + no reduced-motion).
 * Loading it for everyone meant touch devices -- most mobile traffic
 * -- downloaded and ran a requestAnimationFrame loop that animates
 * an element CSS keeps hidden.
 *
 * This mirrors the CSS media query exactly: the cursor code is only
 * fetched and mounted where it is actually visible, so desktop
 * behaviour is unchanged.
 */
const Cursor = dynamic(() => import('./Cursor'), {
  ssr: false,
});

export default function CursorLoader() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(
      '(pointer: fine) and (prefers-reduced-motion: no-preference)'
    );

    setEnabled(query.matches);

    const onChange = (event: MediaQueryListEvent) =>
      setEnabled(event.matches);

    query.addEventListener('change', onChange);

    return () =>
      query.removeEventListener('change', onChange);
  }, []);

  return enabled ? <Cursor /> : null;
}
