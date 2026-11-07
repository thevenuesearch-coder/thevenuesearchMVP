import Link from 'next/link';
import { imgProps } from '../lib/image';
import { MIN_VENUES_TO_INDEX, buildDestinations } from '../lib/destinations';
import { fetchVenuesServer } from '../lib/venues';

/*
 * Footer — UI v2. Only links/contact details that already existed on the
 * site (plus the existing Compare route) are shown; no social or newsletter
 * placeholders, because neither exists in the product yet.
 */
export async function Footer() {
  /*
   * Sitewide links to the destination landing pages (Hyderabad first),
   * built from the cached venue list.
   */
  const destinations = buildDestinations(await fetchVenuesServer())
    .filter((d) => d.venues.length >= MIN_VENUES_TO_INDEX)
    .sort(
      (a, b) =>
        Number(b.slug === 'hyderabad') - Number(a.slug === 'hyderabad') ||
        b.venues.length - a.venues.length
    )
    .slice(0, 5);

  return (
    <footer className="vsFooter">
      <div className="footerTop">
        <div className="footBrand">
          <img
            className="footerLogo"
            {...imgProps('/logo.png', 'The Venue Search', { width: 85, height: 51, sizes: '85px' })}
          />
          <h2>The infrastructure layer for weddings &amp; events.</h2>
          <p>Verified venues. Transparent decisions. Confident bookings.</p>
        </div>

        <nav aria-label="Discover">
          <b>Explore</b>
          <Link href="/explore">Explore venues</Link>
          <Link href="/wedding-venues">Wedding venues</Link>
          {destinations.map((destination) => (
            <Link key={destination.slug} href={`/wedding-venues/${destination.slug}`}>
              {destination.name} wedding venues
            </Link>
          ))}
          <Link href="/collections">Collections</Link>
          <Link href="/compare">Compare Venues</Link>
        </nav>

        <nav aria-label="About">
          <b>About</b>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/for-venues">For venues</Link>
        </nav>

        <nav aria-label="Partners">
          <b>Partners</b>
          <Link href="/for-venues">List your venue</Link>
          <Link href="/planner" rel="nofollow">Planner workspace</Link>
        </nav>

        <div>
          <b>Support</b>
          <a href="mailto:thevenuesearch@gmail.com">thevenuesearch@gmail.com</a>
          <span>India · Hyderabad launch</span>
        </div>
      </div>

      <div className="footerBottom">
        <span>© {new Date().getFullYear()} The Venue Search</span>
        <span>Built for the next generation of destination weddings.</span>
        <a href="#main-content" className="backTop">Back to top ↑</a>
      </div>
    </footer>
  );
}
