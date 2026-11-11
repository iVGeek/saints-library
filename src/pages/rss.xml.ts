import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { slug } from '../utils/slugs';
import { SITE } from '../data/site';

export const GET: APIRoute = async () => {
  const saints = (await getCollection('saints'))
    .sort((a, b) => a.data.name.localeCompare(b.data.name))
    .slice(0, 50);

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const items = saints.map((s) => `
    <item>
      <title>${esc(s.data.name)}</title>
      <link>${SITE.url}/saints/${slug(s.id)}</link>
      <guid>${SITE.url}/saints/${slug(s.id)}</guid>
      <description>${esc(s.data.summary ?? '')}</description>
    </item>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(SITE.name)}</title>
    <link>${SITE.url}</link>
    <description>${esc(SITE.description)}</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};