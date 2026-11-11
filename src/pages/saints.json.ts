import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { imageSrc } from '../utils/images';
import { slug } from '../utils/slugs';

export const GET: APIRoute = async () => {
  const saints = await getCollection('saints');
  const data = saints.map((s) => ({
    slug: slug(s.id),
    name: s.data.name,
    honorific: s.data.honorific,
    title: s.data.title ?? null,
    summary: s.data.summary ?? null,
    searchAliases: s.data.searchAliases,
    birthYear: s.data.birthYear ?? null,
    deathYear: s.data.deathYear ?? null,
    region: s.data.region ?? null,
    centuries: s.data.centuries,
    feastDay: s.data.feastDay,
    liturgicalRank: s.data.liturgicalRank ?? null,
    canonizationStatus: s.data.canonizationStatus,
    vocation: s.data.vocation,
    religiousOrder: s.data.religiousOrder ?? null,
    patronage: s.data.patronage,
    causes: s.data.causes,
    symbols: s.data.symbols,
    martyr: s.data.martyr,
    image: imageSrc(s.data.image, 500),
    quotes: s.data.quotes,
    prayers: s.data.prayers,
    lifeEvents: s.data.lifeEvents,
    relatedSaints: s.data.relatedSaints,
    sources: s.data.sources,
    stub: s.data.stub,
  })).sort((a, b) => a.name.localeCompare(b.name));

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};