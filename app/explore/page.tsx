'use client';
import { useEffect, useMemo, useState } from 'react';
import { venues } from '../../lib/data';
import { VenueCard } from '../../components/VenueCard';

export default function Explore() {
  const [q, setQ] = useState('');
  const [cap, setCap] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const venueId = params.get('venue');
    const venueName = venueId ? venues.find((v) => v.id === venueId)?.name || '' : '';
    const guests = params.get('guests') || '';
    if (venueName) setQ(venueName);
    if (guests) setCap(guests.split('–')[0]);
  }, []);

  const filtered = useMemo(() => venues.filter((v) =>
    (!q || v.name.toLowerCase().includes(q.toLowerCase()) || v.tags.join(' ').toLowerCase().includes(q.toLowerCase())) &&
    (!cap || v.capacity >= Number(cap))
  ), [q, cap]);

  return (
    <main className="page">
      <div className="exploreHero"><span className="kicker">UDAIPUR · DESTINATION WEDDINGS</span><h1>Find your venue, <em>with confidence.</em></h1><p>Search verified inventory by what matters to your celebration.</p></div>
      <div className="filterBar">
        <input placeholder="Search venue, style or experience" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={cap} onChange={(e) => setCap(e.target.value)}><option value="">Guest capacity</option><option value="50">50+</option><option value="100">100+</option><option value="200">200+</option><option value="400">400+</option><option value="600">600+</option></select>
        <button data-cursor="view" className="outlineBtn" onClick={() => { setQ(''); setCap(''); }}>Reset</button>
      </div>
      <div className="resultHead"><span><b>{filtered.length}</b> curated venues</span><span>Verified inventory · Udaipur launch</span></div>
      <div className="venueGrid">{filtered.map((v) => <VenueCard key={v.id} v={v} />)}</div>
    </main>
  );
}
