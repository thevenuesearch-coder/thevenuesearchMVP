import Link from 'next/link';
import { imgProps, isOptimizable } from '../../lib/image';
import { Reveal } from '../collections/Reveal';
import { SectionHead } from './SectionHead';

type V = { id: string; name: string; destination: string; state: string; image: string };

/*
 * Destinations — an asymmetric editorial mosaic. Built only from published
 * venue records: one tile per city, photographed with a real venue there.
 * No counts, no invented captions; the small label is the venue's state.
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

  const tiles = Array.from(groups.entries())
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, 5);

  if (tiles.length < 3) return null;

  return (
    <section className="edSection edIvory" aria-labelledby="dest-title">
      <div className="edWrap">
        <Reveal>
          <SectionHead
            id="dest-title"
            index="01"
            label="Destinations"
            title={<>Where the story <em>begins.</em></>}
            blurb="From lake palaces to Himalayan terraces — the places couples travel for."
            href="/explore"
            hrefLabel="All destinations"
          />
        </Reveal>

        <Reveal delay={0.08}>
          <ul className={`destMosaic n${tiles.length}`}>
            {tiles.map(([city, g], i) => (
              <li key={city} className={`dm dm${i + 1}`}>
                <Link
                  className="dmCard"
                  data-cursor="view"
                  href={`/explore?destination=${encodeURIComponent(g.state || city)}`}
                >
                  <img
                    {...imgProps(g.image, g.alt, {
                      width: 900,
                      height: 1100,
                      sizes: i === 0 ? '(max-width:800px) 92vw, 42vw' : '(max-width:800px) 92vw, 30vw',
                    })}
                  />
                  <span className="dmShade" aria-hidden="true" />
                  <span className="dmNum">0{i + 1}</span>
                  <span className="dmText">
                    <small>{g.state}</small>
                    <strong>{city}</strong>
                    <span className="dmGo">Explore venues <i aria-hidden="true">→</i></span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
