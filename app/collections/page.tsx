'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { fetchVenues } from '../../lib/venues';
import type { Venue } from '../../lib/data';

export default function Collections() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetchVenues()
      .then((data) => {
        if (mounted) setVenues(data);
      })
      .catch((err) => {
        console.error('Failed to load venues:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const featured = venues.slice(0, 4);

  return (
    <main className="page">
      <div className="centerIntro">
        <span className="kicker">CURATED COLLECTIONS</span>
        <h1>Choose the mood before the menu.</h1>
        <p>
          Destination wedding discovery starts with the
          experience you want guests to remember.
        </p>
      </div>

      {loading ? (
        <div className="emptyState">
          <p>Loading collections…</p>
        </div>
      ) : featured.length === 0 ? (
        <div className="emptyState">
          <p>No venues are published yet — check back soon.</p>
        </div>
      ) : (
        <div className="collectionGrid">
          {featured.map((v) => (
            <Link
              className="collectionLarge"
              href={`/venues/${v.id}`}
              key={v.id}
            >
              <img src={v.image} alt={v.name} />
              <div>
                <span className="kicker">COLLECTION</span>
                <h2>{v.name}</h2>
                <p>{v.type}</p>
                <b>Explore →</b>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
