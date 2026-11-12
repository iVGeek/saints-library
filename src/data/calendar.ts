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

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
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

function atMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const result = atMidnight(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** The first Sunday on or after the given date. */
function sundayOnOrAfter(date: Date): Date {
  const result = atMidnight(date);
  result.setDate(result.getDate() + ((7 - result.getDay()) % 7));
  return result;
}

/**
 * Liturgical season for a date in the Ordinary Form (Western rite).
 *
 * Boundaries follow the Church's actual calendar rather than fixed month
 * heuristics: Advent begins on the fourth Sunday before Christmas, Christmas
 * runs through the Baptism of the Lord, and the Easter cycle is derived from
 * the movable date of Easter.
 */
export function liturgicalSeason(date = new Date()): LiturgicalSeason {
  const day = atMidnight(date);
  const year = day.getFullYear();

  const easter = approximateEaster(year);
  const ashWednesday = addDays(easter, -46);
  const holyThursday = addDays(easter, -3);
  const pentecost = addDays(easter, 49);

  const christmas = new Date(year, 11, 25);
  const baptismOfTheLord = sundayOnOrAfter(new Date(year, 0, 7));
  const adventStart = sundayOnOrAfter(new Date(year, 10, 27));

  // Christmas spans the civil year boundary: 25 December through the
  // Baptism of the Lord (the Sunday after 6 January).
  if (day.getTime() >= christmas.getTime()) return 'Christmas';
  if (day.getTime() <= baptismOfTheLord.getTime()) return 'Christmas';

  if (day.getTime() >= adventStart.getTime()) return 'Advent';

  // The Easter Triduum runs from Holy Thursday to Holy Saturday; Easter
  // Sunday itself belongs to the Easter season.
  if (day.getTime() >= holyThursday.getTime() && day.getTime() < easter.getTime()) {
    return 'Triduum';
  }
  if (day.getTime() >= easter.getTime() && day.getTime() <= pentecost.getTime()) {
    return 'Easter';
  }
  if (day.getTime() >= ashWednesday.getTime() && day.getTime() < holyThursday.getTime()) {
    return 'Lent';
  }

  return 'Ordinary Time';
}

const SEASON_THEME: Record<
  LiturgicalSeason,
  { color: string; symbol: string; accent: string; soft: string; text: string }
> = {
  Advent: { color: 'violet', symbol: '✠', accent: '#6d4a8f', soft: '#f2edf8', text: '#4f3268' },
  Christmas: { color: 'gold', symbol: '✦', accent: '#c6a155', soft: '#fbf5e6', text: '#8a6523' },
  'Ordinary Time': { color: 'green', symbol: '❖', accent: '#3c6e4d', soft: '#edf4ee', text: '#23432d' },
  Lent: { color: 'violet', symbol: '✠', accent: '#6d4a8f', soft: '#f2edf8', text: '#4f3268' },
  Triduum: { color: 'red', symbol: '✟', accent: '#8a2434', soft: '#f8ecee', text: '#6d1a28' },
  Easter: { color: 'white', symbol: '✚', accent: '#a87f2e', soft: '#fdf8ec', text: '#8a6523' },
};

export function seasonTheme(season: LiturgicalSeason) {
  return SEASON_THEME[season];
}

/** Movable feasts for a given year (Western rite), derived from Easter. */
export function movableFeasts(year: number): { name: string; date: Date }[] {
  const easter = approximateEaster(year);
  const mk = (offset: number) => addDays(easter, offset);
  return [
    { name: 'Ash Wednesday', date: mk(-46) },
    { name: 'Palm Sunday', date: mk(-7) },
    { name: 'Holy Thursday', date: mk(-3) },
    { name: 'Good Friday', date: mk(-2) },
    { name: 'Holy Saturday', date: mk(-1) },
    { name: 'Easter Sunday', date: mk(0) },
    { name: 'Ascension', date: mk(39) },
    { name: 'Pentecost', date: mk(49) },
    { name: 'Trinity Sunday', date: mk(56) },
    { name: 'Corpus Christi', date: mk(60) },
  ];
}

/** Gauss-Anonymous algorithm, valid for Western (Gregorian) Easter. */
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
