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
    .map((s) => ({
      slug: slug(s.id),
      name: s.data.name,
      aliases: s.data.searchAliases,
      summary: s.data.summary ?? '',
      feast: `${s.data.feastDay.month}/${s.data.feastDay.day}`,
      patronage: s.data.patronage.map((p: string) => p.replace(/-/g, ' ')),
      vocation: s.data.vocation,
      religiousOrder: s.data.religiousOrder ?? '',
      region: s.data.region ?? '',
      status: s.data.canonizationStatus,
      martyr: s.data.martyr,
      image: imageSrc(s.data.image, 500),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};


