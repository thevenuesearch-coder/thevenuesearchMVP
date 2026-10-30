import { imgProps } from '../../lib/image';

type CollageVenue = { id: string; name: string; image: string };

/*
 * Four overlapping venue photographs for the home hero. Receives real
 * venue records (name + image) from Supabase via the page — nothing here
 * is static artwork.
 */
export function HeroCollage({ venues }: { venues: CollageVenue[] }) {
  const slots = ['s1', 's2', 's3', 's4'];
  const shots = venues.slice(0, 4);

  if (shots.length < 3) return null;

  return (
    <div className="heroCollage" aria-label="Featured venues">
      <p className="tagline" aria-hidden="true">
        Extraordinary venues.
        <br />
        Unforgettable celebrations.
      </p>
      {shots.map((v, i) => (
        <figure className={`shot ${slots[i]}`} key={v.id}>
          <img
            {...imgProps(v.image, v.name, {
              width: 420,
              height: 560,
              sizes: i === 2 ? '(max-width:1100px) 40vw, 24vw' : '(max-width:1100px) 32vw, 18vw',
              priority: i === 2,
            })}
          />
          {i === 2 && <figcaption>{v.name}</figcaption>}
        </figure>
      ))}
    </div>
  );
}
