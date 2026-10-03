import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          /*
           * No trailing slashes on the private paths: "/book/"
           * does not match "/book?venue=..." (the main booking
           * URL), nor "/planner" or "/wishlist" themselves.
           */
          '/api/',
          '/admin',
          '/auth',
          '/login',
          '/profile',
          '/planner',
          '/wishlist',
          '/book',
          '/enquiry',
        ],
      },
    ],

    sitemap: 'https://venuesearch.in/sitemap.xml',
  };
}