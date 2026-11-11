import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';

/**
 * Conservative Wikipedia matcher for short saint profiles.
 *
 * The default is a dry run: it writes wikipedia-queue.json / wikipedia-queue.md.
 * Use --apply to write only high-confidence matches. Wikipedia text is
 * CC BY-SA 4.0, so every applied body carries an explicit attribution and
 * link. Only exact-title or strongly corroborated matches are eligible.
 *
 * Usage:
 *   node scripts/curate-wikipedia.mjs --limit 200
 *   node scripts/curate-wikipedia.mjs --apply --min-confidence 0.9
 */

const UA =
  'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';
const ROOT = process.cwd();
const CONTENT = path.join(ROOT, 'src', 'content', 'saints');
const STUBS = path.join(ROOT, 'stubs.json');

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
}
const has = (name) => args.includes(`--${name}`);

const LIMIT = Number(arg('limit', 0)) || 0;
const OFFSET = Number(arg('offset', 0)) || 0;
const APPLY = has('apply');
const MIN_CONF = Number(arg('min-confidence', 0.9));
const OUT = arg('out', 'wikipedia-queue.json');
const ONLY_FILE = arg('file', '');

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

function norm(s) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function stripHonorific(name) {
  return name
    .replace(
      /^(saint|st\.?|blessed|bl\.?|venerable|servant of god|pope|sister|father|mother|brother)\s+/i,
      ''
    )
    .trim();
}

function splitLocality(name) {
  const clean = stripHonorific(name);
  const m = clean.match(/^(.+?)\s+of\s+(.+)$/i);
  if (!m) return { base: clean, locality: '' };
  return { base: m[1].trim(), locality: m[2].trim() };
}

function feastEvidence(text, month, day) {
  if (!month || !day) return false;
  const m = MONTHS[month - 1];
  const re = new RegExp(`\\b${m}\\b[^.]{0,40}\\b${day}\\b|\\b${day}\\b[^.]{0,40}\\b${m}\\b`, 'i');
  return re.test(text);
}

function makeExcerpt(text, max = 1800) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  const cut = cleaned.slice(0, max);
  const lastSentence = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
  return (lastSentence > max * 0.6 ? cut.slice(0, lastSentence + 1) : cut).trim();
}

function parseProfile(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;
  return {
    frontmatter: m[1],
    prefix: m[0],
    data: yaml.load(m[1]) || {},
  };
}

function addSource(frontmatter, citation) {
  const quoted = `'${citation.replace(/'/g, "''")}'`;
  if (/^sources:\s*\[\s*\]\s*$/m.test(frontmatter)) {
    return frontmatter.replace(/^sources:\s*\[\s*\]\s*$/m, `sources:\n  - ${quoted}`);
  }
  if (/^sources:\s*\n/m.test(frontmatter)) {
    return frontmatter.replace(/^(sources:\s*\n(?:\s+-[^\n]*\n?)+)/m, `$1  - ${quoted}\n`);
  }
  return `${frontmatter}\nsources:\n  - ${quoted}`;
}

