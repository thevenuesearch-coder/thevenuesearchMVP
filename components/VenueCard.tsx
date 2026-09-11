'use client';
import Link from 'next/link';
import { useState } from 'react';

export function VenueCard({ v }: { v: any }) {
  const [saved, setSaved] = useState(false);
  return (
    <article className="venueCard">
      <div className="venueImg">
        <img src={v.image} alt={v.name} />
        <span className="verified">✓ Verified</span>
        <button className="heart" type="button" aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'} onClick={() => setSaved(!saved)}>{saved ? '♥' : '♡'}</button>
      </div>
      <div className="venueBody">
        <div className="eyebrow">{v.type} · {v.city}</div>
        <Link href={`/venues/${v.id}`}><h3>{v.name}</h3></Link>
        <p>{v.desc}</p>
        <div className="meta">
          <span>Up to {v.capacity} guests</span>
          <span>★ {v.rating}</span>
        </div>
        <div className="venueCtaRow">
          <span className="verifiedLabel">Verified venue profile</span>
          <Link data-cursor="view" className="smallBtn" href={`/venues/${v.id}`}>View venue</Link>
        </div>
      </div>
    </article>
  );
}
