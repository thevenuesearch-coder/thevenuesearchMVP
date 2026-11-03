'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import { toCapacity } from '../../lib/capacity';
import { FEATURE_DEFS } from '../../lib/compare/features';
import { MAX_COMPARE_VENUES } from '../../lib/compare/constants';
import type { VenueSummary } from '../../lib/data';

import { CompareTray } from '../compare/CompareTray';
import compareStyles from '../compare/compare-select.module.css';
import { VenueCard } from '../VenueCard';
import {
  ArrowRightIcon,
  CalendarIcon,
  ChevronDownIcon,
  CloseIcon,
  FunnelIcon,
  GridIcon,
  LandmarkIcon,
  LayersIcon,
  ListIcon,
  MapPinIcon,
  SearchIcon,
  SlidersIcon,
  StarIcon,
  UsersIcon,
} from './icons';
import styles from './explore.module.css';

/* Keeps the picks when the visitor opens /compare and comes back. */
const COMPARE_STORAGE_KEY = 'vs-compare-venues';

/* Guest-capacity slider step, in guests. */
const CAPACITY_STEP = 50;

/* How many options a long list shows before "Show all". */
const SHORT_LIST = 8;

export type ExploreViewProps = {
  initialVenues: VenueSummary[];
  initialError?: string;
};

/*
 * One set of filter choices. `capMax` equal to the slider's top value
 * means "no upper limit".
 */
type Filters = {
  destinations: string[];
  types: string[];
  spaceTypes: string[];
  amenities: string[];
  capMin: number;
  capMax: number;
};

type SectionId =
  | 'destination'
  | 'type'
  | 'capacity'
  | 'space'
  | 'amenities'
  | 'availability';

type SortKey = 'relevance' | 'name' | 'capacityDesc' | 'capacityAsc' | 'updated';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'capacityDesc', label: 'Guest capacity: high to low' },
  { value: 'capacityAsc', label: 'Guest capacity: low to high' },
  { value: 'updated', label: 'Recently updated' },
];

const AMENITY_LABELS = new Map(
  FEATURE_DEFS.map((def) => [def.key, def.label])
);

const numberFormat = new Intl.NumberFormat('en-IN');

function emptyFilters(capTop: number): Filters {
  return {
    destinations: [],
    types: [],
    spaceTypes: [],
    amenities: [],
    capMin: 0,
    capMax: capTop,
  };
}

function toggleIn(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

/* Counts how many venues carry each value; sorted most common first. */
function countBy(
  venues: VenueSummary[],
  pick: (venue: VenueSummary) => string[]
): [string, number][] {
  const counts = new Map<string, number>();

  for (const venue of venues) {
    for (const value of new Set(pick(venue))) {
      if (value) counts.set(value, (counts.get(value) || 0) + 1);
    }
  }

  return Array.from(counts.entries()).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);

    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);

  return matches;
}

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

function Section({
  id,
  title,
  icon,
  open,
  onToggle,
  badge,
  disabled,
  children,
}: {
  id: SectionId;
  title: string;
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  badge?: number;
  disabled?: boolean;
  children: ReactNode;
}) {
  const bodyId = useId();

  return (
    <section
      data-section={id}
      className={`${styles.acc} ${open ? styles.accOpen : ''} ${
        disabled ? styles.accDisabled : ''
      }`}
    >
      <h3 style={{ margin: 0 }}>
        <button
          type="button"
          className={styles.accHead}
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={onToggle}
        >
          <span className={styles.accIcon}>{icon}</span>
          <span className={styles.accTitle}>{title}</span>
          {badge ? <span className={styles.accBadge}>{badge}</span> : null}
          <span className={styles.accChevron}>
            <ChevronDownIcon size={20} />
          </span>
        </button>
      </h3>

      <div className={styles.accBody} id={bodyId} role="region" aria-label={title}>
        <div className={styles.accInner} inert={!open}>
          {children}
        </div>
      </div>
    </section>
  );
}

