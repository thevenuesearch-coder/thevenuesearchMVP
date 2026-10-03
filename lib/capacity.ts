/*
 * Single source of truth for guest-capacity values.
 *
 * Capacity used to be handled ad hoc on every page: the data layer
 * turned "missing" into 0 and never read capacity_min, the cards
 * invented a minimum by passing the maximum twice, and each page
 * formatted the number its own way (raw, browser-locale
 * toLocaleString(), or en-IN) with its own idea of what to show when
 * the value was missing -- "Up to 0 guests", "1200 – 1,200 guests",
 * "— – 1,800 guests". Everything now goes through the two helpers
 * below.
 *
 *  - toCapacity(): decides whether a stored value is a usable
 *    capacity (a positive whole number) or "unknown" (null).
 *  - formatGuests() / formatCapacityRange(): the one way capacity is
 *    turned into text, with a fixed locale so the server-rendered
 *    HTML and the browser always agree (browser-locale formatting
 *    caused React hydration errors).
 */

/*
 * Text used where capacity is unknown. Wording matches what the
 * planner page already used.
 */
export const CAPACITY_UNKNOWN_LABEL = 'Capacity on request';

/*
 * Fixed locale on purpose: the site serves India, and formatting must
 * not depend on the server's or the visitor's locale.
 */
const numberFormat = new Intl.NumberFormat('en-IN');

/*
 * A usable capacity is a positive, finite number. null, undefined,
 * empty strings, 0, negatives and NaN are all "unknown" -- never
 * shown as a number. Numeric strings (Postgres `numeric` columns can
 * arrive as strings) are accepted.
 */
export function toCapacity(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed =
    typeof value === 'number'
      ? value
      : Number(String(value).replace(/,/g, '').trim());

  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return Math.floor(parsed);
}

/* "1,200 guests" / "1 guest" -- or null when the value is unknown. */
export function formatGuests(value: unknown): string | null {
  const count = toCapacity(value);

  if (count === null) return null;

  return `${numberFormat.format(count)} ${
    count === 1 ? 'guest' : 'guests'
  }`;
}

/* "Up to 1,200 guests" -- or null when the value is unknown. */
export function formatCapacityMax(value: unknown): string | null {
  const text = formatGuests(value);

  return text ? `Up to ${text}` : null;
}

/*
 * Venue-level capacity text.
 *
 *   min + max (min < max)  "100 – 1,800 guests"
 *   min == max             "196 guests"
 *   max only               "Up to 1,200 guests"   (the common case)
 *   min only               "From 12 guests"
 *   min > max (bad data)   "Up to 900 guests"     (inconsistent min is ignored)
 *   neither                null  -> caller shows CAPACITY_UNKNOWN_LABEL or hides it
 */
export function formatCapacityRange(
  minValue: unknown,
  maxValue: unknown
): string | null {
  const min = toCapacity(minValue);
  const max = toCapacity(maxValue);

  if (max !== null && min !== null && min < max) {
    return `${numberFormat.format(min)} – ${formatGuests(max)}`;
  }

  if (max !== null && min !== null && min === max) {
    return formatGuests(max);
  }

  if (max !== null) return formatCapacityMax(max);

  if (min !== null) return `From ${formatGuests(min)}`;

  return null;
}
