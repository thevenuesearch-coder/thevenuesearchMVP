import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="page"
      style={{ textAlign: 'center', minHeight: '60vh' }}
    >
      <h1>Page not found</h1>
      <p>
        We couldn&apos;t find that page. It may have moved, or the
        venue may no longer be listed.
      </p>
      <p>
        <Link className="primaryBtn" href="/explore">
          Explore wedding venues
        </Link>
      </p>
    </main>
  );
}
