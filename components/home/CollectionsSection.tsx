import Link from 'next/link';
import { imgProps, isOptimizable } from '../../lib/image';
import { Reveal } from '../collections/Reveal';
import { SectionHead } from './SectionHead';

type V = { id: string; name: string; type: string; tags: string[]; image: string };

const GROUPS: { title: string; blurb: string; match: (v: V) => boolean }[] = [
  { title: 'Luxury Palaces', blurb: 'For a royal celebration', match: (v) => /palace/i.test(v.type) },
  { title: 'Heritage Hotels', blurb: 'Timeless elegance', match: (v) => /heritage/i.test(v.type) },
  { title: 'Beachfront Venues', blurb: 'Sun, sand and unforgettable vows', match: (v) => /beach/i.test(v.type) },
  {
    title: 'Hill Resorts',
    blurb: 'Serene mountain escapes',
    match: (v) => /hill/i.test(v.type) || v.tags.some((t) => /himalayan/i.test(t)),
  },
];

/*
 * Collections — hover/focus-expanding panels (CSS only). Each panel is
 * derived from real venue type/tags; the photograph is a real venue.
 * On touch screens the panels stack as full-width tiles.
 */
export function CollectionsSection({ venues }: { venues: V[] }) {
  const panels = GROUPS.flatMap((g) => {
    const pick = venues.find((v) => g.match(v) && isOptimizable(v.image));
    return pick ? [{ ...g, venue: pick }] : [];
  });

  if (panels.length < 2) return null;

  return (
    <section className="edSection edNavy" aria-labelledby="coll-title">
      <div className="edWrap">
        <Reveal>
          <SectionHead
            id="coll-title"
            index="02"
            label="Collections"
            title={<>Choose the mood, <em>then the menu.</em></>}
            blurb="Handpicked collections for every kind of celebration."
            href="/collections"
            hrefLabel="All collections"
          />
        </Reveal>

        <Reveal delay={0.08}>
          <ul className="panels">
            {panels.map((p, i) => (
              <li key={p.title} className="panel">
                <Link className="panelLink" data-cursor="view" href="/collections">
                  <img
                    {...imgProps(p.venue.image, p.venue.name, {
                      width: 900,
                      height: 1200,
                      sizes: '(max-width:800px) 92vw, 40vw',
                    })}
                  />
                  <span className="panelShade" aria-hidden="true" />
                  <span className="panelNum">0{i + 1}</span>
                  <span className="panelText">
                    <strong>{p.title}</strong>
                    <small>{p.blurb}</small>
                    <span className="panelGo">View collection <i aria-hidden="true">→</i></span>
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
