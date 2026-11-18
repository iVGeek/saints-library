import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const saints = await getCollection('saints');
  const all = [...saints].sort((a, b) => a.data.name.localeCompare(b.data.name));

  const data = all.map((s) => ({
    n: s.data.name,
    s: s.id.replace(/\.md$/, ''),
    i: s.data.image ?? '',
    t: s.data.title ?? '',
    m: s.data.feastDay.month,
    d: s.data.feastDay.day,
    p: s.data.patronage,
    v: s.data.vocation,
    r: s.data.region ?? '',
    c: s.data.centuries,
    o: (s.data.religiousOrder ?? '').toLowerCase(),
    st: s.data.canonizationStatus,
    mr: s.data.martyr,
    sy: s.data.symbols[0] ?? '',
    stb: s.data.stub,
    hs: s.data.sources.length > 0 ? 1 : 0,
    sh: [s.data.name, ...s.data.searchAliases, ...s.data.patronage, ...s.data.causes, s.data.summary ?? ''].join(' ').toLowerCase(),
  }));

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
