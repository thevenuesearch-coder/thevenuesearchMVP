import type { Venue } from '../data';
import { formatCapacityRange, formatGuests, toCapacity } from '../capacity';
import { FEATURE_DEFS, type CompareFeature } from './features';
import { cleanString } from './build';
import type { CompareRoom } from './types';

/*
 * Model for the premium /compare experience.
 *
 * Everything here is derived from real venue data: the venue record,
 * its event spaces, its published room categories and its verified
 * amenities. Nothing is invented. A value that is not published for a
 * venue becomes a `missing` cell, which the UI shows openly as
 * "Not published" instead of leaving a silent gap.
 *
 * Comparison "insights" are computed here too, and are worded as
 * "highest listed ..." rather than "best": a venue is never declared
 * the winner, only the one with the largest published number.
 */

export type XCell =
  | { kind: 'text'; text: string }
  | { kind: 'stat'; text: string; sort: number }
  | { kind: 'chips'; items: string[] }
  | { kind: 'lines'; items: { name: string; meta?: string }[] }
  | { kind: 'check'; detail?: string }
  | { kind: 'actions' }
  | { kind: 'missing'; note?: string };

export type XRow = {
  key: string;
  label: string;
  /* Short helper shown under the label. */
  hint?: string;
  cells: XCell[];
  /* True when the venues' values are not all the same. */
  differs: boolean;
  /* Descriptive rows (description, highlights) are never "differences". */
  descriptive: boolean;
  /* Indexes of venues holding the highest number in a numeric row. */
  highest: number[];
};

export type XSectionId =
  | 'overview'
  | 'spaces'
  | 'accommodation'
  | 'pricing'
  | 'amenities'
  | 'location'
  | 'booking';

export type XSection = {
  id: XSectionId;
  title: string;
  blurb: string;
  rows: XRow[];
};

export type XVenue = {
  id: string; /* public slug */
  dbId: string;
  name: string;
  location: string;
  type: string;
  image: string | null;
  href: string;
  enquiryHref: string;
  bookHref: string;
};

export type XInsight = {
  key: string;
  title: string;
  statement: string;
  detail?: string;
  /* Venue ids the insight is about (highlighted in the UI). */
  venueIds: string[];
};

export type XModel = {
  venues: XVenue[];
  sections: XSection[];
  insights: XInsight[];
  /* Plain-language list of the differences found, for the summary. */
  differences: string[];
  /* Details no selected venue has published (shown for transparency). */
  notCompared: string[];
  rowCount: number;
  differingCount: number;
};

/* ------------------------------------------------------------------ */

const OUTDOOR_TAGS = new Set(['outdoor', 'lawn', 'garden', 'poolside', 'deck', 'terrace', 'beach', 'courtyard']);
const INDOOR_TAGS = new Set(['indoor', 'ballroom', 'banquet', 'banquet hall', 'convention', 'meeting room', 'conference']);

const LIST_CAP = 6;

function unique(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of values) {
    const v = cleanString(raw ?? '');
    if (v && !seen.has(v.toLowerCase())) {
      seen.add(v.toLowerCase());
      out.push(v);
    }
  }

  return out;
}

function cap<T>(items: T[], more: (n: number) => T): T[] {
  return items.length <= LIST_CAP
    ? items
    : [...items.slice(0, LIST_CAP), more(items.length - LIST_CAP)];
}

const MISSING: XCell = { kind: 'missing' };

function chips(items: string[]): XCell {
  if (items.length === 0) return MISSING;
  return {
    kind: 'chips',
    items: cap(items, (n) => `+${n} more`),
  };
}

