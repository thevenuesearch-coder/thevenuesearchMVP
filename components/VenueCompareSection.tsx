'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import type { Venue } from '../lib/data';
import { fetchVenues, fetchVenueBySlug } from '../lib/venues';
import {
  formatPrice,
  bestForTags,
  buildCategories,
  buildAmenityUnion,
  pickRivalVenues,
  serializeColumns,
  type Column,
} from '../lib/compareLogic';

const RIVAL_COUNT = 3;

export function VenueCompareSection({ venue }: { venue: Venue }) {
  // allVenues comes from the list endpoint, which (by design, for
  // list-page performance) doesn't include room data -- fine for
  // populating the "change venue" picker, but NOT enough to compare
  // rooms/amenities accurately, so full detail is fetched separately
  // below for whichever venues are actually being compared.
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [rivalIds, setRivalIds] = useState<string[] | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, Venue>>({});

  useEffect(() => {
    let mounted = true;
    fetchVenues()
      .then((venues) => {
        if (!mounted) return;
        setAllVenues(venues);
        const rivals = pickRivalVenues(venue, venues, RIVAL_COUNT);
        setRivalIds(rivals.map((r) => r.id));
      })
      .catch(() => mounted && setAllVenues([]))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venue.id]);

  // Full detail fetch (rooms, amenities, spaces) for every rival --
  // matches how /compare fetches its columns, so rooms/amenities
  // aren't silently blank just because the pick came from the list.
  useEffect(() => {
    if (!rivalIds) return;
    const missing = rivalIds.filter((id) => id !== venue.id && !(id in detailCache));
    if (missing.length === 0) return;

    let mounted = true;
    Promise.all(
      missing.map((id) =>
        fetchVenueBySlug(id)
          .then((v) => [id, v] as const)
          .catch(() => [id, null] as const)
      )
    ).then((results) => {
      if (!mounted) return;
      setDetailCache((prev) => {
        const next = { ...prev };
        for (const [id, v] of results) if (v) next[id] = v;
        return next;
      });
    });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rivalIds]);

  const rivals = useMemo(() => {
    if (!rivalIds) return [];
    return rivalIds
      .map((id) => detailCache[id])
      .filter((v): v is Venue => Boolean(v));
  }, [rivalIds, detailCache]);

  const columns: Column[] = useMemo(
    () => [venue, ...rivals].map((v) => ({ venue: v, space: v.venueSpaces[0] || null })),
    [venue, rivals]
  );

  const categories = useMemo(() => buildCategories(columns), [columns]);
  const amenityUnion = useMemo(
    () => buildAmenityUnion(columns.map((c) => c.venue)),
    [columns]
  );

  function swapRival(index: number, newId: string) {
    setRivalIds((prev) => {
      const next = prev ? [...prev] : [];
      next[index] = newId;
      return next;
    });
  }

  const gridStyle = { gridTemplateColumns: `200px repeat(${columns.length}, minmax(190px, 1fr))` };
  const fullCompareHref = `/compare?v=${serializeColumns(columns.map((c) => ({ slug: c.venue.id, spaceId: null })))}`;

  if (loading) return null;
  if (rivals.length === 0) return null;

  return (
    <section className="venueCompareSection">
      <div className="venueCompareHeading">
        <span className="kicker">SIDE BY SIDE</span>
        <h2>Comparing {venue.name} with similar venues</h2>
        <Link href={fullCompareHref} className="venueCompareFullLink">
          Open full comparison →
        </Link>
      </div>

      <div className="compareUnit">
      <div className="compareCardsRow venueCompareCardsRow">
        {columns.map((col, index) => (
          <div className="compareHeaderCard" key={`${col.venue.id}-${index}`}>
            <div className="compareHeaderImage">
              {col.venue.image ? (
                <img src={col.venue.image} alt={col.venue.name} loading="lazy" />
              ) : (
                <div className="compareHeaderImageFallback">The Venue Search</div>
              )}
              {index === 0 && <span className="verified">This venue</span>}
            </div>

            <div className="compareHeaderBody">
              <span className="compareHeaderVenue">{col.venue.name}</span>
              <span className="compareHeaderLocation">
                {col.venue.city}
                {col.venue.country && col.venue.country !== col.venue.city ? `, ${col.venue.country}` : ''}
              </span>
              <span className="compareHeaderPrice">{formatPrice(col.venue.price)}</span>
              {col.venue.rating ? (
                <span className="compareHeaderRating">{col.venue.rating} ★</span>
              ) : null}

              <div className="compareBestFor">
                {bestForTags(col.venue).map((tag) => (
                  <span className="compareBestForTag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>

              {index > 0 && (
                <select
                  className="venueCompareSwap"
                  value={col.venue.id}
                  aria-label={`Change comparison venue (currently ${col.venue.name})`}
                  onChange={(e) => swapRival(index - 1, e.target.value)}
                >
                  {allVenues
                    .filter((v) => v.id === col.venue.id || !columns.some((c) => c.venue.id === v.id))
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} — {v.city}
                      </option>
                    ))}
                </select>
              )}

              <div className="compareHeaderCtas">
                <Link className="outlineBtn" href={`/venues/${col.venue.id}`}>
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="compareTableWrap">
        <div className="compareTable" style={gridStyle}>
          <div className="compareStickyHeader" style={gridStyle}>
            <div className="compareStickyCorner" />
            {columns.map((c, i) => (
              <div className="compareStickyCell" key={i}>
                {c.venue.image ? (
                  <img src={c.venue.image} alt="" />
                ) : (
                  <div className="compareStickyImgFallback" />
                )}
                <span>{c.venue.name}</span>
              </div>
            ))}
          </div>

          {categories.map((category) => (
            <div className="compareCategoryBlock" key={category.key}>
              <div className="compareCategoryHeading" style={gridStyle}>
                <span>{category.title}</span>
              </div>
              {category.rows.map((r) => {
                const allEqual = r.values.every((v) => v === r.values[0]);
                return (
                  <div
                    className={`compareRow${!r.skipDiff && !allEqual ? ' diffRow' : ''}`}
                    style={gridStyle}
                    key={r.label}
                  >
                    <span className="compareRowLabel">{r.label}</span>
                    {r.values.map((v, i) => (
                      <span className="compareRowValue" key={i}>
                        {v}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}

          <div className="compareCategoryBlock">
            <div className="compareCategoryHeading" style={gridStyle}>
              <span>Amenities</span>
            </div>
            {amenityUnion.length === 0 && (
              <div className="compareRow" style={gridStyle}>
                <span className="compareRowLabel">—</span>
                <span className="compareRowValue" style={{ gridColumn: `2 / span ${columns.length}` }}>
                  No amenity data available yet for these venues.
                </span>
              </div>
            )}
            {amenityUnion.map((item) => {
              const allEqual = item.present.every((p) => p === item.present[0]);
              return (
                <div
                  className={`compareRow amenityRow${!allEqual ? ' diffRow' : ''}`}
                  style={gridStyle}
                  key={item.label}
                >
                  <span className="compareRowLabel">{item.label}</span>
                  {item.present.map((p, i) => (
                    <span className={`amenityMark ${p ? 'yes' : 'no'}`} key={i}>
                      {p ? '✓ Available' : '— Not available'}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
