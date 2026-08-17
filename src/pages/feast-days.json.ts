import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { slug } from '../utils/slugs';

/**
 * Maps every day of the year to its saints, consumed client-side so the
 * homepage "Saint of the Day" and calendar remain accurate for every visitor
 * regardless of when the site was last built.
 */
export const GET: APIRoute = async () => {
  const saints = await getCollection('saints');

  const byDay = new Map<string, { slug: string; name: string }[]>();
  for (const s of saints) {
    const key = `${s.data.feastDay.month}/${s.data.feastDay.day}`;
    const list = byDay.get(key) ?? [];
    list.push({ slug: slug(s.id), name: s.data.name });
    byDay.set(key, list);
  }

  const days = Array.from(byDay.entries())
    .map(([key, saints]) => {
      const [month, day] = key.split('/').map(Number);
      return { month, day, saints };
    })
    .sort((a, b) => a.month - b.month || a.day - b.day);

  return new Response(JSON.stringify(days), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
