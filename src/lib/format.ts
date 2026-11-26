const numberFormat = new Intl.NumberFormat('en-US');
const longDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const monthYear = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const shortMonthYear = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** Accepts YYYY, YYYY-MM, YYYY-MM-DD or a full ISO timestamp and returns a UTC date. */
export function parseDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  if (/^\d{4}$/.test(value)) return new Date(`${value}-01-01T00:00:00Z`);
  if (/^\d{4}-\d{2}$/.test(value)) return new Date(`${value}-01T00:00:00Z`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00Z`);
  return new Date(value);
}

/** "26 November 2026" */
export function formatLongDate(value: string | Date): string {
  return longDate.format(parseDate(value));
}

/** "November 2026" */
export function formatMonthYear(value: string | Date): string {
  return monthYear.format(parseDate(value));
}

/** "Nov 2026" */
export function formatShortMonthYear(value: string | Date): string {
  return shortMonthYear.format(parseDate(value));
}

export function yearOf(value: string | Date): number {
  return parseDate(value).getUTCFullYear();
}

/** ISO date (YYYY-MM-DD) for `datetime` attributes and structured data. */
export function isoDate(value: string | Date): string {
  return parseDate(value).toISOString().slice(0, 10);
}
