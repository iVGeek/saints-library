import type { APIRoute } from 'astro';
import { SITE } from '../data/site';

export const GET: APIRoute = async () => {
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', SITE.url).href}\n`;
  return new Response(robots, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
