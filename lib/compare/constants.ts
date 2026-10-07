/*
 * Shared by the /compare page and the "Compare" option on /explore,
 * so the limit and the URL format can never drift apart.
 */
export const MAX_COMPARE_VENUES = 4;

/* /compare?v=slug1,slug2 -- the selection lives in the URL (shareable). */
export function compareHref(slugs: string[]): string {
  return slugs.length
    ? `/compare?v=${slugs.map(encodeURIComponent).join(',')}`
    : '/compare';
}
