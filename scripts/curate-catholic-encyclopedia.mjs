import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';

/**
 * Match short saint profiles to articles in the public-domain Catholic
 * Encyclopedia (1913), hosted by New Advent, and optionally apply the result.
 *
 * The default is a dry run: it writes curation-queue.json / curation-queue.md
 * with proposed matches and confidence scores. Use --apply to write only
 * high-confidence matches.
 *
 * Source: The Catholic Encyclopedia (1907–1913), public domain.
 * Index: scripts/cathen-index.json (build with scripts/build-cathen-index.mjs).
 *
 * Usage:
 *   node scripts/curate-catholic-encyclopedia.mjs --limit 200
 *   node scripts/curate-catholic-encyclopedia.mjs --apply --min-confidence 0.9
 */

const UA =
  'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';
const ROOT = process.cwd();
const CONTENT = path.join(ROOT, 'src', 'content', 'saints');
const CACHE = path.join(ROOT, '.cache', 'cathen');
const INDEX = path.join(ROOT, 'scripts', 'cathen-index.json');
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
const OUT = arg('out', 'curation-queue.json');
const ONLY_FILES = (arg('file', '') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const SCAN_ALL = has('all');

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

/**
 * Drop a trailing descriptive epithet ("the Apostle", "the Hermit") so a
 * profile like "Saint Barnabas the Apostle" can match the encyclopedia's
 * "Barnabas, Saint". The feast-day and locality gates still decide whether
 * the resulting candidate is trustworthy.
 */
function stripDescriptor(name) {
  return name
    .replace(
      /[,\s]+the\s+(apostle|evangelist|martyr|virgin|confessor|abbess|abbot|bishop|archbishop|pope|deacon|archdeacon|priest|monk|nun|hermit|widow|founder|foundress|missionary|doctor|mystic|king|queen|emperor|empress|soldier|layman|laywoman|younger|elder|great|stigmatic)\s*$/i,
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

const ENTITIES = {
  nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>',
  ndash: '–', mdash: '—', hellip: '…', bull: '•', middot: '·',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»',
  dagger: '†', Dagger: '‡', sect: '§', para: '¶', deg: '°', prime: '′', Prime: '″',
  times: '×', divide: '÷', plusmn: '±', minus: '−', frac12: '½', frac14: '¼', frac34: '¾',
  sup1: '¹', sup2: '²', sup3: '³', micro: 'µ', cent: '¢', pound: '£', yen: '¥', euro: '€',
  copy: '©', reg: '®', trade: '™',
  auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß',
  agrave: 'à', aacute: 'á', acirc: 'â', atilde: 'ã', aring: 'å', aelig: 'æ', ccedil: 'ç',
  egrave: 'è', eacute: 'é', ecirc: 'ê', euml: 'ë',
  igrave: 'ì', iacute: 'í', icirc: 'î', iuml: 'ï', ntilde: 'ñ',
  ograve: 'ò', oacute: 'ó', ocirc: 'ô', otilde: 'õ', oslash: 'ø', oelig: 'œ',
  ugrave: 'ù', uacute: 'ú', ucirc: 'û', yacute: 'ý', yuml: 'ÿ', thorn: 'þ', eth: 'ð',
  Agrave: 'À', Aacute: 'Á', Acirc: 'Â', Atilde: 'Ã', Aring: 'Å', AElig: 'Æ', Ccedil: 'Ç',
  Egrave: 'È', Eacute: 'É', Ecirc: 'Ê', Euml: 'Ë',
  Igrave: 'Ì', Iacute: 'Í', Icirc: 'Î', Iuml: 'Ï', Ntilde: 'Ñ',
  Ograve: 'Ò', Oacute: 'Ó', Ocirc: 'Ô', Otilde: 'Õ', Oslash: 'Ø', OElig: 'Œ',
  Ugrave: 'Ù', Uacute: 'Ú', Ucirc: 'Û', Yacute: 'Ý', Thorn: 'Þ', ETH: 'Ð',
};

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&([a-z][a-z0-9]*);/gi, (m, name) => {
      if (Object.hasOwn(ENTITIES, name)) return ENTITIES[name];
      const lower = name.toLowerCase();
      if (lower !== name && Object.hasOwn(ENTITIES, lower)) return ENTITIES[lower];
      return ' ';
    });
}

function htmlToText(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function articleText(html) {
  const start = html.search(/<\/h1>/i);
  let body = start >= 0 ? html.slice(start + 5) : html;
  const end = body.search(/<div class="cenotes"|<div class="pub"|id="ogdenville"/i);
  if (end >= 0) body = body.slice(0, end);
  return htmlToText(body)
    .replace(
      /^Please help support the mission of New Advent[\s\S]*?\$19\.99\.\.\.\s*/i,
      ''
    )
    .trim();
}

async function fetchArticle(entry) {
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, path.basename(entry.url).replace(/\.htm$/, '.txt'));
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  const res = await fetch(entry.url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${entry.url}`);
  const text = articleText(await res.text());
  fs.writeFileSync(file, text, 'utf8');
  await new Promise((r) => setTimeout(r, 150));
  return text;
}

const index = JSON.parse(fs.readFileSync(INDEX, 'utf8'));
const byKey = new Map();
const byFirstName = new Map();

function addKey(key, entry) {
  if (!key) return;
  if (!byKey.has(key)) byKey.set(key, []);
  if (!byKey.get(key).includes(entry)) byKey.get(key).push(entry);
}

for (const entry of index) {
  const t = norm(entry.title);
  const bare = t.replace(/ (saints?|blessed|venerable)$/, '').trim();
  addKey(t, entry);
  addKey(bare, entry);
  if (t.includes(',')) {
    const parts = t.split(',').map((s) => s.trim());
    const reversed = parts.slice().reverse().join(' ').replace(/ (saints?|blessed|venerable)$/, '').trim();
    addKey(reversed, entry);
  }
  const first = bare.split(' ')[0];
  if (!byFirstName.has(first)) byFirstName.set(first, []);
  byFirstName.get(first).push(entry);
}

function nameCandidates(profile) {
  const full = norm(stripDescriptor(stripHonorific(profile.name)));
  const { base } = splitLocality(profile.name);
  const baseN = norm(stripDescriptor(base));
  const exact = byKey.get(full) ?? [];
  const baseHits = byKey.get(baseN) ?? [];
  const firstHits = byFirstName.get(baseN.split(' ')[0]) ?? [];
  const seen = new Set();
  return [...exact, ...baseHits, ...firstHits].filter((e) => {
    if (seen.has(e.url)) return false;
    seen.add(e.url);
    return true;
  }).slice(0, 12);
}

function titleCore(entry) {
  return norm(entry.title)
    .replace(/ (saints?|blessed|venerable)$/, '')
    .trim();
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

function feastEvidence(text, month, day) {
  if (!month || !day) return false;
  const m = MONTHS[month - 1];
  const re = new RegExp(`\\b${m}\\b[^.]{0,40}\\b${day}\\b|\\b${day}\\b[^.]{0,40}\\b${m}\\b`, 'i');
  return re.test(text);
}

/**
 * Some Catholic Encyclopedia articles cover a whole group of same-named
 * saints ("Rufinus, Saint" lists eleven of them). Those articles split each
 * person into a numbered or Roman-numeral section. Return the sections so the
 * matcher can quote only the paragraph that belongs to this profile.
 */
function splitSections(text) {
  const paren = [...text.matchAll(/\((\d{1,2})\)\s+/g)];
  if (paren.length >= 3) {
    return paren.map((m, i) => {
      const end = i + 1 < paren.length ? paren[i + 1].index : text.length;
      return text.slice(m.index, end).trim();
    });
  }

  const roman = [...text.matchAll(/(?:^|\n)\s*([IVX]{1,5})\.\s+/g)];
  if (roman.length >= 3) {
    return roman.map((m, i) => {
      const start = m.index + m[0].indexOf(m[1]);
      const next = roman[i + 1];
      const end = next ? next.index + next[0].indexOf(next[1]) : text.length;
      return text.slice(start, end).trim();
    });
  }

  return [];
}

function looksCollective(text, entry) {
  if (/,\s*Saints$/i.test(entry.title)) return true;
  const opening = text.slice(0, 1600);
  return /\b(name of (several|many|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)|(records|mentions|commemorates)\s+(eleven|ten|twelve|several|many|two|three|four|five|six|seven|eight|nine)\s+(saints|martyrs|others)|(several|many|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(?:\w+\s+){0,2}(saints|martyrs|bishops|persons)\s+of\s+(this|the same)\s+name|several persons|bore this name|bore the name of|saints?\s+named|others of (the|this) name|martyrs bearing the name|among the saints)\b/i.test(
    opening
  );
}

/** Articles about places, dioceses, and other topics rather than people. */
function looksTopical(text) {
  const opening = text.slice(0, 240).trim();
  return /^(an?|the)\s+(?:[A-Za-z]+\s+){0,3}(archdiocese|diocese|eparchy|bishopric|city|town|village|municipality|province|region|island|river|mountain|titular see|country)\b/i.test(
    opening
  );
}

/** Pick the one section that matches this profile's feast day, then locality. */
function pickSection(sections, locality, month, day) {
  if (sections.length < 3) return null;
  let hits = sections.filter((s) => feastEvidence(s, month, day));
  if (hits.length > 1 && locality) {
    const local = hits.filter((s) => s.toLowerCase().includes(locality.toLowerCase()));
    if (local.length === 1) hits = local;
  }
  return hits.length === 1 ? hits[0] : null;
}

function makeExcerpt(text, max = 1800) {
  let source = text.trim();
  // Drop a standalone one-word heading such as "Martyr" at the top of an
  // article; it reads as part of the first sentence once whitespace is
  // collapsed.
  const firstBreak = source.indexOf('\n');
  if (firstBreak > 0 && firstBreak < 40) {
    const firstLine = source.slice(0, firstBreak).trim();
    if (/^[A-Z][A-Za-z ]{0,30}$/.test(firstLine) && !/[.!?]/.test(firstLine)) {
      source = source.slice(firstBreak).trim();
    }
  }
  const cleaned = source
    .replace(/^\((\d{1,2})\)\s*/, '')
    .replace(/^[IVX]{1,5}\.\s*/, '')
    .replace(/^Besides the saints already given,?\s+mention should also be made of\s+/i, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s+\)/g, ')')
    .replace(/\(\s+/g, '(')
    .trim()
    .replace(/^([a-z])/, (c) => c.toUpperCase());
  const trimmed = cleaned
    .replace(/\s*(See (?:also )?bibliography|See also)\b[\s\S]*$/i, '')
    .trim();
  const punctuated = /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
  if (punctuated.length <= max) return punctuated;
  const cut = punctuated.slice(0, max);
  const lastSentence = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
  return (lastSentence > max * 0.6 ? cut.slice(0, lastSentence + 1) : cut).trim();
}

function parseProfile(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;
  const data = yaml.load(m[1]) || {};
  return {
    frontmatter: m[1],
    prefix: m[0],
    body: raw.slice(m[0].length).trim(),
    data,
  };
}

function addSource(frontmatter, citation) {
  if (frontmatter.includes(citation)) return frontmatter;
  const quoted = `'${citation.replace(/'/g, "''")}'`;
  if (/^sources:\s*\[\s*\]\s*$/m.test(frontmatter)) {
    return frontmatter.replace(/^sources:\s*\[\s*\]\s*$/m, `sources:\n  - ${quoted}`);
  }
  if (/^sources:\s*$/m.test(frontmatter)) {
    return frontmatter.replace(/^sources:\s*$/m, `sources:\n  - ${quoted}`);
  }
  if (/^sources:\s*\n(\s+-[^\n]*\n?)+/m.test(frontmatter)) {
    return frontmatter.replace(
      /^(sources:\s*\n(?:\s+-[^\n]*\n?)+)/m,
      `$1  - ${quoted}\n`
    );
  }
  return `${frontmatter}\nsources:\n  - ${quoted}`;
}

