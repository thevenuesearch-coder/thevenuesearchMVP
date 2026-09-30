import type { Metadata } from 'next';
import { Suspense } from 'react';

import { CompareClient } from '../../components/CompareClient';

export const metadata: Metadata = {
  title: 'Compare Venues',
  description:
    'Compare two wedding or event venues side by side — capacity, pricing, amenities, rooms and location — even across different properties.',
  robots: {
    // Comparison pairs are user-driven and endlessly combinable
    // (?a=x&b=y), so this isn't a page worth indexing on its own —
    // /wedding-venues and /explore remain the pages built for search.
    index: false,
    follow: true,
  },
};

export default function ComparePage() {
  return (
    <Suspense fallback={<main className="page compare-page" />}>
      <CompareClient />
    </Suspense>
  );
}
