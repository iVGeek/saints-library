import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { slug } from '../utils/slugs';

export const GET: APIRoute = async () => {
  const saints = await getCollection('saints');
  const now = new Date();
  const year = now.getFullYear();

  function esc(s: string): string {
    return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  }

  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//The Communion of Saints//Sanctoral Calendar//EN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');

  for (const s of saints) {
    const { month, day } = s.data.feastDay;
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dt = `${year}${mm}${dd}`;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${slug(s.id)}@saints-library`);
    lines.push(`DTSTART;VALUE=DATE:${dt}`);
    lines.push('RRULE:FREQ=YEARLY');
    lines.push(`SUMMARY:${esc(s.data.name)} — Feast Day`);
    if (s.data.summary) lines.push(`DESCRIPTION:${esc(s.data.summary)}`);
    lines.push(`URL:https://saints-library.onrender.com/saints/${slug(s.id)}`);
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