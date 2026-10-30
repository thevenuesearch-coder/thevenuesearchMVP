import Link from 'next/link';
import { imgProps, isOptimizable } from '../../lib/image';

type V = { id: string; name: string; destination: string; state: string; image: string };

/*
 * "Popular Wedding Destinations" — built only from published venue records.
 * One card per destination (city); the photo is a real venue in that city.
 * The subtitle is the state, a factual label (no invented taglines or counts).
 */
export function DestinationsSection({ venues }: { venues: V[] }) {
  const groups = new Map<string, { state: string; image: string; alt: string; n: number }>();

  for (const v of venues) {
    if (!v.destination) continue;
    const g = groups.get(v.destination);
    if (g) {
      g.n += 1;
      continue;
    }
    if (isOptimizable(v.image)) {
      groups.set(v.destination, { state: v.state, image: v.image, alt: v.name, n: 1 });
    }
  }

  const cards = Array.from(groups.entries())
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, 8);

  if (cards.length < 3) return null;

  return (
    <section className="vsSection vsIvory" aria-labelledby="dest-title">
      <div className="vsWrap">
        <div className="vsHead">
          <div>
            <span className="vsKicker">EXPLORE INDIA&apos;S MOST BEAUTIFUL DESTINATIONS</span>
            <h2 id="dest-title">Popular Wedding Destinations</h2>
            <p>From royal palaces to serene beaches, discover venues across India&apos;s most sought-after locations.</p>
          </div>
          <Link className="vsLink" href="/explore">View all destinations →</Link>
        </div>

        <ul className="destRow">
          {cards.map(([city, g]) => (
            <li key={city}>
              <Link
                className="destCard"
                data-cursor="view"
                href={`/explore?destination=${encodeURIComponent(g.state || city)}`}
              >
                <img
                  {...imgProps(g.image, g.alt, {
                    width: 360,
                    height: 520,
                    sizes: '(max-width:700px) 62vw, 280px',
                  })}
                />
                <span className="destText">
                  <strong>{city}</strong>
                  <small>{g.state}</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
