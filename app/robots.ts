import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/auth/',
          '/login',
          '/profile',
          '/planner/',
          '/wishlist/',
          '/book/',
          '/enquiry',
        ],
      },
    ],

    sitemap: 'https://venuesearch.in/sitemap.xml',
  };
}