function formatInr(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

function trimText(text: string, max = 230): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 120 ? lastSpace : max).trimEnd()}…`;
}

function spacesOfKind(venue: Venue, kind: 'indoor' | 'outdoor'): string[] {
  const wanted = kind === 'indoor' ? INDOOR_TAGS : OUTDOOR_TAGS;
  const other = kind === 'indoor' ? OUTDOOR_TAGS : INDOOR_TAGS;

  return unique(
    (venue.venueSpaces ?? [])
      .filter((space) => {
        const tags = (space.tags ?? []).map((t) => t.trim().toLowerCase());
        return tags.some((t) => wanted.has(t)) && !tags.some((t) => other.has(t));
      })
      .map((space) => space.name)
  );
}

/* A value the cell is compared by (so two equal cells count as the same). */
function signature(cell: XCell): string {
  switch (cell.kind) {
    case 'text':
    case 'stat':
      return `v:${cell.text.toLowerCase()}`;
    case 'chips':
      return `c:${[...cell.items].sort().join('|').toLowerCase()}`;
    case 'lines':
      return `l:${cell.items.map((i) => i.name).sort().join('|').toLowerCase()}`;
    case 'check':
      return `k:${(cell.detail ?? '').toLowerCase()}`;
    case 'actions':
      return 'a';
    default:
      return 'missing';
  }
}

type RowInput = {
  key: string;
  label: string;
  hint?: string;
  cells: XCell[];
  descriptive?: boolean;
  /* Keep the row even when every venue is missing it (pricing). */
  keepIfEmpty?: boolean;
};

function finishRow(input: RowInput): XRow | null {
  const present = input.cells.filter((c) => c.kind !== 'missing').length;
  if (present === 0 && !input.keepIfEmpty) return null;

  const signatures = new Set(input.cells.map(signature));
  const descriptive = Boolean(input.descriptive);

  /* Highest: only meaningful when 2+ venues have a number and they differ. */
  let highest: number[] = [];
  const stats = input.cells
    .map((c, i) => (c.kind === 'stat' ? { i, sort: c.sort } : null))
    .filter((x): x is { i: number; sort: number } => x !== null);

  if (stats.length >= 2) {
    const top = Math.max(...stats.map((s) => s.sort));
    const low = Math.min(...stats.map((s) => s.sort));
    if (top !== low) highest = stats.filter((s) => s.sort === top).map((s) => s.i);
  }

  return {
    key: input.key,
    label: input.label,
    hint: input.hint,
    cells: input.cells,
    differs: !descriptive && signatures.size > 1,
    descriptive,
    highest,
  };
}

function names(venues: XVenue[], ids: number[]): string {
  const list = ids.map((i) => venues[i].name);
  if (list.length <= 1) return list[0] ?? '';
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

/* ------------------------------------------------------------------ */

export function buildExperience(
  ordered: Venue[],
  roomsByVenue: Record<string, CompareRoom[]>,
  featuresByVenue: Record<string, CompareFeature[]>,
  { showPrice = false }: { showPrice?: boolean } = {}
): XModel {
  const venues: XVenue[] = ordered.map((v) => ({
    id: v.id,
    dbId: v.dbId,
    name: cleanString(v.name) ?? '',
    location: unique([v.city, v.state || v.destination]).join(', '),
    type: cleanString(v.type) ?? '',
    image: cleanString(v.image),
    href: `/venues/${v.id}`,
    enquiryHref: `/enquiry?venue=${v.id}`,
    bookHref: `/book?venue=${v.id}`,
  }));

  const featureOf = (v: Venue, key: string) =>
    featuresByVenue[v.dbId]?.find((f) => f.key === key);

  const roomNames = (v: Venue): string[] =>
    unique(
      (roomsByVenue[v.dbId] ?? [])
        .filter((room) => {
          try {
            const u = new URL((room.sourceUrl ?? '').trim());
            return u.protocol === 'https:' || u.protocol === 'http:';
          } catch {
            return false;
          }
        })
        .map((room) => room.name)
    );

  const spaceCount = (v: Venue) =>
    unique((v.venueSpaces ?? []).map((s) => s.name)).length;

  const capacityNumber = (v: Venue) => toCapacity(v.capacity);

  const sections: XSection[] = [];
  const dropped: string[] = [];

  const add = (
    id: XSectionId,
    title: string,
    blurb: string,
    inputs: RowInput[]
  ) => {
    const rows: XRow[] = [];
    for (const input of inputs) {
      const row = finishRow(input);
      if (row) rows.push(row);
      else if (id !== 'amenities') dropped.push(input.label);
    }
    if (rows.length > 0) sections.push({ id, title, blurb, rows });
  };

  /* -------------------------------------------------- overview */
  add('overview', 'Overview', 'The essentials at a glance.', [
    {
      key: 'type',
      label: 'Property type',
      cells: ordered.map((v) =>
        cleanString(v.type) ? { kind: 'text', text: cleanString(v.type)! } : MISSING
      ),
    },
    {
      key: 'destination',
      label: 'Destination',
      cells: ordered.map((v, i) =>
        venues[i].location ? { kind: 'text', text: venues[i].location } : MISSING
      ),
    },
    {
      key: 'description',
      label: 'About',
      descriptive: true,
      cells: ordered.map((v) => {
        const text = cleanString(v.desc ?? '');
        return text ? { kind: 'text', text: trimText(text) } : MISSING;
      }),
    },
    {
      key: 'highlights',
      label: 'Highlights',
      descriptive: true,
      cells: ordered.map((v) =>
        chips(unique(v.tags ?? []).slice(0, 5))
      ),
    },
  ]);

  /* ----------------------------------------------- wedding spaces */
  add('spaces', 'Wedding spaces', 'Event spaces and guest capacity.', [
    {
      key: 'capacity',
      label: 'Guest capacity',
      hint: 'Largest published figure',
      cells: ordered.map((v) => {
        const text = formatCapacityRange(v.capacityMin, v.capacity);
        const n = capacityNumber(v);
        return text && n ? { kind: 'stat', text, sort: n } : MISSING;
      }),
    },
    {
      key: 'spaceCount',
      label: 'Event spaces',
      hint: 'Number listed',
      cells: ordered.map((v) => {
        const n = spaceCount(v);
        return n > 0
          ? { kind: 'stat', text: `${n} ${n === 1 ? 'space' : 'spaces'}`, sort: n }
          : MISSING;
      }),
    },
    {
      key: 'largestSpace',
      label: 'Largest space',
      cells: ordered.map((v) => {
        const best = (v.venueSpaces ?? [])
          .map((s) => ({ name: cleanString(s.name), n: toCapacity(s.capacity) }))
          .filter((s): s is { name: string; n: number } => Boolean(s.name) && s.n !== null)
          .sort((a, b) => b.n - a.n)[0];

        return best
          ? { kind: 'text', text: `${best.name} · up to ${formatGuests(best.n)}` }
          : MISSING;
      }),
    },
    {
      key: 'indoor',
      label: 'Indoor spaces',
      cells: ordered.map((v) => chips(spacesOfKind(v, 'indoor'))),
    },
    {
      key: 'outdoor',
      label: 'Outdoor spaces',
      cells: ordered.map((v) => chips(spacesOfKind(v, 'outdoor'))),
    },
    {
      key: 'allSpaces',
      label: 'All spaces',
      hint: 'With capacity where published',
      descriptive: true,
      cells: ordered.map((v) => {
        const items = (v.venueSpaces ?? [])
          .map((space) => {
            const name = cleanString(space.name);
            if (!name) return null;
            const guests = toCapacity(space.capacity) ? formatGuests(space.capacity) : null;
            return guests ? { name, meta: `up to ${guests}` } : { name };
          })
          .filter((x): x is { name: string; meta?: string } => x !== null);

        if (items.length === 0) return MISSING;
        return {
          kind: 'lines',
          items:
            items.length <= 8
              ? items
              : [...items.slice(0, 8), { name: `+${items.length - 8} more` }],
        };
      }),
    },
  ]);

  /* --------------------------------------------- accommodation */
  add('accommodation', 'Accommodation', 'Room categories published by each venue.', [
    {
      key: 'roomCount',
      label: 'Room categories',
      hint: 'Verified categories, not a room total',
      cells: ordered.map((v) => {
        const n = roomNames(v).length;
        return n > 0
          ? { kind: 'stat', text: `${n} ${n === 1 ? 'category' : 'categories'}`, sort: n }
          : MISSING;
      }),
    },
    {
      key: 'roomNames',
      label: 'Room types',
      descriptive: true,
      cells: ordered.map((v) => chips(roomNames(v))),
    },
  ]);

  /* --------------------------------------------------- pricing */
  add('pricing', 'Pricing', 'Published pricing, where a venue has agreed to share it.', [
    {
      key: 'startingPrice',
      label: 'Starting price',
      keepIfEmpty: true,
      cells: ordered.map((v) =>
        showPrice && v.price > 0
          ? { kind: 'stat', text: `From ${formatInr(v.price)}`, sort: v.price }
          : { kind: 'missing', note: 'On request' }
      ),
    },
    {
      key: 'quote',
      label: 'Quote',
      cells: ordered.map(() => ({ kind: 'check', detail: 'Request via enquiry' })),
    },
  ]);

  /* --------------------------------------------- amenities */
  const amenityRows: RowInput[] = FEATURE_DEFS.filter(
    (def) => def.key !== 'airport_transfer' && def.key !== 'travel_desk'
  ).map((def) => ({
    key: `feature:${def.key}`,
    label: def.label,
    cells: ordered.map((v): XCell => {
      const found = featureOf(v, def.key);
      if (!found) return MISSING;
      const detail = cleanString(found.detail ?? '');
      return { kind: 'check', detail: detail ?? undefined };
    }),
  }));

  add(
    'amenities',
    'Facilities & amenities',
    'Verified amenities, dining and services.',
    amenityRows
  );

  /* ---------------------------------------------- location */
  add('location', 'Location & access', 'Where each venue is and how guests arrive.', [
    {
      key: 'state',
      label: 'State',
      cells: ordered.map((v) =>
        cleanString(v.state) ? { kind: 'text', text: cleanString(v.state)! } : MISSING
      ),
    },
    {
      key: 'city',
      label: 'City or area',
      cells: ordered.map((v) =>
        cleanString(v.city) ? { kind: 'text', text: cleanString(v.city)! } : MISSING
      ),
    },
    ...['airport_transfer', 'travel_desk'].map((key) => {
      const def = FEATURE_DEFS.find((d) => d.key === key);
      return {
        key: `feature:${key}`,
        label: def?.label ?? key,
        cells: ordered.map((v): XCell => {
          const found = featureOf(v, key);
          if (!found) return MISSING;
          const detail = cleanString(found.detail ?? '');
          return { kind: 'check', detail: detail ?? undefined };
        }),
      } as RowInput;
    }),
  ]);

  /* ----------------------------------------- booking & enquiry */
  add('booking', 'Booking & enquiry', 'How to reach each venue through VenueSearch.', [
    {
      key: 'enquiry',
      label: 'Enquiry',
      cells: ordered.map(() => ({ kind: 'check', detail: 'Enquiry form' })),
    },
    {
      key: 'booking',
      label: 'Booking',
      cells: ordered.map(() => ({ kind: 'check', detail: 'Book online' })),
    },
    {
      key: 'actions',
      label: 'Next step',
      cells: ordered.map(() => ({ kind: 'actions' })),
    },
  ]);

  /* ------------------------------------------------ insights */
  const insights: XInsight[] = [];

  const knownCapacity = ordered
    .map((v, i) => ({ i, n: capacityNumber(v) }))
    .filter((x): x is { i: number; n: number } => x.n !== null);

  if (knownCapacity.length >= 2) {
    const top = Math.max(...knownCapacity.map((x) => x.n));
    const winners = knownCapacity.filter((x) => x.n === top).map((x) => x.i);
    const allSame = knownCapacity.every((x) => x.n === top);

    insights.push({
      key: 'capacity',
      title: 'Guest capacity',
      statement: allSame
        ? `All compared venues list the same capacity of up to ${formatGuests(top)}.`
        : winners.length === 1
          ? `${venues[winners[0]].name} lists the highest capacity, up to ${formatGuests(top)}.`
          : `${names(venues, winners)} share the highest listed capacity, up to ${formatGuests(top)}.`,
      detail:
        knownCapacity.length < ordered.length
          ? `Capacity is published for ${knownCapacity.length} of ${ordered.length} venues.`
          : undefined,
      venueIds: allSame ? [] : winners.map((i) => venues[i].id),
    });
  } else {
    insights.push({
      key: 'capacity',
      title: 'Guest capacity',
      statement:
        knownCapacity.length === 1
          ? `Capacity is only published for ${venues[knownCapacity[0].i].name}.`
          : 'Guest capacity is not published for these venues.',
      detail: 'Ask each venue for capacity by event layout.',
      venueIds: [],
    });
  }

  const roomCounts = ordered
    .map((v, i) => ({ i, n: roomNames(v).length }))
    .filter((x) => x.n > 0);

  if (roomCounts.length >= 2) {
    const top = Math.max(...roomCounts.map((x) => x.n));
    const winners = roomCounts.filter((x) => x.n === top).map((x) => x.i);
    const allSame = roomCounts.every((x) => x.n === top);

    insights.push({
      key: 'accommodation',
      title: 'Accommodation',
      statement: allSame
        ? `Each of these venues lists ${top} room ${top === 1 ? 'category' : 'categories'}.`
        : winners.length === 1
          ? `${venues[winners[0]].name} lists the most room categories (${top}).`
          : `${names(venues, winners)} list the most room categories (${top} each).`,
      detail: 'Counts are verified room categories, not total rooms.',
      venueIds: allSame ? [] : winners.map((i) => venues[i].id),
    });
  } else {
    insights.push({
      key: 'accommodation',
      title: 'Accommodation',
      statement:
        roomCounts.length === 1
          ? `Room categories are only published for ${venues[roomCounts[0].i].name}.`
          : 'Room categories are not published for these venues.',
      detail: 'Ask each venue about accommodation and room blocks.',
      venueIds: [],
    });
  }

  const spaceCounts = ordered
    .map((v, i) => ({ i, n: spaceCount(v) }))
    .filter((x) => x.n > 0);

  if (spaceCounts.length >= 2) {
    const top = Math.max(...spaceCounts.map((x) => x.n));
    const winners = spaceCounts.filter((x) => x.n === top).map((x) => x.i);
    const allSame = spaceCounts.every((x) => x.n === top);

    insights.push({
      key: 'spaces',
      title: 'Wedding spaces',
      statement: allSame
        ? `Each venue lists ${top} event ${top === 1 ? 'space' : 'spaces'}.`
        : winners.length === 1
          ? `${venues[winners[0]].name} lists the most event spaces (${top}).`
          : `${names(venues, winners)} list the most event spaces (${top} each).`,
      venueIds: allSame ? [] : winners.map((i) => venues[i].id),
    });
  }

  const prices = ordered
    .map((v, i) => ({ i, p: showPrice && v.price > 0 ? v.price : null }))
    .filter((x): x is { i: number; p: number } => x.p !== null);

  if (prices.length >= 2) {
    const low = Math.min(...prices.map((x) => x.p));
    const winners = prices.filter((x) => x.p === low).map((x) => x.i);
    insights.push({
      key: 'pricing',
      title: 'Pricing',
      statement: `${names(venues, winners)} ${winners.length === 1 ? 'has' : 'have'} the lowest published starting price (${formatInr(low)}).`,
      venueIds: winners.map((i) => venues[i].id),
    });
  } else {
    insights.push({
      key: 'pricing',
      title: 'Pricing',
      statement: 'Pricing is not published for these venues.',
      detail: 'Send an enquiry to each venue to request a quote.',
      venueIds: [],
    });
  }

  /* ------------------------------------------- differences */
  const differences: string[] = [];
  const amenitySection = sections.find((s) => s.id === 'amenities');

  for (const row of amenitySection?.rows ?? []) {
    const have = row.cells
      .map((c, i) => (c.kind === 'check' ? i : -1))
      .filter((i) => i >= 0);

    if (have.length > 0 && have.length < venues.length) {
      differences.push(
        have.length === 1
          ? `Only ${venues[have[0]].name} lists ${row.label.toLowerCase()}.`
          : `${names(venues, have)} list ${row.label.toLowerCase()}.`
      );
    }
  }

  const rowCount = sections.reduce(
    (n, s) => n + s.rows.filter((r) => !r.descriptive).length,
    0
  );
  const differingCount = sections.reduce(
    (n, s) => n + s.rows.filter((r) => r.differs).length,
    0
  );

  /* Details nobody has published, shown openly. */
  const notCompared = [
    ...new Set([
      ...dropped.filter(
        (label) => !['Indoor spaces', 'Outdoor spaces', 'Room types'].includes(label)
      ),
      'Total number of rooms',
      'Seating layouts by space',
      'Date availability',
      'Distance to airport or station',
    ]),
  ];

  return {
    venues,
    sections,
    insights,
    differences: differences.slice(0, 4),
    notCompared,
    rowCount,
    differingCount,
  };
}
