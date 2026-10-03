import type { Metadata } from 'next';

import { optimizedUrl } from './image';

/*
 * Shared metadata builder for public pages.
 *
 * Next.js replaces (does not merge) the `openGraph` / `twitter`
 * objects when a page defines its own, so any page that sets them
 * must repeat siteName, locale and an image -- this helper keeps
 * that in one place and adds the canonical URL, which no page had.
 */

export const SITE_URL = 'https://venuesearch.in';
export const SITE_NAME = 'The Venue Search';

/* Fallback social image when a page has no venue photo of its own. */
const DEFAULT_OG_IMAGE = {
  url: `${SITE_URL}/logo.png`,
  alt: SITE_NAME,
};

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/*
 * Venue photos are multi-megabyte originals. Social crawlers
 * (WhatsApp in particular) skip very large images, so share a
 * 1200px-wide optimised copy instead.
 */
export function socialImage(
  src: string | null | undefined,
  alt: string
) {
  if (!src) return DEFAULT_OG_IMAGE;

  return {
    url: optimizedUrl(src, 1200, SITE_URL),
    alt,
  };
}

type PageMetadataInput = {
  /* Page title WITHOUT the site-name suffix (the root template adds it). */
  title: string;
  description: string;
  /* Path of the canonical URL, e.g. "/explore". Query strings are dropped. */
  path: string;
  image?: { url: string; alt: string };
  type?: 'website' | 'article';
};

export function pageMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
}: PageMetadataInput): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,

    alternates: {
      canonical: path,
    },

    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: 'en_IN',
      type,
      images: [image],
    },

    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image.url],
    },
  };
}

/*
 * Trim to a search-snippet-friendly length on a word boundary.
 */
export function clip(text: string, max = 155) {
  const clean = text.replace(/\s+/g, ' ').trim();

  if (clean.length <= max) return clean;

  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');

  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}
