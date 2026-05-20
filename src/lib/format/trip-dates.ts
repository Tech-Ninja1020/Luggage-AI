const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse `YYYY-MM-DD` as a calendar date in UTC; returns null if invalid. */
export function parseISODateString(value: string): Date | null {
  const m = isoDate.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== mo - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

export function formatTripDateRange(
  start: string | null,
  end: string | null
): string {
  if (!start && !end) return "Dates to be set";
  if (start && !end) return `${formatDisplayDate(start)} → …`;
  if (!start && end) return `… → ${formatDisplayDate(end)}`;
  return `${formatDisplayDate(start!)} – ${formatDisplayDate(end!)}`;
}

/** Local calendar date → `YYYY-MM-DD` for Postgres `date` columns. */
export function dateToISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Friendly label for date picker fields. */
export function formatPickerDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function isoStringToLocalDate(iso: string): Date | null {
  const parsed = parseISODateString(iso);
  if (!parsed) return null;
  return new Date(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth(),
    parsed.getUTCDate()
  );
}

function formatDisplayDate(iso: string): string {
  const d = parseISODateString(iso);
  if (!d) return iso;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}
