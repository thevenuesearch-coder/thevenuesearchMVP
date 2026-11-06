'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { imgProps } from '../../../lib/image';
import { useWishlist } from '../../../lib/use-wishlist';
import type {
  XCell,
  XModel,
  XRow,
  XSection,
  XVenue,
} from '../../../lib/compare/experience';
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  HeartIcon,
  MapPinIcon,
} from '../../explore/icons';
import styles from './experience.module.css';

/*
 * The premium comparison view: insights, sticky venue bar, category
 * navigation, collapsible sections and a "Show only differences" mode.
 *
 * The page's body sets overflow-x: hidden, which stops position:
 * sticky from working anywhere on the site. So the "sticky" bar is a
 * fixed bar that appears once the real header scrolls out of view.
 */

const HEADER_OFFSET = 78; /* the site header's height */

type Props = {
  model: XModel;
  /* URL of the comparison without a given venue (the remove "x"). */
  removeHrefs: Record<string, string>;
};

/* ------------------------------------------------------------------ */
/*  Cells                                                              */
/* ------------------------------------------------------------------ */

function Cell({
  cell,
  best,
  venue,
}: {
  cell: XCell;
  best: boolean;
  venue: XVenue;
}) {
  switch (cell.kind) {
    case 'text':
      return <p className={styles.cellText}>{cell.text}</p>;

    case 'stat':
      return (
        <p className={styles.cellStat}>
          {cell.text}
          {best && <span className={styles.best}>Highest</span>}
        </p>
      );

    case 'chips':
      return (
        <ul className={styles.chips}>
          {cell.items.map((item) => (
            <li
              key={item}
              className={/^\+\d+ more$/.test(item) ? styles.chipMore : styles.chip}
            >
              {item}
            </li>
          ))}
        </ul>
      );

    case 'lines':
      return (
        <ul className={styles.lines}>
          {cell.items.map((item) => (
            <li key={item.name}>
              <span>{item.name}</span>
              {item.meta && <small>{item.meta}</small>}
            </li>
          ))}
        </ul>
      );

    case 'check':
      return (
        <p className={styles.cellCheck}>
          <span className={styles.checkIcon}>
            <CheckIcon size={14} />
          </span>
          <span>
            {cell.detail ?? <span className={styles.srOnly}>Available</span>}
          </span>
        </p>
      );

    case 'actions':
      return (
        <div className={styles.cellActions}>
          <Link href={venue.enquiryHref} className={styles.btnPrimary}>
            Drop an enquiry
          </Link>
          <Link href={venue.bookHref} className={styles.btnGhost}>
            Book the venue
          </Link>
        </div>
      );

    default:
      return (
        <p className={styles.missing} title="This venue has not published this detail">
          <span aria-hidden="true" className={styles.missingDash} />
          {cell.note ?? 'Not published'}
        </p>
      );
  }
}

