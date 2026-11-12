import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildCalendarMonth } from '../../utils/calendar-data';

/** One static endpoint per month, fetched on demand by the calendar page. */
export function getStaticPaths() {
  return Array.from({ length: 12 }, (_, index) => ({
    params: { month: String(index + 1) },
  }));
}

export const GET: APIRoute = async ({ params }) => {
  const month = Number(params.month);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return new Response('Not found', { status: 404 });
  }

  const saints = await getCollection('saints');
  const data = buildCalendarMonth(saints, month);

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