function OptionList({
  options,
  selected,
  onToggle,
  labelFor,
  showAll,
  onShowAll,
  name,
  collapsible = true,
}: {
  options: [string, number][];
  selected: string[];
  onToggle: (value: string) => void;
  labelFor?: (value: string) => string;
  showAll: boolean;
  onShowAll: () => void;
  name: string;
  collapsible?: boolean;
}) {
  const visible =
    showAll || !collapsible ? options : options.slice(0, SHORT_LIST);

  return (
    <>
      <ul className={styles.options} aria-label={name}>
        {visible.map(([value, count]) => (
          <li key={value}>
            <label className={styles.option}>
              <input
                type="checkbox"
                className={styles.check}
                checked={selected.includes(value)}
                onChange={() => onToggle(value)}
              />
              <span className={styles.optionText}>
                {labelFor ? labelFor(value) : value}
              </span>
              <span className={styles.optionCount}>({count})</span>
            </label>
          </li>
        ))}
      </ul>

      {collapsible && options.length > SHORT_LIST && (
        <button type="button" className={styles.moreBtn} onClick={onShowAll}>
          {showAll ? 'Show fewer' : `Show all (${options.length})`}
        </button>
      )}
    </>
  );
}

function CapacitySlider({
  top,
  low,
  high,
  onChange,
}: {
  top: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
}) {
  const lowPct = (low / top) * 100;
  const highPct = (high / top) * 100;

  return (
    <div className={styles.sliderWrap}>
      <div className={styles.sliderValues}>
        <span>
          <small>Min</small>
          {numberFormat.format(low)}
        </span>
        <span>
          <small>Max</small>
          {high >= top ? `${numberFormat.format(top)}+` : numberFormat.format(high)}
        </span>
      </div>

      <div className={styles.sliderTrack}>
        <span className={styles.sliderRail} />
        <span
          className={styles.sliderFill}
          style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
        />
        <input
          type="range"
          className={styles.range}
          min={0}
          max={top}
          step={CAPACITY_STEP}
          value={low}
          aria-label="Minimum guests"
          onChange={(event) =>
            onChange(Math.min(Number(event.target.value), high), high)
          }
        />
        <input
          type="range"
          className={styles.range}
          min={0}
          max={top}
          step={CAPACITY_STEP}
          value={high}
          aria-label="Maximum guests"
          onChange={(event) =>
            onChange(low, Math.max(Number(event.target.value), low))
          }
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function ExploreView({
  initialVenues,
  initialError,
}: ExploreViewProps) {
  /*
   * Venues arrive already loaded from the server -- fetched in
   * app/explore/page.tsx (a Server Component) so the grid is present
   * in the initial HTML for search engines and anyone whose JS is
   * slow. No loading state is needed here.
   */
  const venues = initialVenues;
  const venuesError = initialError || '';

  /* Venues picked for comparison (public slugs, max 4). */
  const [compareIds, setCompareIds] = useState<string[]>([]);

  /* ===================================================== COMPARE */

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(COMPARE_STORAGE_KEY);
      const saved: unknown = raw ? JSON.parse(raw) : [];

      if (Array.isArray(saved)) {
        /* Only restore venues that still exist in the list. */
        const valid = saved.filter(
          (id): id is string =>
            typeof id === 'string' && venues.some((v) => v.id === id)
        );
        if (valid.length > 0) {
          setCompareIds(valid.slice(0, MAX_COMPARE_VENUES));
        }
      }
    } catch {
      /* Storage blocked or corrupted: start with an empty selection. */
    }
  }, [venues]);

  function updateCompare(next: string[]) {
    setCompareIds(next);

    try {
      window.sessionStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* Not essential: the selection still works for this visit. */
    }
  }

  function toggleCompare(id: string) {
    if (compareIds.includes(id)) {
      updateCompare(compareIds.filter((x) => x !== id));
    } else if (compareIds.length < MAX_COMPARE_VENUES) {
      updateCompare([...compareIds, id]);
    }
  }

  const compareVenues = compareIds.flatMap((id) => {
    const match = venues.find((v) => v.id === id);
    return match ? [{ id: match.id, name: match.name }] : [];
  });

  /* ============================================ FILTER FACETS
     Everything the panel offers is derived from the live venue data,
     so options and counts always reflect what is actually listed. */

  const destinationOptions = useMemo(
    () => countBy(venues, (v) => [v.state || v.destination]),
    [venues]
  );

  const typeOptions = useMemo(
    () => countBy(venues, (v) => [v.type]),
    [venues]
  );

  const spaceOptions = useMemo(
    () => countBy(venues, (v) => v.spaceTypes || []),
    [venues]
  );

  const amenityOptions = useMemo(
    () =>
      countBy(venues, (v) => v.amenities || []).filter(([key]) =>
        AMENITY_LABELS.has(key)
      ),
    [venues]
  );

  /* Slider top: the largest known capacity, rounded up to 500. */
  const capTop = useMemo(() => {
    const known = venues
      .map((v) => toCapacity(v.capacity))
      .filter((n): n is number => n !== null);

    const largest = known.length ? Math.max(...known) : 0;
    return Math.max(500, Math.ceil(largest / 500) * 500);
  }, [venues]);

  /* ===================================================== STATE */

  /*
   * `draft` is what the panel shows; `applied` is what the results
   * use. "Apply Filters" copies draft to applied; removing a chip or
   * "Clear all" updates both.
   */
  const [draft, setDraft] = useState<Filters>(() => emptyFilters(capTop));
  const [applied, setApplied] = useState<Filters>(() => emptyFilters(capTop));
  const [sort, setSort] = useState<SortKey>('relevance');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openSection, setOpenSection] = useState<Record<SectionId, boolean>>({
    destination: true,
    type: false,
    capacity: false,
    space: false,
    amenities: false,
    availability: false,
  });
  const [destinationQuery, setDestinationQuery] = useState('');
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  const isMobile = useMediaQuery('(max-width: 1023px)');

  const panelRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const filtersBtnRef = useRef<HTMLButtonElement | null>(null);
  const scrollTarget = useRef<SectionId | null>(null);

  /* ================================= READ FILTERS FROM THE URL
     /explore?destination=Rajasthan,Goa&guests=200
     Older links pass a city (for example ?destination=Hyderabad); a
     city is mapped to the state it belongs to so those keep working. */

  useEffect(() => {
    if (venues.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const destinationParam = params.get('destination');
    const guestsParam = params.get('guests');

    if (!destinationParam && !guestsParam) return;

    const known = destinationOptions.map(([name]) => name);
    const destinations: string[] = [];

    for (const raw of (destinationParam || '').split(',')) {
      const wanted = raw.trim().toLowerCase();
      if (!wanted) continue;

      const direct = known.find((name) => name.toLowerCase() === wanted);

      if (direct) {
        destinations.push(direct);
        continue;
      }

      const cityMatch = venues.find(
        (v) =>
          v.destination.toLowerCase() === wanted ||
          v.city.toLowerCase() === wanted
      );
      const stateFromCity = cityMatch?.state || cityMatch?.destination;

      if (stateFromCity) destinations.push(stateFromCity);
    }

    const firstNumber = guestsParam?.match(/\d+/);
    const capMin = firstNumber
      ? Math.min(Number(firstNumber[0]), capTop)
      : 0;

    const next: Filters = {
      ...emptyFilters(capTop),
      destinations: Array.from(new Set(destinations)),
      capMin,
    };

    setDraft(next);
    setApplied(next);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [venues]);

  function syncUrl(filters: Filters) {
    const url = new URL(window.location.href);

    if (filters.destinations.length > 0) {
      url.searchParams.set('destination', filters.destinations.join(','));
    } else {
      url.searchParams.delete('destination');
    }

    if (filters.capMin > 0) {
      url.searchParams.set('guests', String(filters.capMin));
    } else {
      url.searchParams.delete('guests');
    }

    window.history.replaceState({}, '', url.toString());
  }

  /* ============================================ FILTER VENUES */

  const filteredVenues = useMemo(() => {
    const f = applied;

    const result = venues.filter((venue) => {
      if (
        f.destinations.length > 0 &&
        !f.destinations.includes(venue.state || venue.destination)
      ) {
        return false;
      }

      if (f.types.length > 0 && !f.types.includes(venue.type)) {
        return false;
      }

      if (
        f.spaceTypes.length > 0 &&
        !f.spaceTypes.every((type) => (venue.spaceTypes || []).includes(type))
      ) {
        return false;
      }

      if (
        f.amenities.length > 0 &&
        !f.amenities.every((key) => (venue.amenities || []).includes(key))
      ) {
        return false;
      }

      /*
       * A venue whose guest capacity has not been confirmed ("Capacity
       * on request") stays visible: hiding it would drop every
       * unverified venue from any guest-count search. Only venues with
       * a known capacity outside the chosen range are filtered out.
       */
      const known = toCapacity(venue.capacity);

      if (known !== null) {
        if (known < f.capMin) return false;
        if (f.capMax < capTop && known > f.capMax) return false;
      }

      return true;
    });

    const indexed = result.map((venue, index) => ({ venue, index }));
    const cap = (venue: VenueSummary) => toCapacity(venue.capacity);

    indexed.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.venue.name.localeCompare(b.venue.name);
        case 'capacityDesc':
          return (cap(b.venue) ?? -1) - (cap(a.venue) ?? -1) || a.index - b.index;
        case 'capacityAsc':
          return (
            (cap(a.venue) ?? Number.MAX_SAFE_INTEGER) -
              (cap(b.venue) ?? Number.MAX_SAFE_INTEGER) || a.index - b.index
          );
        case 'updated':
          return (
            (b.venue.updatedAt || '').localeCompare(a.venue.updatedAt || '') ||
            a.index - b.index
          );
        default:
          return a.index - b.index;
      }
    });

    return indexed.map((entry) => entry.venue);
  }, [venues, applied, sort, capTop]);

  /* ============================================== ACTIONS */

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    filtersBtnRef.current?.focus();
  }, []);

  function applyFilters() {
    setApplied(draft);
    syncUrl(draft);
    if (drawerOpen) closeDrawer();
  }

  function clearAll() {
    const cleared = emptyFilters(capTop);
    setDraft(cleared);
    setApplied(cleared);
    setDestinationQuery('');
    window.history.replaceState({}, '', '/explore');
  }

  /* Remove one applied filter (chip) and keep the panel in step. */
  function updateBoth(update: (filters: Filters) => Filters) {
    const nextApplied = update(applied);
    setApplied(nextApplied);
    setDraft((current) => update(current));
    syncUrl(nextApplied);
  }

  function toggleSection(id: SectionId) {
    setOpenSection((current) => ({ ...current, [id]: !current[id] }));
  }

  /* Rail icons: open the panel, expand the section and scroll to it. */
  function focusSection(id: SectionId) {
    setPanelCollapsed(false);
    setOpenSection((current) => ({ ...current, [id]: true }));
    scrollTarget.current = id;

    if (isMobile) setDrawerOpen(true);
  }

  useEffect(() => {
    const id = scrollTarget.current;
    if (!id) return;
    scrollTarget.current = null;

    const timer = window.setTimeout(() => {
      panelRef.current
        ?.querySelector(`[data-section="${id}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);

    return () => window.clearTimeout(timer);
  }, [openSection, panelCollapsed, drawerOpen]);

  /* Mobile drawer: lock page scroll, close on Escape, move focus in. */
  useEffect(() => {
    if (!drawerOpen || !isMobile) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    titleRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDrawer();
    };

    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen, isMobile, closeDrawer]);

  /* ========================================= APPLIED CHIPS */

  const capacityActive = applied.capMin > 0 || applied.capMax < capTop;

  const chips: { key: string; label: string; remove: () => void }[] = [
    ...applied.destinations.map((name) => ({
      key: `d:${name}`,
      label: name,
      remove: () =>
        updateBoth((f) => ({
          ...f,
          destinations: f.destinations.filter((x) => x !== name),
        })),
    })),
    ...applied.types.map((name) => ({
      key: `t:${name}`,
      label: name,
      remove: () =>
        updateBoth((f) => ({ ...f, types: f.types.filter((x) => x !== name) })),
    })),
    ...(capacityActive
      ? [
          {
            key: 'cap',
            label:
              applied.capMax >= capTop
                ? `${numberFormat.format(applied.capMin)}+ guests`
                : `${numberFormat.format(applied.capMin)}–${numberFormat.format(applied.capMax)} guests`,
            remove: () =>
              updateBoth((f) => ({ ...f, capMin: 0, capMax: capTop })),
          },
        ]
      : []),
    ...applied.spaceTypes.map((name) => ({
      key: `s:${name}`,
      label: name,
      remove: () =>
        updateBoth((f) => ({
          ...f,
          spaceTypes: f.spaceTypes.filter((x) => x !== name),
        })),
    })),
    ...applied.amenities.map((key) => ({
      key: `a:${key}`,
      label: AMENITY_LABELS.get(key) || key,
      remove: () =>
        updateBoth((f) => ({
          ...f,
          amenities: f.amenities.filter((x) => x !== key),
        })),
    })),
  ];

  const draftCapacityActive = draft.capMin > 0 || draft.capMax < capTop;
  const visibleDestinations = destinationOptions.filter(([name]) =>
    name.toLowerCase().includes(destinationQuery.trim().toLowerCase())
  );

  const railItems: {
    key: string;
    label: string;
    icon: ReactNode;
    section?: SectionId;
    href?: string;
  }[] = [
    { key: 'filters', label: 'Filters', icon: <FunnelIcon size={22} /> },
    { key: 'dest', label: 'Destinations', icon: <MapPinIcon size={22} />, section: 'destination' },
    { key: 'type', label: 'Venue types', icon: <LandmarkIcon size={22} />, section: 'type' },
    { key: 'cap', label: 'Guest capacity', icon: <UsersIcon size={22} />, section: 'capacity' },
    { key: 'collections', label: 'Collections', icon: <LayersIcon size={22} />, href: '/collections' },
    { key: 'fav', label: 'Favourites', icon: <StarIcon size={22} />, href: '/profile#shortlist' },
    { key: 'avail', label: 'Availability', icon: <CalendarIcon size={22} />, section: 'availability' },
  ];

  /* ================================================== UI */

  return (
    <main
      id="main-content"
      className={styles.root}
      data-explore
      data-tray={compareVenues.length > 0}
    >
      <div className={styles.band} aria-hidden="true" />

      <div className={styles.shell}>
        {/* ------------------------------------------ ICON RAIL */}
        <nav className={styles.rail} aria-label="Explore sections">
          {railItems.map((item) => {
            const isFilters = item.key === 'filters';
            const className = `${styles.railBtn} ${
              isFilters && !panelCollapsed ? styles.railBtnOn : ''
            }`;

            if (item.href) {
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={className}
                  data-tip={item.label}
                  aria-label={item.label}
                >
                  {item.icon}
                </Link>
              );
            }

            return (
              <button
                key={item.key}
                type="button"
                className={className}
                data-tip={item.label}
                aria-label={item.label}
                aria-pressed={isFilters ? !panelCollapsed : undefined}
                onClick={() =>
                  isFilters
                    ? setPanelCollapsed((current) => !current)
                    : focusSection(item.section as SectionId)
                }
              >
                {item.icon}
              </button>
            );
          })}
        </nav>

        {/* ----------------------------------------- FILTER PANEL */}
        <div
          className={styles.backdrop}
          data-open={drawerOpen}
          onClick={closeDrawer}
          aria-hidden="true"
        />

        <section
          ref={panelRef}
          id="explore-filters"
          className={styles.panel}
          data-drawer={drawerOpen ? 'open' : 'closed'}
          data-collapsed={panelCollapsed}
          aria-label="Venue filters"
          role={isMobile ? 'dialog' : undefined}
          aria-modal={isMobile ? true : undefined}
        >
          <div className={styles.panelHead}>
            <h2
              className={styles.panelTitle}
              ref={titleRef}
              tabIndex={-1}
              style={{ outline: 'none' }}
            >
              Filters
            </h2>
            <button type="button" className={styles.clearBtn} onClick={clearAll}>
              Clear all
            </button>
            <button
              type="button"
              className={styles.closeBtn}
              aria-label="Close filters"
              onClick={() => (isMobile ? closeDrawer() : setPanelCollapsed(true))}
            >
              <CloseIcon size={22} />
            </button>
          </div>

          <div className={styles.panelScroll}>
            {/* DESTINATION */}
            <Section
              id="destination"
              title="Destination"
              icon={<MapPinIcon size={22} />}
              open={openSection.destination}
              onToggle={() => toggleSection('destination')}
              badge={draft.destinations.length || undefined}
            >
              <label className={styles.searchBox}>
                <SearchIcon size={18} />
                <input
                  type="search"
                  placeholder="Search destination…"
                  value={destinationQuery}
                  onChange={(event) => setDestinationQuery(event.target.value)}
                  aria-label="Search destinations"
                />
              </label>

              {visibleDestinations.length > 0 ? (
                <ul className={styles.options} aria-label="Destinations">
                  {visibleDestinations.map(([name, count]) => (
                    <li key={name}>
                      <label className={styles.option}>
                        <input
                          type="checkbox"
                          className={styles.check}
                          checked={draft.destinations.includes(name)}
                          onChange={() =>
                            setDraft((f) => ({
                              ...f,
                              destinations: toggleIn(f.destinations, name),
                            }))
                          }
                        />
                        <span className={styles.optionText}>{name}</span>
                        <span className={styles.optionCount}>({count})</span>
                      </label>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.note}>
                  No destinations match “{destinationQuery}”.
                </p>
              )}
            </Section>

            {/* VENUE TYPE */}
            <Section
              id="type"
              title="Venue Type"
              icon={<LandmarkIcon size={22} />}
              open={openSection.type}
              onToggle={() => toggleSection('type')}
              badge={draft.types.length || undefined}
            >
              <OptionList
                name="Venue types"
                options={typeOptions}
                selected={draft.types}
                onToggle={(value) =>
                  setDraft((f) => ({ ...f, types: toggleIn(f.types, value) }))
                }
                showAll={showAllTypes}
                onShowAll={() => setShowAllTypes((current) => !current)}
              />
            </Section>

            {/* GUEST CAPACITY */}
            <Section
              id="capacity"
              title="Guest Capacity"
              icon={<UsersIcon size={22} />}
              open={openSection.capacity}
              onToggle={() => toggleSection('capacity')}
              badge={draftCapacityActive ? 1 : undefined}
            >
              <CapacitySlider
                top={capTop}
                low={draft.capMin}
                high={draft.capMax}
                onChange={(low, high) =>
                  setDraft((f) => ({ ...f, capMin: low, capMax: high }))
                }
              />
              <p className={styles.hint}>
                Venues that have not confirmed a capacity stay in the results.
              </p>
            </Section>

            {/* EVENT SPACE TYPE */}
            <Section
              id="space"
              title="Event Space Type"
              icon={<LayersIcon size={22} />}
              open={openSection.space}
              onToggle={() => toggleSection('space')}
              badge={draft.spaceTypes.length || undefined}
            >
              {spaceOptions.length > 0 ? (
                <>
                  <OptionList
                    name="Event space types"
                    options={spaceOptions}
                    selected={draft.spaceTypes}
                    onToggle={(value) =>
                      setDraft((f) => ({
                        ...f,
                        spaceTypes: toggleIn(f.spaceTypes, value),
                      }))
                    }
                    showAll
                    collapsible={false}
                    onShowAll={() => undefined}
                  />
                  <p className={styles.hint}>
                    Shows venues with all selected spaces.
                  </p>
                </>
              ) : (
                <p className={styles.note}>
                  No event space details are listed yet.
                </p>
              )}
            </Section>

            {/* AMENITIES */}
            <Section
              id="amenities"
              title="Amenities"
              icon={<StarIcon size={22} />}
              open={openSection.amenities}
              onToggle={() => toggleSection('amenities')}
              badge={draft.amenities.length || undefined}
            >
              {amenityOptions.length > 0 ? (
                <>
                  <OptionList
                    name="Amenities"
                    options={amenityOptions}
                    selected={draft.amenities}
                    labelFor={(key) => AMENITY_LABELS.get(key) || key}
                    onToggle={(value) =>
                      setDraft((f) => ({
                        ...f,
                        amenities: toggleIn(f.amenities, value),
                      }))
                    }
                    showAll={showAllAmenities}
                    onShowAll={() => setShowAllAmenities((current) => !current)}
                  />
                  <p className={styles.hint}>
                    Verified amenities only. Shows venues with all selected.
                  </p>
                </>
              ) : (
                <p className={styles.note}>
                  No verified amenities are listed yet.
                </p>
              )}
            </Section>

            {/* AVAILABILITY */}
            <Section
              id="availability"
              title="Availability"
              icon={<CalendarIcon size={22} />}
              open={openSection.availability}
              onToggle={() => toggleSection('availability')}
              disabled
            >
              <p className={styles.note}>
                Live date availability is not published for venues yet, so it
                cannot be filtered. Dates are confirmed with the venue when you
                send an enquiry or place an Instant Hold.
              </p>
            </Section>
          </div>

          <div className={styles.panelFoot}>
            <button
              type="button"
              className={styles.applyBtn}
              onClick={applyFilters}
            >
              Apply Filters
              <ArrowRightIcon size={22} />
            </button>
          </div>
        </section>

        {/* ------------------------------------------- RESULTS */}
        <div
          className={styles.main}
          style={
            compareVenues.length > 0
              ? { paddingBottom: 'calc(100px + 5.5rem)' }
              : undefined
          }
        >
          <span className={styles.eyebrow}>Find your perfect venue</span>
          <h1 className={styles.title}>Explore Wedding Venues</h1>
          <p className={styles.subtitle}>
            Discover and filter verified venues across India.
          </p>

          <div className={styles.toolbar}>
            <span className={styles.count} role="status" aria-live="polite">
              {filteredVenues.length}{' '}
              {filteredVenues.length === 1 ? 'venue' : 'venues'} found
            </span>

            <button
              ref={filtersBtnRef}
              type="button"
              className={styles.filtersBtn}
              aria-haspopup="dialog"
              aria-expanded={drawerOpen}
              aria-controls="explore-filters"
              onClick={() => setDrawerOpen(true)}
            >
              <SlidersIcon size={20} />
              Filters
              {chips.length > 0 && (
                <span className={styles.filtersBadge}>{chips.length}</span>
              )}
            </button>

            <label className={styles.sortWrap}>
              <span className={styles.sortLabel}>Sort by:</span>
              <select
                className={styles.select}
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                aria-label="Sort venues"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.toggleGroup} role="group" aria-label="Layout">
              <button
                type="button"
                className={`${styles.toggleBtn} ${view === 'grid' ? styles.toggleBtnOn : ''}`}
                aria-label="Grid view"
                aria-pressed={view === 'grid'}
                onClick={() => setView('grid')}
              >
                <GridIcon size={20} />
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${view === 'list' ? styles.toggleBtnOn : ''}`}
                aria-label="List view"
                aria-pressed={view === 'list'}
                onClick={() => setView('list')}
              >
                <ListIcon size={20} />
              </button>
            </div>
          </div>

          {chips.length > 0 && (
            <div className={styles.chips} aria-label="Active filters">
              {chips.map((chip) => (
                <span key={chip.key} className={styles.chip}>
                  {chip.label}
                  <button
                    type="button"
                    aria-label={`Remove filter ${chip.label}`}
                    onClick={chip.remove}
                  >
                    <CloseIcon size={14} />
                  </button>
                </span>
              ))}
              <button
                type="button"
                className={styles.chipClear}
                onClick={clearAll}
              >
                Clear all
              </button>
            </div>
          )}

          {!venuesError && filteredVenues.length > 1 && (
            <p className={`${compareStyles.hint} ${styles.compareHint}`}>
              Tick <b>Compare</b> on up to {MAX_COMPARE_VENUES} venues to see
              their capacity, rooms, event spaces, amenities and services side
              by side.
            </p>
          )}

          {venuesError ? (
            <div className={styles.empty}>
              <h3>Something went wrong</h3>
              <p>{venuesError}</p>
            </div>
          ) : filteredVenues.length > 0 ? (
            <div
              className={`${styles.grid} ${view === 'list' ? styles.gridList : ''}`}
            >
              {filteredVenues.map((venue, index) => (
                <VenueCard
                  headingLevel={2}
                  key={venue.id}
                  v={{
                    ...venue,
                    /* VenueCard expects these database-style properties. */
                    slug: venue.id,
                    description: venue.desc,
                  }}
                  explore={{
                    location: [venue.city, venue.state]
                      .filter(
                        (part, i, all) =>
                          part && all.findIndex((x) => x === part) === i
                      )
                      .join(', '),
                    roomCategories: venue.roomCategoryCount || 0,
                    layout: view,
                    delay: index * 50,
                    /* First row: eager photos and the entrance animation. */
                    priority: index < 3,
                  }}
                  compare={{
                    selected: compareIds.includes(venue.id),
                    disabled: compareIds.length >= MAX_COMPARE_VENUES,
                    onToggle: () => toggleCompare(venue.id),
                  }}
                />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <h3>No venues found</h3>
              <p>Try removing a filter or widening the guest range.</p>
              <button
                type="button"
                className={styles.emptyBtn}
                onClick={clearAll}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      <CompareTray
        venues={compareVenues}
        onRemove={toggleCompare}
        onClear={() => updateCompare([])}
      />
    </main>
  );
}
