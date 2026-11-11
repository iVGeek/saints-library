import fs from 'node:fs';
import path from 'node:path';

/**
 * Build an index of the public-domain Catholic Encyclopedia (1913) articles
 * hosted by New Advent. The index is used by scripts/curate-catholic-encyclopedia.mjs
 * to match saint profiles to full-text biographies.
 *
 * Usage: node scripts/build-cathen-index.mjs
 */

const UA =
  'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';
const BASE = 'https://www.newadvent.org/cathen';
const OUT = path.join(process.cwd(), 'scripts', 'cathen-index.json');

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
const entries = new Map();

for (const letter of letters) {
  const shortHtml = await get(`${BASE}/${letter}.htm`);

  // Most letters have a "full index" page (e.g. a-ce.htm) with every article.
  const fullHref = [...shortHtml.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() }))
    .find((x) => /full index/i.test(x.text))?.href;
  const pages = [shortHtml];
  if (fullHref) {
    const fullUrl = new URL(fullHref.replace(/^\.\.\//, '/'), 'https://www.newadvent.org').href;
    pages.push(await get(fullUrl));
    await new Promise((r) => setTimeout(r, 100));
  }

  let added = 0;
  for (const html of pages) {
    const links = [...html.matchAll(/<a[^>]+href="([^"]*cathen\/([^"/]+\.htm))"[^>]*>([\s\S]*?)<\/a>/gi)];
    for (const m of links) {
      const href = m[2];
      const title = decodeEntities(m[3].replace(/<[^>]+>/g, '')).trim();
      if (!title || /^(a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z)$/i.test(title)) continue;
      if (/^full index/i.test(title)) continue;
      if (entries.has(href)) continue;
      entries.set(href, {
        title,
        url: `${BASE}/${href}`,
        letter,
      });
      added++;
    }
  }

  console.log(`${letter.toUpperCase()}: ${added} articles`);
  await new Promise((r) => setTimeout(r, 120));
}

const list = [...entries.values()].sort((a, b) => a.title.localeCompare(b.title));
fs.writeFileSync(OUT, JSON.stringify(list, null, 2) + '\n');
console.log(`\nWrote ${list.length} articles to ${OUT}`);
