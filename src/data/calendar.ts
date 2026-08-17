export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export interface FeastDay {
  month: number;
  day: number;
}

export function monthName(month: number): string {
  return MONTHS[month - 1] ?? '';
}

export function formatFeast(feast: FeastDay): string {
  return `${monthName(feast.month)} ${feast.day}`;
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

/** The date of the next occurrence of a fixed feast (today's feast counts). */
export function nextFeastDate(feast: FeastDay, now = new Date()): Date {
  const year = now.getFullYear();
  const candidate = new Date(year, feast.month - 1, feast.day);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (candidate.getTime() < startOfDay.getTime()) {
    return new Date(year + 1, feast.month - 1, feast.day);
  }
  return candidate;
}

export function daysUntil(date: Date, now = new Date()): number {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return Math.round((target - start) / 86_400_000);
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export type LiturgicalSeason =
  | 'Advent'
  | 'Christmas'
  | 'Ordinary Time'
  | 'Lent'
  | 'Triduum'
  | 'Easter';

/**
 * Approximate liturgical season for a date. The Church's year pivots on the
 * movable date of Easter; this is a fair approximation used for display.
 */
export function liturgicalSeason(date = new Date()): LiturgicalSeason {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const today = (m: number, d: number) => month === m && day >= d;
  const before = (m: number, d: number) => month < m || (month === m && day < d);

  // Approximate boundaries (Easter falls Mar 22–Apr 25).
  if (today(12, 3) || before(12, 25)) return 'Advent';
  if (today(12, 25) || (month === 1 && day <= 13)) return 'Christmas';

  const easter = approximateEaster(date.getFullYear());
  const seasonStart = new Date(date.getFullYear(), month - 1, day);

  const ashWednesday = new Date(easter);
  ashWednesday.setDate(easter.getDate() - 46);
  const triduum = new Date(easter);
  triduum.setDate(easter.getDate() - 3);
  const pentecost = new Date(easter);
  pentecost.setDate(easter.getDate() + 49);

  if (seasonStart >= triduum && seasonStart <= new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 1)) {
    return 'Triduum';
  }
  if (seasonStart >= ashWednesday && seasonStart < triduum) return 'Lent';
  if (seasonStart >= easter && seasonStart < pentecost) return 'Easter';
  return 'Ordinary Time';
}

const SEASON_THEME: Record<LiturgicalSeason, { color: string; symbol: string }> = {
  Advent: { color: 'violet', symbol: '✠' },
  Christmas: { color: 'white', symbol: '✦' },
  'Ordinary Time': { color: 'green', symbol: '❖' },
  Lent: { color: 'violet', symbol: '✠' },
  Triduum: { color: 'red', symbol: '✟' },
  Easter: { color: 'white', symbol: '✚' },
};

export function seasonTheme(season: LiturgicalSeason) {
  return SEASON_THEME[season];
}

/** Gauss–Anonymous algorithm, valid for Western (Gregorian) Easter. */
export function approximateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}