function applyMatch(file, profile, page, confidence) {
  let fm = profile.frontmatter;
  if (/^stub:\s*(true|false)\s*$/m.test(fm)) {
    fm = fm.replace(/^stub:\s*(true|false)\s*$/m, 'stub: false');
  } else {
    fm = fm.replace(/^(name:\s*.*)$/m, '$1\nstub: false');
  }
  const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`;
  fm = addSource(fm, `Wikipedia, "${page.title}", ${url} (CC BY-SA 4.0)`);
  const excerpt = makeExcerpt(page.extract || '');
  const body = `> ${excerpt}\n\n*Source: [Wikipedia, "${page.title}"](${url}), CC BY-SA 4.0.*`;
  fs.writeFileSync(path.join(CONTENT, file), `---\n${fm}\n---\n\n${body}\n`, 'utf8');
}

async function api(params) {
  const url = new URL('https://en.wikipedia.org/w/api.php');
  url.search = new URLSearchParams({ format: 'json', ...params }).toString();
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function pagesByTitle(titles) {
  if (!titles.length) return [];
  const data = await api({
    action: 'query',
    redirects: '1',
    prop: 'extracts|pageimages|pageprops|categories',
    exintro: '1',
    explaintext: '1',
    piprop: 'original',
    cllimit: 'max',
    titles: titles.join('|'),
  });
  return Object.values(data.query?.pages || {}).filter((p) => p.missing === undefined && p.extract);
}

function categoryLooksLikeSaint(page) {
  return (page.categories || []).some((c) =>
    /(saints?|beatified|blessed|venerable|martyrs?|servants? of god|canonized|roman catholic)/i.test(
      c.title
    )
  );
}

function tokenSubset(a, b) {
  const A = new Set(a.split(' ').filter((w) => w.length > 2));
  const B = new Set(b.split(' ').filter((w) => w.length > 2));
  if (A.size === 0 || B.size === 0) return false;
  let subset = true;
  for (const w of A) if (!B.has(w)) subset = false;
  if (subset) return true;
  subset = true;
  for (const w of B) if (!A.has(w)) subset = false;
  return subset;
}

function scorePage(page, profile) {
  const title = page.title || '';
  if (/^(list of|disambiguation)/i.test(title)) return null;
  if (page.pageprops?.disambiguation !== undefined) return null;
  const extract = page.extract || '';
  if (extract.length < 150) return null;
  if (!categoryLooksLikeSaint(page)) return null;

  const fullName = norm(stripHonorific(profile.data.name || ''));
  const { base, locality } = splitLocality(profile.data.name || '');
  const baseN = norm(base);
  const titleN = norm(title.replace(/\s*\([^)]*\)\s*$/, ''));
  const lower = extract.toLowerCase();

  let nameScore = 0;
  if (titleN === fullName) nameScore = 0.9;
  else if (titleN === baseN) nameScore = 0.78;
  else if (tokenSubset(titleN, fullName)) nameScore = 0.72;

  if (nameScore === 0) return null;

  const localityHit =
    (locality && lower.includes(locality.toLowerCase())) ||
    (locality && titleN.includes(norm(locality)));
  const feastHit = feastEvidence(extract, profile.data.feastDay?.month, profile.data.feastDay?.day);
  const nameMentioned =
    lower.includes(baseN.split(' ').slice(-1)[0]) ||
    lower.includes(fullName.split(' ').slice(-1)[0]);

  if (!nameMentioned) return null;
  if (locality && !localityHit && nameScore < 0.9) return null;

  let confidence = nameScore;
  if (localityHit) confidence += 0.06;
  if (feastHit) confidence += 0.05;
  confidence = Math.min(0.98, confidence);
  return { page, confidence, localityHit, feastHit };
}

async function findMatches(profile) {
  const name = profile.data.name || '';
  const clean = stripHonorific(name);
  const { base } = splitLocality(name);
  const variants = [...new Set([clean, base, name].filter(Boolean))];

  let pages = await pagesByTitle(variants);
  let results = pages.map((p) => scorePage(p, profile)).filter(Boolean);

  if (results.length === 0) {
    const search = await api({
      action: 'query',
      list: 'search',
      srsearch: `intitle:"${base}" saint`,
      srlimit: '6',
    });
    const titles = (search.query?.search || []).map((r) => r.title);
    pages = await pagesByTitle(titles);
    results = pages.map((p) => scorePage(p, profile)).filter(Boolean);
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

async function main() {
  let files;
  if (ONLY_FILE) files = [ONLY_FILE];
  else files = JSON.parse(fs.readFileSync(STUBS, 'utf8'));
  if (OFFSET) files = files.slice(OFFSET);
  if (LIMIT) files = files.slice(0, LIMIT);

  const queue = [];
  const stats = { scanned: 0, matched: 0, applied: 0, ambiguous: 0, review: 0 };

  for (const file of files) {
    const full = path.join(CONTENT, file);
    if (!fs.existsSync(full)) continue;
    const profile = parseProfile(fs.readFileSync(full, 'utf8'));
    if (!profile) continue;
    stats.scanned++;

    let results;
    try {
      results = await findMatches(profile);
    } catch {
      results = [];
    }

    if (results.length === 0) {
      stats.review++;
      queue.push({ file, name: profile.data.name, status: 'no-match' });
      continue;
    }

    const best = results[0];
    const close = results.filter(
      (r) => r !== best && Math.abs(r.confidence - best.confidence) < 0.05 && r.confidence >= 0.7
    );
    if (close.length > 0 && best.confidence < 0.95) {
      stats.ambiguous++;
      queue.push({
        file,
        name: profile.data.name,
        status: 'ambiguous',
        confidence: best.confidence,
        candidates: results.slice(0, 4).map((r) => ({
          title: r.page.title,
          confidence: r.confidence,
          localityHit: r.localityHit,
          feastHit: r.feastHit,
        })),
      });
      continue;
    }

    if (best.confidence >= MIN_CONF) {
      stats.matched++;
      if (APPLY) {
        applyMatch(file, profile, best.page, best.confidence);
        stats.applied++;
      }
    } else {
      stats.review++;
    }

    const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(best.page.title.replace(/ /g, '_'))}`;
    queue.push({
      file,
      name: profile.data.name,
      status: best.confidence >= MIN_CONF ? 'matched' : 'review',
      confidence: best.confidence,
      title: best.page.title,
      url,
      localityHit: best.localityHit,
      feastHit: best.feastHit,
      excerpt: makeExcerpt(best.page.extract || '', 500),
    });
  }

  fs.writeFileSync(path.join(ROOT, OUT), JSON.stringify(queue, null, 2) + '\n');
  const md = [
    '# Wikipedia curation queue',
    '',
    `Scanned: ${stats.scanned} · Matched: ${stats.matched} · Applied: ${stats.applied} · Ambiguous: ${stats.ambiguous} · Review: ${stats.review}`,
    '',
    ...queue
      .filter((q) => q.status === 'matched' || q.status === 'ambiguous')
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .map((q) => `## ${q.name} (${q.status}, ${(q.confidence || 0).toFixed(2)})\n\n- file: \`${q.file}\`\n- source: ${q.url || q.candidates?.[0]?.title || ''}\n`),
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, 'wikipedia-queue.md'), md);

  console.log(JSON.stringify(stats, null, 2));
  console.log(`Wrote ${OUT} and wikipedia-queue.md`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