function applyMatch(file, profile, entry, confidence, excerpt) {
  let fm = profile.frontmatter;
  if (/^stub:\s*(true|false)\s*$/m.test(fm)) {
    fm = fm.replace(/^stub:\s*(true|false)\s*$/m, 'stub: false');
  } else {
    fm = fm.replace(/^(name:\s*.*)$/m, '$1\nstub: false');
  }
  const citation = `The Catholic Encyclopedia (1913), "${entry.title}", ${entry.url}`;
  fm = addSource(fm, citation);

  const body = `> ${excerpt}\n\n*Source: [The Catholic Encyclopedia (1913), "${entry.title}"](${entry.url}), public domain.*`;
  const raw = `---\n${fm}\n---\n\n${body}\n`;
  fs.writeFileSync(path.join(CONTENT, file), raw, 'utf8');
}

async function main() {
  let files;
  if (ONLY_FILES.length) files = ONLY_FILES;
  else {
    const list = JSON.parse(fs.readFileSync(STUBS, 'utf8'));
    files = SCAN_ALL ? fs.readdirSync(CONTENT).filter((f) => f.endsWith('.md')) : list;
  }
  if (OFFSET) files = files.slice(OFFSET);
  if (LIMIT) files = files.slice(0, LIMIT);

  const queue = [];
  const stats = { scanned: 0, matched: 0, applied: 0, ambiguous: 0, rejected: 0, noMatch: 0 };

  for (const file of files) {
    const full = path.join(CONTENT, file);
    if (!fs.existsSync(full)) continue;
    const raw = fs.readFileSync(full, 'utf8');
    const profile = parseProfile(raw);
    if (!profile) continue;
    stats.scanned++;

    const { month, day } = profile.data.feastDay || {};
    const region = profile.data.region || '';
    const locality = splitLocality(profile.data.name || '').locality;
    const candidates = nameCandidates(profile.data);

    let best = null;
    const evaluated = [];
    for (const entry of candidates) {
      let text;
      try {
        text = await fetchArticle(entry);
      } catch {
        continue;
      }
      if (text.length < 250) continue;

      const core = titleCore(entry);
      const fullName = norm(stripDescriptor(stripHonorific(profile.data.name || '')));
      const baseName = norm(stripDescriptor(splitLocality(profile.data.name || '').base));
      const fullTokens = new Set(fullName.split(' ').filter((w) => w.length > 2));
      const coreTokens = core.split(' ').filter((w) => w.length > 2);
      const overlap = coreTokens.filter((w) => fullTokens.has(w)).length;

      let nameScore = 0.3;
      if (core === fullName) nameScore = 0.95;
      else if (core === baseName) nameScore = 0.7;
      else if (overlap >= 2 && tokenSubset(core, fullName)) nameScore = 0.8;

      const sections = splitSections(text);
      const collective = looksCollective(text, entry);
      const section = pickSection(sections, locality, month, day);
      const subject = section || text;
      const topical = looksTopical(subject);

      const opening = text.slice(0, 900).toLowerCase();
      const subjectLower = subject.toLowerCase();
      const localityHit = locality
        ? section
          ? subjectLower.includes(locality.toLowerCase())
          : opening.includes(locality.toLowerCase())
        : false;
      const feastHit = feastEvidence(subject, month, day);
      const regionHit = region ? subjectLower.includes(region.toLowerCase()) : false;

      // A reliable match needs the article to attest the profile's feast day,
      // and (when the profile names a place) that place as well. A famous
      // namesake is not enough: the corpus contains many obscure martyrs who
      // share a name with a well-known saint.
      const nameOk = nameScore >= 0.7;
      const localityOk = !locality || localityHit;
      const collectiveOk = !collective || Boolean(section);
      let confidence;
      if (nameOk && feastHit && localityOk && collectiveOk) {
        confidence = 0.9;
        if (section) confidence += 0.04;
        if (nameScore >= 0.95) confidence += 0.03;
        if (regionHit) confidence += 0.01;
        confidence = Math.min(0.98, confidence);
      } else {
        confidence = 0.4;
        if (feastHit) confidence += 0.1;
        if (localityHit) confidence += 0.05;
        if (nameScore >= 0.95) confidence += 0.03;
        confidence = Math.min(0.6, confidence);
      }

      if (topical) confidence = Math.min(confidence, 0.2);

      evaluated.push({
        entry,
        confidence,
        nameScore,
        localityHit,
        feastHit,
        regionHit,
        collective,
        section,
        topical,
        text,
      });
      if (!best || confidence > best.confidence) best = evaluated[evaluated.length - 1];
    }

    if (!best) {
      stats.noMatch++;
      queue.push({ file, name: profile.data.name, status: 'no-match', candidates: [] });
      continue;
    }

    const close = evaluated.filter(
      (e) => e !== best && Math.abs(e.confidence - best.confidence) < 0.05 && e.confidence >= 0.6
    );
    const ambiguous = close.length > 0 && best.confidence < 0.95;

    if (ambiguous) {
      stats.ambiguous++;
      queue.push({
        file,
        name: profile.data.name,
        status: 'ambiguous',
        confidence: best.confidence,
        candidates: evaluated
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 4)
          .map((e) => ({
            title: e.entry.title,
            url: e.entry.url,
            confidence: e.confidence,
            localityHit: e.localityHit,
            feastHit: e.feastHit,
          })),
      });
      continue;
    }

    const matched = best.confidence >= MIN_CONF;
    if (matched) {
      stats.matched++;
      if (APPLY) {
        applyMatch(file, profile, best.entry, best.confidence, makeExcerpt(best.section || best.text));
        stats.applied++;
      }
    } else {
      stats.rejected++;
    }

    queue.push({
      file,
      name: profile.data.name,
      status: matched ? 'matched' : 'review',
      confidence: best.confidence,
      title: best.entry.title,
      url: best.entry.url,
      localityHit: best.localityHit,
      feastHit: best.feastHit,
      regionHit: best.regionHit,
      collective: best.collective,
      sectionMatch: Boolean(best.section),
      excerpt: makeExcerpt(best.section || best.text, 600),
    });
  }

  fs.writeFileSync(path.join(ROOT, OUT), JSON.stringify(queue, null, 2) + '\n');
  const md = [
    '# Catholic Encyclopedia curation queue',
    '',
    `Scanned: ${stats.scanned} · Matched: ${stats.matched} · Applied: ${stats.applied} · Ambiguous: ${stats.ambiguous} · Review: ${stats.rejected} · No match: ${stats.noMatch}`,
    '',
    ...queue
      .filter((q) => q.status === 'matched' || q.status === 'ambiguous')
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .map((q) => `## ${q.name} (${q.status}, ${(q.confidence || 0).toFixed(2)})\n\n- file: \`${q.file}\`\n- source: ${q.url || q.candidates?.[0]?.url || ''}\n`),
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, 'curation-queue.md'), md);

  console.log(JSON.stringify(stats, null, 2));
  console.log(`Wrote ${OUT} and curation-queue.md`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
