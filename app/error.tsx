'use client';

import Link from 'next/link';

/*
 * Shown when a page cannot load its data (for example while the
 * database is unreachable). The response is a server error, so search
 * engines retry later instead of indexing an empty page.
 */
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main
      id="main-content"
      className="page"
      style={{ textAlign: 'center', minHeight: '60vh' }}
    >
      <h1>We could not load this page</h1>
      <p>
        Something went wrong on our side while loading venues. Please try
        again in a moment.
      </p>
      <p style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="primaryBtn" onClick={reset}>
          Try again
        </button>
        <Link className="outlineBtn" href="/">
          Go to the home page
        </Link>
      </p>
    </main>
  );
}
