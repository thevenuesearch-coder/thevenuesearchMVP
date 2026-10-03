import { getImageProps } from 'next/image';
import type { ImgHTMLAttributes } from 'react';

/*
 * Image helper for the existing <img> markup.
 *
 * Many components here style their images through scoped
 * styled-jsx or global CSS that targets a plain <img>. Swapping
 * those for the <Image> component would change how that CSS
 * applies, so instead we use Next's getImageProps(): it returns
 * the optimised src/srcSet/sizes (served through the Next.js image
 * optimizer -- resized per device, AVIF/WebP) to spread onto the
 * very same <img> element. Markup, class names and layout stay
 * exactly as they were.
 *
 * Only same-origin images and this project's Supabase Storage
 * images are optimised (those are the hosts allowed in
 * next.config.ts). Anything else is passed through untouched so a
 * third-party image URL can never break.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

const SUPABASE_STORAGE_PATH = '/storage/v1/object/public/';

export function isOptimizable(
  src?: string | null
): src is string {
  if (!src) return false;

  /* Same-origin file from /public */
  if (src.startsWith('/') && !src.startsWith('//')) return true;

  /* Hosted Supabase Storage */
  if (
    /^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\//.test(
      src
    )
  ) {
    return true;
  }

  /* Whatever host NEXT_PUBLIC_SUPABASE_URL points at */
  if (
    SUPABASE_URL &&
    src.startsWith(`${SUPABASE_URL}${SUPABASE_STORAGE_PATH}`)
  ) {
    return true;
  }

  return false;
}

type ImgOptions = {
  /* Intrinsic size hint (attributes only -- CSS still controls the rendered size). */
  width: number;
  height: number;

  /* Rendered width per breakpoint, so the browser picks the right candidate. */
  sizes?: string;

  /* Above-the-fold / LCP image: eager + high fetch priority. */
  priority?: boolean;
};

export function imgProps(
  src: string,
  alt: string,
  { width, height, sizes, priority = false }: ImgOptions
): ImgHTMLAttributes<HTMLImageElement> {
  if (!isOptimizable(src)) {
    return {
      src,
      alt,
      width,
      height,
      loading: priority ? 'eager' : 'lazy',
      decoding: 'async',
    };
  }

  const { props } = getImageProps({
    src,
    alt,
    width,
    height,
    sizes,
    priority,
  });

  /* Drop the inline style getImageProps adds; CSS already sizes these. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { style, ...rest } = props;

  return rest;
}

/*
 * Single optimised URL for places that take one URL rather than
 * an <img> (video poster, Open Graph images). `width` must be one
 * of Next's configured sizes (e.g. 640, 828, 1080, 1200, 1920).
 */
export function optimizedUrl(
  src: string,
  width: number,
  origin = ''
): string {
  if (!isOptimizable(src)) return src;

  return `${origin}/_next/image?url=${encodeURIComponent(
    src
  )}&w=${width}&q=75`;
}
