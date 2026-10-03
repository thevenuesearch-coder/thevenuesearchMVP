/*
 * Old numbered venue slugs -> current public slugs.
 *
 * next.config.ts already 308-redirects /venues/hyderabad-N to the
 * new URLs, but old slugs also live on in places a redirect can't
 * reach: bookmarked /book?venue=hyderabad-1 and
 * /enquiry?venue=hyderabad-1 links, and the /api/venues/[slug]
 * lookup those pages make. Resolving the alias here keeps those
 * working instead of showing "venue not found" after sign-in.
 *
 * Keep this in sync with the redirects() list in next.config.ts.
 */
const LEGACY_VENUE_SLUGS: Record<string, string> = {
  'hyderabad-1': 'taj-falaknuma-palace-hyderabad',
  'hyderabad-2': 'hilton-hyderabad-genome-valley-resort-spa',
  'hyderabad-3': 'novotel-hyderabad-convention-centre',
  'hyderabad-4': 'trident-hyderabad',
  'hyderabad-5': 'radisson-hotel-hyderabad-hitec-city',
  'hyderabad-6': 'itc-kohenur-hyderabad',
  'hyderabad-7': 'westin-hyderabad-mindspace',
  'hyderabad-8': 'taj-krishna-hyderabad',
  'hyderabad-9': 'hyderabad-marriott-hotel-convention-centre',
  'hyderabad-10': 'park-hyatt-hyderabad',
};

export function resolveVenueSlug(slug: string): string {
  return LEGACY_VENUE_SLUGS[slug] ?? slug;
}
