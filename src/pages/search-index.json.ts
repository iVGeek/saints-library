import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { imageSrc } from '../utils/images';
import { slug } from '../utils/slugs';

/**
 * Build-time JSON search index consumed by Fuse.js in the header autocomplete
 * and the directory page. For a growing catalogue this is replaced by a
 * Meilisearch/ Algolia index (see docs/CONTENT_MODEL.md) without changing the
 * UI contract.
 */
export const GET: APIRoute = async () => {
  const saints = await getCollection('saints');

  const index = saints
    .map((s) => {
      const body = (s as unknown as { body?: string }).body ?? '';
      return {
        slug: slug(s.id),
        name: s.data.name,
        honorific: s.data.honorific,
        title: s.data.title ?? '',
        aliases: s.data.searchAliases,
        summary: s.data.summary ?? '',
        feast: `${s.data.feastDay.month}/${s.data.feastDay.day}`,
        feastLabel: formatFeastLabel(s.data.feastDay),
        feastMonth: s.data.feastDay.month,
        feastDayNum: s.data.feastDay.day,
        patronage: s.data.patronage,
        causes: s.data.causes,
        vocation: s.data.vocation,
        religiousOrder: s.data.religiousOrder ?? '',
        region: s.data.region ?? '',
        centuries: s.data.centuries,
        status: s.data.canonizationStatus,
        martyr: s.data.martyr,
        symbols: s.data.symbols,
        image: imageSrc(s.data.image, 500),
        imageAlt: s.data.imageAlt ?? '',
        body: body.slice(0, 2000),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};

function formatFeastLabel(f: { month: number; day: number }): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[f.month - 1]} ${f.day}`;
}