function Row({ row, venues }: { row: XRow; venues: XVenue[] }) {
  return (
    <div
      className={styles.row}
      data-differs={row.differs ? 'true' : undefined}
      style={{ ['--n' as string]: venues.length }}
    >
      <div className={styles.rowLabel}>
        <span>{row.label}</span>
        {row.differs && (
          <span className={styles.diffDot} title="Differs between these venues">
            <span className={styles.srOnly}>Differs between venues</span>
          </span>
        )}
        {row.hint && <small>{row.hint}</small>}
      </div>

      <div className={styles.cells}>
        {row.cells.map((cell, index) => (
          <div
            key={venues[index].id}
            className={styles.cell}
            data-missing={cell.kind === 'missing' ? 'true' : undefined}
            data-best={row.highest.includes(index) ? 'true' : undefined}
          >
            <span className={styles.cellVenue}>{venues[index].name}</span>
            <Cell cell={cell} best={row.highest.includes(index)} venue={venues[index]} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Venue header cards                                                 */
/* ------------------------------------------------------------------ */

function SaveButton({ venue, compact }: { venue: XVenue; compact?: boolean }) {
  const { saved, busy, toggle } = useWishlist(venue.dbId, venue.id);

  return (
    <button
      type="button"
      className={`${styles.heart} ${saved ? styles.heartOn : ''} ${compact ? styles.heartSmall : ''}`}
      aria-pressed={saved}
      aria-label={
        saved ? `Remove ${venue.name} from favourites` : `Save ${venue.name} to favourites`
      }
      disabled={busy}
      onClick={toggle}
    >
      <HeartIcon size={compact ? 16 : 20} filled={saved} />
    </button>
  );
}

function VenueCardHead({
  venue,
  index,
  removeHref,
}: {
  venue: XVenue;
  index: number;
  removeHref: string;
}) {
  return (
    <article className={styles.headCard}>
      <div className={styles.headMedia}>
        {venue.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            {...imgProps(venue.image, `${venue.name}, ${venue.location}`, {
              width: 640,
              height: 480,
              sizes: '(max-width: 900px) 70vw, 300px',
              priority: index < 2,
            })}
          />
        ) : (
          <div className={styles.headMediaEmpty}>The Venue Search</div>
        )}
        {venue.type && <span className={styles.headBadge}>{venue.type}</span>}
        <Link
          href={removeHref}
          scroll={false}
          className={styles.headRemove}
          aria-label={`Remove ${venue.name} from comparison`}
        >
          <CloseIcon size={16} />
        </Link>
        <SaveButton venue={venue} />
      </div>

      <div className={styles.headBody}>
        <h3 className={styles.headName}>
          <Link href={venue.href}>{venue.name}</Link>
        </h3>
        {venue.location && (
          <p className={styles.headLoc}>
            <MapPinIcon size={15} />
            {venue.location}
          </p>
        )}
        <Link href={venue.href} className={styles.headLink}>
          View venue
          <ArrowRightIcon size={16} />
        </Link>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Section                                                            */
/* ------------------------------------------------------------------ */

function Section({
  section,
  rows,
  venues,
  open,
  onToggle,
  diffCount,
}: {
  section: XSection;
  rows: XRow[];
  venues: XVenue[];
  open: boolean;
  onToggle: () => void;
  diffCount: number;
}) {
  return (
    <section
      id={`sec-${section.id}`}
      data-section={section.id}
      className={`${styles.section} ${open ? styles.sectionOpen : ''}`}
      aria-labelledby={`sec-${section.id}-title`}
    >
      <h2 className={styles.sectionHead} id={`sec-${section.id}-title`}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`sec-${section.id}-body`}
          className={styles.sectionBtn}
        >
          <span className={styles.sectionTitle}>
            <span>{section.title}</span>
            <small>{section.blurb}</small>
          </span>
          {diffCount > 0 && (
            <span className={styles.sectionBadge}>
              {diffCount} {diffCount === 1 ? 'difference' : 'differences'}
            </span>
          )}
          <span className={styles.sectionChevron}>
            <ChevronDownIcon size={22} />
          </span>
        </button>
      </h2>

      <div className={styles.sectionBody} id={`sec-${section.id}-body`}>
        <div className={styles.sectionInner} inert={!open}>
          {rows.map((row) => (
            <Row key={row.key} row={row} venues={venues} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

export function CompareExperience({ model, removeHrefs }: Props) {
  const { venues, sections, insights, differences, notCompared } = model;

  const [onlyDiff, setOnlyDiff] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((s) => [s.id, true]))
  );
  const [active, setActive] = useState<string>(sections[0]?.id ?? 'overview');
  const [floating, setFloating] = useState(false);
  const [toast, setToast] = useState('');

  const headRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  /* Rows to show: all rows, or only the ones that differ. */
  const visible = useMemo(
    () =>
      sections
        .map((section) => ({
          section,
          rows: onlyDiff ? section.rows.filter((row) => row.differs) : section.rows,
          diffCount: section.rows.filter((row) => row.differs).length,
        }))
        .filter((entry) => entry.rows.length > 0),
    [sections, onlyDiff]
  );

  /* Show the fixed bar once the in-page venue header has scrolled away. */
  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const head = headRef.current?.getBoundingClientRect();
      const root = rootRef.current?.getBoundingClientRect();
      if (!head || !root) return;

      setFloating(head.bottom < HEADER_OFFSET + 8 && root.bottom > HEADER_OFFSET + 220);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* Highlight the category currently on screen. */
  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>('[data-section]')
    );
    if (nodes.length === 0 || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        const onScreen = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (onScreen) setActive((onScreen.target as HTMLElement).dataset.section ?? '');
      },
      { rootMargin: `-${HEADER_OFFSET + 110}px 0px -55% 0px`, threshold: 0 }
    );

    nodes.forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, [visible]);

  const goTo = useCallback((id: string) => {
    setOpen((current) => ({ ...current, [id]: true }));
    window.setTimeout(() => {
      document
        .getElementById(`sec-${id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  }, []);

  const flash = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  }, []);

  async function share() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Compare wedding venues', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      flash('Comparison link copied');
    } catch {
      /* The visitor dismissed the share sheet, or copy is blocked. */
      try {
        await navigator.clipboard.writeText(url);
        flash('Comparison link copied');
      } catch {
        flash('Copy the link from the address bar');
      }
    }
  }

  const allOpen = Object.values(open).every(Boolean);

  const nav = (
    <ul className={styles.navList}>
      {visible.map(({ section }) => (
        <li key={section.id}>
          <button
            type="button"
            className={`${styles.navBtn} ${active === section.id ? styles.navBtnOn : ''}`}
            aria-current={active === section.id ? 'true' : undefined}
            onClick={() => goTo(section.id)}
          >
            {section.title}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={styles.experience} ref={rootRef}>
      {/* ----------------------------------------- insights */}
      <section className={styles.insights} aria-labelledby="insights-title">
        <div className={styles.insightsHead}>
          <span className={styles.kickerGold}>At a glance</span>
          <h2 id="insights-title">What stands out</h2>
          <p>
            Worked out from the details each venue has published. Nothing is
            estimated, and a missing detail is never counted against a venue.
          </p>
        </div>

        <ul className={styles.insightGrid}>
          {insights.map((insight) => (
            <li key={insight.key} className={styles.insightCard}>
              <span className={styles.insightTitle}>{insight.title}</span>
              <p>{insight.statement}</p>
              {insight.detail && <small>{insight.detail}</small>}
            </li>
          ))}
        </ul>

        {differences.length > 0 && (
          <div className={styles.diffSummary}>
            <b>
              {model.differingCount} of {model.rowCount} details differ.
            </b>
            <ul>
              {differences.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ----------------------------------------- toolbar */}
      <div className={styles.toolbar}>
        <label className={styles.switch}>
          <input
            type="checkbox"
            role="switch"
            checked={onlyDiff}
            onChange={(event) => setOnlyDiff(event.target.checked)}
          />
          <span className={styles.switchTrack} aria-hidden="true">
            <span className={styles.switchKnob} />
          </span>
          <span className={styles.switchLabel}>Show only differences</span>
        </label>

        <div className={styles.toolbarActions}>
          <button
            type="button"
            className={styles.textBtn}
            onClick={() =>
              setOpen(Object.fromEntries(sections.map((s) => [s.id, !allOpen])))
            }
          >
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
          <button type="button" className={styles.btnOutline} onClick={share}>
            Share comparison
          </button>
        </div>
      </div>

      {/* ----------------------------------------- fixed bar */}
      <div
        className={styles.floatBar}
        data-show={floating}
        aria-hidden={!floating}
        style={{ ['--n' as string]: venues.length }}
      >
        <div className={styles.floatInner}>
          <ul className={styles.floatVenues}>
            {venues.map((venue) => (
              <li key={venue.id}>
                {venue.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    {...imgProps(venue.image, '', { width: 96, height: 96, sizes: '40px' })}
                  />
                )}
                <span>{venue.name}</span>
              </li>
            ))}
          </ul>
          <div className={styles.floatNav}>{floating ? nav : null}</div>
        </div>
      </div>

      {/* ----------------------------------------- venues */}
      <div className={styles.scroller}>
        <div className={styles.sheet} style={{ ['--n' as string]: venues.length }}>
          <div className={styles.heads} ref={headRef}>
            <div className={styles.headsSpacer} aria-hidden="true" />
            <div className={styles.headsGrid}>
              {venues.map((venue, index) => (
                <VenueCardHead
                  key={venue.id}
                  venue={venue}
                  index={index}
                  removeHref={removeHrefs[venue.id] ?? '/compare'}
                />
              ))}
            </div>
          </div>

          <div className={styles.navRow}>
            <span className={styles.navLabel}>Jump to</span>
            {nav}
          </div>

          {visible.length === 0 ? (
            <div className={styles.noDiff} role="status">
              <h3>No differences found</h3>
              <p>
                These venues publish the same details wherever they can be
                compared. Turn off “Show only differences” to see everything.
              </p>
            </div>
          ) : (
            visible.map(({ section, rows, diffCount }) => (
              <Section
                key={section.id}
                section={section}
                rows={rows}
                venues={venues}
                diffCount={diffCount}
                open={open[section.id] ?? true}
                onToggle={() =>
                  setOpen((current) => ({
                    ...current,
                    [section.id]: !(current[section.id] ?? true),
                  }))
                }
              />
            ))
          )}
        </div>
      </div>

      {/* ----------------------------------------- transparency */}
      <aside className={styles.coverage} aria-labelledby="coverage-title">
        <h2 id="coverage-title">Not compared yet</h2>
        <p>
          These details are not published for any of the selected venues, so
          they are left out rather than guessed. Ask the venue directly for:
        </p>
        <ul>
          {notCompared.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </aside>

      <div className={styles.toast} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
