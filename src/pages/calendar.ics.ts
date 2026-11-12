import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { slug } from '../utils/slugs';
import { SITE } from '../data/site';

export const GET: APIRoute = async () => {
  const saints = await getCollection('saints');
  const now = new Date();
  const year = now.getFullYear();

  function esc(s: string): string {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  function isLeapYear(value: number): boolean {
    return value % 4 === 0 && (value % 100 !== 0 || value % 400 === 0);
  }

  function nextLeapYear(from: number): number {
    let candidate = from;
    while (!isLeapYear(candidate)) candidate++;
    return candidate;
  }

  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//The Communion of Saints//Sanctoral Calendar//EN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push(`X-WR-CALNAME:${esc(SITE.name)} — Sanctoral Calendar`);
  lines.push(
    'X-WR-CALDESC:A yearly calendar of the saints, blesseds, and venerables in the Communion of Saints library.'
  );

  for (const saint of saints) {
    const { month, day } = saint.data.feastDay;
    // A 29 February feast needs a leap-year DTSTART; recurrence then falls on
    // leap years only, as the calendar itself does.
    const startYear = month === 2 && day === 29 && !isLeapYear(year) ? nextLeapYear(year) : year;
    const dt = `${startYear}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
    const name = saint.data.feastDayLabel
      ? `${saint.data.name} — ${saint.data.feastDayLabel}`
      : `${saint.data.name} — Feast Day`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${slug(saint.id)}@saints-library`);
    lines.push(`DTSTART;VALUE=DATE:${dt}`);
    lines.push('RRULE:FREQ=YEARLY');
    lines.push(`SUMMARY:${esc(name)}`);
    if (saint.data.summary) lines.push(`DESCRIPTION:${esc(saint.data.summary)}`);
    lines.push(`URL:${new URL(`/saints/${slug(saint.id)}`, SITE.url).href}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return new Response(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="communion-of-saints.ics"',
    },
  });
};
