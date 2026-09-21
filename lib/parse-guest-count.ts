/**
 * Parses guest-count values coming from the booking/enquiry
 * forms, which are free-form-ish strings like "50–100",
 * "200", "600+" or "Other". Returns the first number found, or
 * null if none can be parsed (e.g. "Other").
 */
export function parseGuestCount(
  value: unknown
): number | null {
  const raw = typeof value === 'string' ? value.trim() : '';

  if (!raw) return null;

  if (raw === '600+') {
    return 600;
  }

  const match = raw.match(/\d+/);

  return match ? Number.parseInt(match[0], 10) : null;
}
