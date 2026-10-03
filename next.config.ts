import type { NextConfig } from 'next';

/*
 * Venue and room photos live in Supabase Storage (public bucket
 * "venue-images") and were previously served as the original
 * multi-megabyte uploads. Allowing the project's storage host here
 * lets the Next.js image optimizer resize them to the size the
 * device actually needs and serve AVIF/WebP instead.
 *
 * The host is derived from NEXT_PUBLIC_SUPABASE_URL so nothing is
 * hard-coded; "*.supabase.co" covers the hosted default as a
 * fallback if the variable is absent at build time.
 */
type RemotePattern = NonNullable<
  NonNullable<NextConfig['images']>['remotePatterns']
>[number];

const STORAGE_PATH = '/storage/v1/object/public/**';

const remotePatterns: RemotePattern[] = [
  {
    protocol: 'https',
    hostname: '*.supabase.co',
    pathname: STORAGE_PATH,
  },
];

try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl) {
    const { protocol, hostname, port } = new URL(supabaseUrl);

    remotePatterns.push({
      protocol: protocol.replace(':', '') as 'http' | 'https',
      hostname,
      port,
      pathname: STORAGE_PATH,
    });
  }
} catch {
  /* Invalid URL -- the wildcard pattern above still applies. */
}

const nextConfig: NextConfig = {
  poweredByHeader: false,

  images: {
    formats: ['image/avif', 'image/webp'],

    /*
     * Optimised variants are cached for a day (default is 4h).
     * If a venue image is replaced at the same storage path, the
     * new version appears within this window.
     */
    minimumCacheTTL: 60 * 60 * 24,

    remotePatterns,

    /*
     * Local testing only: lets the optimizer fetch from a
     * localhost Supabase/storage stub. Never set in production.
     */
    dangerouslyAllowLocalIP:
      process.env.ALLOW_LOCAL_IMAGE_HOSTS === '1',
  },
};

export default nextConfig;
