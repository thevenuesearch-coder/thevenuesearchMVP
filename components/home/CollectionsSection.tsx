import Link from 'next/link';
import { imgProps, isOptimizable } from '../../lib/image';

type V = { id: string; name: string; type: string; tags: string[]; image: string };

const GROUPS: { title: string; blurb: string; match: (v: V) => boolean }[] = [
  { title: 'Luxury Palaces', blurb: 'For a royal celebration', match: (v) => /palace/i.test(v.type) },
  { title: 'Beachfront Venues', blurb: 'Sun, sand and unforgettable vows', match: (v) => /beach/i.test(v.type) },
  { title: 'Heritage Hotels', blurb: 'Timeless elegance', match: (v) => /heritage/i.test(v.type) },
  {
    title: 'Hill Resorts',
    blurb: 'Serene mountain escapes',
    match: (v) => /hill/i.test(v.type) || v.tags.some((t) => /himalayan/i.test(t)),
  },
];

/* "Find Inspiration" — collections derived from each venue's real type/tags. */
export function CollectionsSection({ venues }: { venues: V[] }) {
  const cards = GROUPS.flatMap((g) => {
    const pick = venues.find((v) => g.match(v) && isOptimizable(v.image));
    return pick ? [{ ...g, venue: pick }] : [];
  });

  if (cards.length < 2) return null;

  return (
    <section className="vsSection vsNavy" aria-labelledby="coll-title">
      <div className="vsWrap">
        <div className="vsHead">
          <div>
            <span className="vsKicker">CURATED COLLECTIONS FOR YOUR SPECIAL DAY</span>
            <h2 id="coll-title">Find Inspiration</h2>
            <p>Explore handpicked collections of extraordinary venues for every celebration.</p>
          </div>
          <Link className="vsLink" href="/collections">View all collections →</Link>
        </div>

        <ul className="collRow">
          {cards.map((c) => (
            <li key={c.title}>
              <Link className="collCard" data-cursor="view" href="/collections">
                <img
                  {...imgProps(c.venue.image, c.venue.name, {
                    width: 360,
                    height: 520,
                    sizes: '(max-width:700px) 70vw, 300px',
                  })}
                />
                <span className="collText">
                  <strong>{c.title}</strong>
                  <small>{c.blurb}</small>
                </span>
                <span className="collArrow" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
