'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';

import { imgProps } from '../../lib/image';
import type { CompareCell, CompareVariant } from '../../lib/compare/types';
import type { Experience, ExpRow } from '../../lib/compare/experience';
import styles from './experience.module.css';

/*
 * Premium comparison interface for /compare.
 *
 * Presentation only: the data arrives already built (verified-only rules
 * live in lib/compare). Selection, add and remove stay URL-driven server
 * navigation, exactly as before. This component owns just local UI state:
 * open sections, "show only differences" and which two columns are shown
 * on small screens.
 */

type Props = {
  experience: Experience;
  removeHrefs: Record<string, string>;
  addHref: string;
  max: number;
};

const MORE = /^\+\d+ more$/;

function Dash() {
  return (
    <span className={styles.empty}>
      <span aria-hidden="true">—</span>
      <span className={styles.sr}>Not listed</span>
    </span>
  );
}

function Check() {
  return (
    <svg className={styles.check} viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.14" />
      <path d="m5.8 10.4 2.7 2.7 5.7-5.9" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CellView({ value, variant }: { value: CompareCell; variant: CompareVariant }) {
  if (value === null) return <Dash />;

  if (variant === 'check') {
    return (
      <span className={styles.checkRow}>
        <Check />
        {typeof value === 'string' ? <span>{value}</span> : <span className={styles.sr}>Available</span>}
      </span>
    );
  }
  if (value === true) return <Check />;

  if (Array.isArray(value)) {
    if (variant === 'chips') {
      return (
        <ul className={styles.chips}>
          {value.map((item) => (
            <li key={item} className={MORE.test(item) ? styles.chipMore : styles.chip}>{item}</li>
          ))}
        </ul>
      );
    }
    return (
      <ul className={styles.lines}>
        {value.map((item) => {
          const [name, meta] = item.split(' · ');
          return (
            <li key={item}>
              <span className={MORE.test(item) ? styles.more : styles.lineName}>{name}</span>
              {meta && <span className={styles.lineMeta}>{meta}</span>}
            </li>
          );
        })}
      </ul>
    );
  }

  return <span className={variant === 'stat' ? styles.stat : styles.text}>{value}</span>;
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CompareExperience({ experience, removeHrefs, addHref, max }: Props) {
  const { venues, groups, insights } = experience;
  const n = venues.length;

  const [onlyDiff, setOnlyDiff] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.key, true]))
  );
  /* Small screens show two columns at a time. */
  const [visible, setVisible] = useState<number[]>(() => [0, 1].filter((i) => i < n));
  const [active, setActive] = useState<string>(groups[0]?.key ?? '');

  /* Keep local state valid when venues are added or removed (URL-driven). */
  useEffect(() => {
    setVisible((prev) => {
      const kept = prev.filter((i) => i < n);
      for (let i = 0; kept.length < Math.min(2, n) && i < n; i += 1) {
        if (!kept.includes(i)) kept.push(i);
      }
      return kept.sort();
    });
    setOpen((prev) => Object.fromEntries(groups.map((g) => [g.key, prev[g.key] ?? true])));
  }, [n, groups]);

  /* Highlight the section being read in the quick-nav. */
  useEffect(() => {
    const els = groups
      .map((g) => document.getElementById(`grp-${g.key}`))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0 || typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id.replace('grp-', ''));
      },
      { rootMargin: '-200px 0px -55% 0px', threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [groups]);

  const toggleVisible = useCallback(
    (index: number) => {
      setVisible((prev) => {
        if (prev.includes(index)) return prev.length > 1 ? prev.filter((i) => i !== index) : prev;
        const next = [...prev, index];
        return (next.length > 2 ? next.slice(next.length - 2) : next).sort();
      });
    },
    []
  );

  const jumpTo = (key: string) => {
    setOpen((prev) => ({ ...prev, [key]: true }));
    const el = document.getElementById(`grp-${key}`);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* Let the accordion open first so the scroll lands in the right place. */
    window.setTimeout(() => el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }), 60);
    setActive(key);
  };

  const allOpen = groups.every((g) => open[g.key]);

  const diffCount = useMemo(
    () => groups.reduce((sum, g) => sum + g.rows.filter((r) => r.status === 'differs').length, 0),
    [groups]
  );

  const rootStyle = { '--n': n, '--m': Math.min(n, 2) } as CSSProperties;
  const hiddenOnSmall = (i: number) => !visible.includes(i);

  const rowIsGone = (row: ExpRow) => onlyDiff && row.status === 'same';

  return (
    <div className={styles.root} style={rootStyle}>
      {/* ---------- Venue cards ---------- */}
      <ul className={styles.cards} aria-label="Selected venues">
        {venues.map((venue, i) => (
          <li key={venue.id} className={styles.card} style={{ '--i': i } as CSSProperties}>
            <div className={styles.media}>
              {venue.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  {...imgProps(venue.image, venue.name, {
                    width: 640,
                    height: 480,
                    sizes: '(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 24vw',
                    priority: i < 2,
                  })}
                  className={styles.image}
                />
              ) : (
                <span className={styles.noImage} aria-hidden="true" />
              )}
              <Link
                href={removeHrefs[venue.id]}
                scroll={false}
                className={styles.remove}
                aria-label={`Remove ${venue.name} from comparison`}
              >
                <span aria-hidden="true">×</span>
              </Link>
              {venue.type && <span className={styles.typeBadge}>{venue.type}</span>}
            </div>

            <div className={styles.cardBody}>
              <h3 className={styles.cardName}>{venue.name}</h3>
              {venue.location && <p className={styles.cardLoc}>{venue.location}</p>}

              <ul className={styles.facts}>
                {venue.capacityLabel && <li>{venue.capacityLabel}</li>}
                {venue.spaceCount > 0 && (
                  <li>{venue.spaceCount} event {venue.spaceCount === 1 ? 'space' : 'spaces'}</li>
                )}
                {venue.rating && (
                  <li>
                    <span aria-hidden="true">★</span> {venue.rating}
                    <span className={styles.sr}> out of 5</span>
                  </li>
                )}
              </ul>

              {venue.description && <p className={styles.cardDesc}>{venue.description}</p>}

              <div className={styles.cardCtas}>
                <Link href={`/venues/${venue.id}`} className={styles.ctaPrimary}>
                  View property details <span aria-hidden="true">→</span>
                </Link>
                <Link href={`/enquiry?venue=${venue.id}`} className={styles.ctaGhost}>
                  Enquire now
                </Link>
              </div>
            </div>
          </li>
        ))}

        {n < max && (
          <li className={styles.addCard} style={{ '--i': n } as CSSProperties}>
            <Link href={addHref} className={styles.addLink}>
              <span className={styles.addPlus} aria-hidden="true">+</span>
              <span>Add another venue</span>
              <small>Up to {max} venues</small>
            </Link>
          </li>
        )}
      </ul>

      {/* ---------- Sticky controls + column heads ---------- */}
      <div className={styles.stick}>
        <div className={styles.controls}>
          <nav className={styles.quickNav} aria-label="Jump to a comparison section">
            {groups.map((g) => (
              <a
                key={g.key}
                href={`#grp-${g.key}`}
                className={styles.navChip}
                data-active={active === g.key}
                aria-current={active === g.key ? 'true' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  jumpTo(g.key);
                }}
              >
                {g.label}
              </a>
            ))}
          </nav>

          <div className={styles.tools}>
            <button
              type="button"
              role="switch"
              aria-checked={onlyDiff}
              className={styles.switch}
              onClick={() => setOnlyDiff((v) => !v)}
            >
              <span className={styles.track} aria-hidden="true"><span className={styles.thumb} /></span>
              <span>Show only differences</span>
              <span className={styles.count}>{diffCount}</span>
            </button>

            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => setOpen(Object.fromEntries(groups.map((g) => [g.key, !allOpen])))}
            >
              {allOpen ? 'Collapse all' : 'Expand all'}
            </button>
          </div>
        </div>

        {n > 2 && (
          <div className={styles.switcher} role="group" aria-label="Choose two venues to show">
            {venues.map((v, i) => (
              <button
                key={v.id}
                type="button"
                className={styles.switchChip}
                aria-pressed={visible.includes(i)}
                onClick={() => toggleVisible(i)}
              >
                {v.name}
              </button>
            ))}
          </div>
        )}

        <div className={`${styles.grid} ${styles.colHeads}`} role="row">
          <div className={styles.corner} role="columnheader">
            <span>{n} venues</span>
          </div>
          {venues.map((v, i) => (
            <div key={v.id} className={styles.colHead} role="columnheader" data-hidden={hiddenOnSmall(i)}>
              {v.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img {...imgProps(v.image, '', { width: 88, height: 88, sizes: '44px' })} className={styles.thumbImg} />
              )}
              <span className={styles.colName}>{v.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- Comparison groups ---------- */}
      <div className={styles.table} role="table" aria-label="Venue comparison">
        {groups.map((group) => {
          const diffs = group.rows.filter((r) => r.status === 'differs').length;
          const visibleRows = group.rows.filter((r) => !rowIsGone(r)).length;
          const isOpen = open[group.key] ?? true;

          return (
            <section key={group.key} id={`grp-${group.key}`} className={styles.group} role="rowgroup">
              <h3 className={styles.groupHead}>
                <button
                  type="button"
                  className={styles.groupBtn}
                  aria-expanded={isOpen}
                  aria-controls={`panel-${group.key}`}
                  onClick={() => setOpen((prev) => ({ ...prev, [group.key]: !isOpen }))}
                >
                  <span className={styles.groupTitle}>{group.label}</span>
                  {diffs > 0 && (
                    <span className={styles.diffPill}>{diffs} {diffs === 1 ? 'difference' : 'differences'}</span>
                  )}
                  <span className={styles.chev} data-open={isOpen}><ChevronIcon /></span>
                </button>
              </h3>

              <div id={`panel-${group.key}`} className={styles.panel} data-open={isOpen}>
                <div className={styles.panelInner}>
                  {group.rows.map((row) => (
                    <div key={row.key} className={styles.rowWrap} data-gone={rowIsGone(row)}>
                      <div className={styles.rowInner}>
                        <div className={`${styles.grid} ${styles.row}`} role="row" data-status={row.status}>
                          <div className={styles.label} role="rowheader">
                            <span>{row.label}</span>
                            {row.status === 'differs' && <span className={styles.diffTag}>Differs</span>}
                          </div>
                          {row.cells.map((cell, i) => (
                            <div key={venues[i].id} className={styles.cell} role="cell" data-hidden={hiddenOnSmall(i)}>
                              <CellView value={cell} variant={row.variant} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {onlyDiff && visibleRows === 0 && (
                    <p className={styles.noDiff}>No differences in this section: the listed details match.</p>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ---------- Summary ---------- */}
      {insights.length > 0 && (
        <section className={styles.summary} aria-labelledby="compare-summary">
          <span className={styles.summaryKicker}>AT A GLANCE</span>
          <h2 id="compare-summary" className={styles.summaryTitle}>How these venues differ</h2>

          <ul className={styles.insights}>
            {insights.map((item, i) => (
              <li key={item.title} className={styles.insight} style={{ '--i': i } as CSSProperties}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>

          <p className={styles.summaryNote}>
            Calculated from the details listed above. This is not a ranking or a recommendation, and some figures are
            still awaiting confirmation from the property.
          </p>
        </section>
      )}
    </div>
  );
}
