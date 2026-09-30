'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import type { Venue } from '../lib/data';
import { fetchVenues, fetchVenueBySlug } from '../lib/venues';
import { MAX_COMPARE, MIN_COMPARE } from '../lib/compare';
import {
  NOT_AVAILABLE,
  formatPrice,
  bestForTags,
  buildCategories,
  buildAmenityUnion,
  parseColumnsParam,
  serializeColumns,
  type Column,
} from '../lib/compareLogic';

/* ============================================================
   PICKER (initial selection + "add venue")
   ============================================================ */

function VenuePicker({
  venues,
  loading,
  onSelect,
  label,
}: {
  venues: Venue[];
  loading: boolean;
  onSelect: (slug: string) => void;
  label: string;
}) {
  return (
    <div className="comparePicker">
      <span className="comparePickerLabel">{label}</span>
      <select
        defaultValue=""
        disabled={loading}
        onChange={(event) => {
          if (event.target.value) onSelect(event.target.value);
        }}
      >
        <option value="" disabled>
          {loading ? 'Loading venues…' : 'Choose a venue'}
        </option>
        {venues.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name} — {v.city}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ============================================================
   VENUE CARD (top row)
   ============================================================ */

function VenueCardColumn({
  column,
  allVenues,
  onChangeVenue,
  onChangeSpace,
  onRemove,
}: {
  column: Column;
  allVenues: Venue[];
  onChangeVenue: (slug: string) => void;
  onChangeSpace: (spaceId: string) => void;
  onRemove: () => void;
}) {
  const { venue, space } = column;
  const displayName = space?.name || venue.name;

  return (
    <div className="compareHeaderCard">
      <div className="compareHeaderImage">
        {(space?.image || venue.image) ? (
          <img src={space?.image || venue.image} alt={displayName} loading="lazy" />
        ) : (
          <div className="compareHeaderImageFallback">The Venue Search</div>
        )}
        {venue.verified && <span className="verified">✓ Verified</span>}
        <button
          type="button"
          className="compareRemoveBtn"
          aria-label={`Remove ${displayName} from comparison`}
          onClick={onRemove}
        >
          ×
        </button>
      </div>

      <div className="compareHeaderBody">
        <span className="compareHeaderVenue">{displayName}</span>
        <span className="compareHeaderProperty">{venue.name}</span>
        <span className="compareHeaderLocation">
          {venue.city}
          {venue.country && venue.country !== venue.city ? `, ${venue.country}` : ''}
        </span>

        <span className="compareHeaderPrice">{formatPrice(venue.price)}</span>
        {venue.rating ? <span className="compareHeaderRating">{venue.rating} ★</span> : null}

        <div className="compareBestFor">
          {bestForTags(venue).map((tag) => (
            <span className="compareBestForTag" key={tag}>
              {tag}
            </span>
          ))}
        </div>

        <div className="compareHeaderActions">
          <select
            value={venue.id}
            onChange={(event) => onChangeVenue(event.target.value)}
            aria-label={`Change property (currently ${venue.name})`}
          >
            {allVenues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — {v.city}
              </option>
            ))}
          </select>

          {venue.venueSpaces.length > 1 && (
            <select
              value={space?.id || ''}
              onChange={(event) => onChangeSpace(event.target.value)}
              aria-label={`Change venue space (currently ${displayName})`}
            >
              {venue.venueSpaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="compareHeaderCtas">
          <Link className="outlineBtn" href={`/venues/${venue.id}`}>
            View Venue
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN CLIENT COMPONENT
   ============================================================ */

export function CompareClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Back-compat: earlier version used ?a=&b=. Fold those into the
  // new ?v=slug,slug scheme so old links / the tray still work.
  const rawV = searchParams.get('v');
  const legacyA = searchParams.get('a');
  const legacyB = searchParams.get('b');
  const columnRefs = useMemo(() => {
    if (rawV) return parseColumnsParam(rawV);
    const legacy = [legacyA, legacyB].filter(Boolean) as string[];
    return parseColumnsParam(legacy.join(','));
  }, [rawV, legacyA, legacyB]);

  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [venueCache, setVenueCache] = useState<Record<string, Venue | null>>({});
  const [loadingSlugs, setLoadingSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    fetchVenues()
      .then((venues) => mounted && setAllVenues(venues))
      .catch(() => mounted && setAllVenues([]))
      .finally(() => mounted && setLoadingList(false));
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch full detail for every unique slug referenced in the URL.
  useEffect(() => {
    let mounted = true;
    const neededSlugs = Array.from(new Set(columnRefs.map((r) => r.slug))).filter(
      (slug) => !(slug in venueCache)
    );

    if (neededSlugs.length === 0) return;

    setLoadingSlugs((prev) => new Set([...prev, ...neededSlugs]));

    Promise.all(
      neededSlugs.map((slug) =>
        fetchVenueBySlug(slug)
          .then((venue) => [slug, venue] as const)
          .catch(() => [slug, null] as const)
      )
    ).then((results) => {
      if (!mounted) return;
      setVenueCache((prev) => {
        const next = { ...prev };
        for (const [slug, venue] of results) next[slug] = venue;
        return next;
      });
      setLoadingSlugs((prev) => {
        const next = new Set(prev);
        for (const [slug] of results) next.delete(slug);
        return next;
      });
    });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnRefs]);

  function writeColumnRefs(refs: { slug: string; spaceId: string | null }[]) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('a');
    params.delete('b');
    if (refs.length) params.set('v', serializeColumns(refs));
    else params.delete('v');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function updateVenueAt(index: number, slug: string) {
    const next = [...columnRefs];
    next[index] = { slug, spaceId: null };
    writeColumnRefs(next);
  }

  function updateSpaceAt(index: number, spaceId: string) {
    const next = [...columnRefs];
    next[index] = { ...next[index], spaceId };
    writeColumnRefs(next);
  }

  function removeAt(index: number) {
    const next = columnRefs.filter((_, i) => i !== index);
    writeColumnRefs(next);
  }

  function addVenue(slug: string) {
    if (columnRefs.length >= MAX_COMPARE) return;

    const existingCount = columnRefs.filter((r) => r.slug === slug).length;
    let spaceId: string | null = null;

    if (existingCount > 0) {
      const venue = venueCache[slug];
      const nextSpace = venue?.venueSpaces[existingCount];
      spaceId = nextSpace ? nextSpace.id : null;
    }

    writeColumnRefs([...columnRefs, { slug, spaceId }]);
  }

  const columns: (Column | null)[] = columnRefs.map((ref) => {
    const venue = venueCache[ref.slug];
    if (!venue) return null;
    const space = ref.spaceId ? venue.venueSpaces.find((s) => s.id === ref.spaceId) || null : venue.venueSpaces[0] || null;
    return { venue, space };
  });

  const readyColumns = columns.filter((c): c is Column => c !== null);
  const anyLoading = loadingSlugs.size > 0;
  const bothReady = readyColumns.length >= MIN_COMPARE && readyColumns.length === columnRefs.length;

  const categories = useMemo(() => {
    if (!bothReady) return [];
    return buildCategories(readyColumns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bothReady, readyColumns]);

  const amenityUnion = useMemo(() => {
    if (!bothReady) return [];
    return buildAmenityUnion(readyColumns.map((c) => c.venue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bothReady, readyColumns]);

  const gridStyle = { gridTemplateColumns: `220px repeat(${readyColumns.length}, minmax(220px, 1fr))` };

  return (
    <main className="page compare-page">
      <div className="centerIntro">
        <span className="kicker">SIDE BY SIDE</span>
        <h1>Compare venues.</h1>
        <p>
          Line up 2 to {MAX_COMPARE} venues — even different spaces at the same property, or
          venues from entirely different properties — on capacity, pricing, amenities, rooms
          and location.
        </p>
      </div>

      {/* =========================================================
          TOP ROW -- venue cards + pickers + add-venue slot
          ========================================================= */}

      <div className="compareUnit">
        <div className="compareCardsRow">
          {columnRefs.map((ref, index) => {
          const column = columns[index];
          const isLoading = loadingSlugs.has(ref.slug);

          if (column) {
            return (
              <VenueCardColumn
                key={`${ref.slug}-${index}`}
                column={column}
                allVenues={allVenues}
                onChangeVenue={(slug) => updateVenueAt(index, slug)}
                onChangeSpace={(spaceId) => updateSpaceAt(index, spaceId)}
                onRemove={() => removeAt(index)}
              />
            );
          }

          return (
            <div className="comparePickerCard" key={`${ref.slug}-${index}`}>
              {isLoading ? <p>Loading…</p> : <p className="compareError">That venue could not be found.</p>}
              <button type="button" className="outlineBtn" onClick={() => removeAt(index)}>
                Remove
              </button>
            </div>
          );
        })}

        {columnRefs.length < 2 &&
          Array.from({ length: 2 - columnRefs.length }).map((_, i) => (
            <div className="comparePickerCard" key={`empty-${i}`}>
              <VenuePicker
                venues={allVenues}
                loading={loadingList}
                label={columnRefs.length === 0 && i === 0 ? 'Choose the first venue' : 'Choose a venue'}
                onSelect={addVenue}
              />
            </div>
          ))}

        {columnRefs.length >= 2 && columnRefs.length < MAX_COMPARE && (
          <div className="comparePickerCard compareAddCard">
            <VenuePicker
              venues={allVenues}
              loading={loadingList}
              label={`Add another venue (${columnRefs.length}/${MAX_COMPARE})`}
              onSelect={addVenue}
            />
          </div>
        )}
        </div>

        {!bothReady && !anyLoading && columnRefs.length >= 2 && (
          <p className="compareHint">Loading your comparison…</p>
        )}

        {columnRefs.length === 0 && (
          <p className="compareHint">
            Pick two venues above to see the full comparison — or use the ⇄ Compare button on
            any venue card while browsing <Link href="/explore">Explore</Link>.
          </p>
        )}

        {/* =========================================================
            COMPARISON TABLE -- sticky first column, horizontal
            scroll on mobile, category sections
            ========================================================= */}

        {bothReady && (
        <div className="compareTableWrap">
          <div className="compareTable" style={gridStyle}>

            <div className="compareStickyHeader" style={gridStyle}>
              <div className="compareStickyCorner" />
              {readyColumns.map((c, i) => (
                <div className="compareStickyCell" key={i}>
                  {(c.space?.image || c.venue.image) ? (
                    <img src={c.space?.image || c.venue.image} alt="" />
                  ) : (
                    <div className="compareStickyImgFallback" />
                  )}
                  <span>{c.space?.name || c.venue.name}</span>
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

            {/* Amenities -- union checklist across every column */}
            <div className="compareCategoryBlock">
              <div className="compareCategoryHeading" style={gridStyle}>
                <span>Amenities</span>
              </div>
              {amenityUnion.length === 0 && (
                <div className="compareRow" style={gridStyle}>
                  <span className="compareRowLabel">—</span>
                  <span className="compareRowValue" style={{ gridColumn: `2 / span ${readyColumns.length}` }}>
                    No amenity data available yet for these venues.
                  </span>
                </div>
              )}
              {amenityUnion.map((item) => {
                const allEqual = item.present.every((p) => p === item.present[0]);
                return (
                  <div className={`compareRow amenityRow${!allEqual ? ' diffRow' : ''}`} style={gridStyle} key={item.label}>
                    <span className="compareRowLabel">{item.label}</span>
                    {item.present.map((p, i) => (
                      <span className={`amenityMark ${p ? 'yes' : 'no'}`} key={i}>
                        {p ? '✓ Available' : `— ${NOT_AVAILABLE}`}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Best for -- event suitability summary */}
            <div className="compareCategoryBlock">
              <div className="compareCategoryHeading" style={gridStyle}>
                <span>Best For</span>
              </div>
              <div className="compareRow" style={gridStyle}>
                <span className="compareRowLabel">Best for</span>
                {readyColumns.map((c, i) => (
                  <span className="compareRowValue" key={i}>
                    <div className="compareBestFor">
                      {bestForTags(c.venue).map((tag) => (
                        <span className="compareBestForTag" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </main>
  );
}
