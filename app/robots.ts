import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',

        // Allow legitimate crawlers to access all public content.
        allow: [
          '/',
          '/explore',
          '/wedding-venues',
          '/collections',
          '/how-it-works',
          '/for-venues',
          '/venues/',
        ],

        // Keep private, authenticated and transactional areas protected.
        disallow: [
          '/api/',
          '/admin/',
          '/auth/',
          '/login',
          '/profile',
          '/planner',
          '/wishlist',
          '/book/',
          '/enquiry',
        ],
      },
    ],

    // Help search engines discover all public pages.
    sitemap: 'https://venuesearch.in/sitemap.xml',
  };
}