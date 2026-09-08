import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';

const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';
const INDEX_CACHE = 'C:\\iVGeek\\communion-of-saints\\scripts\\santiebeati-dates.json';
const MATCH_LOG = 'C:\\iVGeek\\communion-of-saints\\scripts\\santiebeati-matches.json';
const PROGRESS = 'C:\\iVGeek\\communion-of-saints\\scripts\\santiebeati-progress.json';
const SAINTS_DIR = 'C:\\iVGeek\\communion-of-saints\\src\\content\\saints';

// ---------- Italian months ----------
const IT_MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  try { return yaml.load(match[1]); } catch { return null; }
}
function serializeFrontmatter(fm) {
  return yaml.dump(fm, { indent: 2, lineWidth: 120, noRefs: true, sortKeys: false });
}
function updateFile(file, fm) {
  const content = fs.readFileSync(path.join(SAINTS_DIR, file), 'utf8');
  const newFm = serializeFrontmatter(fm);
  const newContent = content.replace(/^---\r?\n[\s\S]*?\r?\n---/, `---\n${newFm}---`);
  fs.writeFileSync(path.join(SAINTS_DIR, file), newContent, 'utf8');
}

// ---------- Index caches ----------
function loadIndex() {
  try { return JSON.parse(fs.readFileSync(INDEX_CACHE, 'utf8')); }
  catch { return {}; }
}
function saveIndex(idx) { fs.writeFileSync(INDEX_CACHE, JSON.stringify(idx, null, 2)); }

// ---------- Crawl all date pages ----------
async function crawlDates() {
  const index = loadIndex();
  console.log(`Cached dates so far: ${Object.keys(index).length}/365`);
  const missing = [];
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= 31; d++) {
      if (m === 2 && d > 29) continue;
      if ([4, 6, 9, 11].includes(m) && d > 30) continue;
      const key = `${m}-${d}`;
      if (index[key]) continue;
      missing.push({ m, d, key });
    }
  }
  console.log(`To crawl: ${missing.length} date pages`);
  for (let i = 0; i < missing.length; i++) {
    const { m, d, key } = missing[i];
    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const url = `https://www.santiebeati.it/${mm}/${dd}`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      const txt = await res.text();
      if (res.ok) {
        // Extract (id, honorific, name) triples from listing entries
        const entries = [];
        const re = /<a href="\/dettaglio\/(\d+)"[^>]*title="[^"]*"[^>]*><FONT SIZE="-2">([^<]*?)<\/FONT> <FONT SIZE="-1"><b>([^<]*?)<\/b><\/FONT><\/a>/gi;
        let mm_;
        while ((mm_ = re.exec(txt)) !== null) {
          entries.push({ id: mm_[1], honorific: mm_[2].trim(), name: mm_[3].trim() });
        }
        // Dedup by id (keep first)
        const seen = new Set();
        index[key] = entries.filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true; });
      } else {
        console.log(`  !! ${url} -> ${res.status}`);
      }
    } catch (e) {
      console.log(`  !! ${url} -> ERR ${e.message}`);
    }
    if ((i + 1) % 25 === 0) {
      saveIndex(index);
      console.log(`  ...${i + 1}/${missing.length} crawled`);
    }
    await new Promise(r => setTimeout(r, 250));
  }
  saveIndex(index);
  console.log(`Date index complete: ${Object.keys(index).length} dates`);
}

// ---------- Name normalization & matching ----------
const HONORIFICS = ['san', 'santa', 'santi', 'santo', 'sant', 'beato', 'beata', 'beati',
    'servo di dio', 'serva di dio', 'servi di dio', 'servi', 'serva', 'servo',
    'venerabile', 'venerabili', 'card', 'card.', 'padre', 'madre', 'fratello', 'sorella',
    'mons', 'abate', 'badessa', 'vescovo', 'sacerdote', 'martire', 'martiri',
    're', 'profeta', 'patriarca', 'fondatore', 'fondatrice', 'religioso', 'religiosa',
    'dottore', 'apostolo', 'evangelista', 'papà', 'papa', 'cavaliere', 'pellegrino',
    'saint', 'blessed', 'venerable', 'saints', 'st', 'bl', 'servant of god',
    'servant', 'servants', 'servants of god'];

const IT_TO_EN_PLACE = {
  'prussia': 'prussia', 'roma': 'rome', 'africa': 'africa', 'belgio': 'belgium',
  'francia': 'france', 'spagna': 'spain', 'germania': 'germany', 'italia': 'italy',
  'inghilterra': 'england', 'scozia': 'scotland', 'irlanda': 'ireland',
};

function normPlace(s) {
  let out = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  out = out.replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  return out;
}

function normName(name, isIt) {
  let s = name;
  s = s.replace(/^[^-–—]*(?:\(|\[|:|;)[\s\S]*$/, m => ''); // drop parentheticals etc after
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  s = s.replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  // strip honorific words
  for (const h of HONORIFICS) {
    s = s.replace(new RegExp(`^${h.replace('.', '\\.')}\\s+`, 'i'), '');
  }
  // strip 'di/d'/de/del/o/e' conjunctions for token overlap purposes
  s = s.replace(/\b(di|d[’'']|de|del|della|delle|dei|o|ed|e)\b/g, ' ');
  return s;
}

function tokens(s) {
  return new Set(s.split(/\s+/).filter(t => t.length > 2));
}

function dice(a, b) {
  const ta = tokens(a), tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return (2 * inter) / (ta.size + tb.size);
}

// Match one of our saints against a list of santiebeati candidates for same feast
// First-token mapping for common Italian<->Spanish/Latin/English variants
const GIVEN_EQUIVS = new Map([
  ['jose', 'giuseppe'], ['giuseppe', 'jose'], ['josé', 'giuseppe'],
  ['andrea', 'andres'], ['andres', 'andrea'], ['andrés', 'andrea'],
  ['francesco', 'francisco'], ['francisco', 'francesco'],
  ['antonio', 'antonio'], ['giovanni', 'john'], ['john', 'giovanni'],
  ['viviana', 'bibiana'], ['bibiana', 'viviana'],
  ['domingo', 'domenico'], ['domenico', 'domingo'],
  ['cirillo', 'ciril'], ['ciril', 'cirillo'],
  ['gioacchino', 'joaquin'], ['joaquin', 'gioacchino'], ['joaquín', 'gioacchino'],
  ['enrico', 'enrique'], ['enrique', 'enrico'],
  ['genesio', 'gines'], ['gines', 'genesio'], ['ginés', 'genesio'],
  ['diego', 'diego'], ['fulgenzio', 'fulgencio'], ['fulgencio', 'fulgenzio'],
  ['ferdinando', 'ferran'], ['ferran', 'ferdinando'],
  ['eleuterio', 'eleuterio'], ['giacomo', 'jacques'], ['jacques', 'giacomo'],
]);

function firstToken(norm) {
  const toks = norm.split(/\s+/).filter(t => t.length > 2);
  return toks.length ? toks[0] : '';
}

function givenMatch(ourFirst, theirFirst) {
  if (ourFirst === theirFirst) return true;
  if (GIVEN_EQUIVS.get(ourFirst) === theirFirst) return true;
  // allow 4-char prefix match to catch suffix/plural variations
  if (ourFirst.length >= 5 && theirFirst.length >= 5 &&
      ourFirst.slice(0, 4) === theirFirst.slice(0, 4)) return true;
  return false;
}

function matchCandidates(ourName, candidates) {
  const ours = normName(ourName, false);
  const ourFirst = firstToken(ours);
  const best = [];
  for (const c of candidates) {
    const theirs = normName(c.name, true);
    const theirFirst = firstToken(theirs);
    // The given name must agree (this kills sibling/companion false positives)
    if (ourFirst.length < 3 || !givenMatch(ourFirst, theirFirst)) continue;
    const d = dice(ours, theirs);
    if (d >= 0.6) best.push({ ...c, score: d });
  }
  best.sort((a, b) => b.score - a.score);
  return best.slice(0, 3);
}

// ---------- Main ----------
async function imageExists(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA } });
    return res.ok && res.headers.get('content-type')?.startsWith('image/');
  } catch { return false; }
}

async function findRealImage(id) {
  const candidates = [
    `https://www.santiebeati.it/immagini/Thumbs/${id}/${id}.JPG`,
    `https://www.santiebeati.it/immagini/Thumbs/${id}/${id}.jpg`,
    `https://www.santiebeati.it/immagini/thumbs/${id}/${id}.JPG`,
    `https://www.santiebeati.it/immagini/thumbs/${id}/${id}.jpg`,
  ];
  for (const url of candidates) {
    if (await imageExists(url)) return url;
  }
  // Fallback: fetch detail page and parse the actual thumbnail URLs
  try {
    const res = await fetch(`https://www.santiebeati.it/dettaglio/${id}`, {
      headers: { 'User-Agent': UA },
    });
    if (!res.ok) return null;
    const txt = await res.text();
    const thumbs = [...txt.matchAll(/src="(\/immagini\/Thumbs\/[^"]+)"/gi)]
      .map(m => m[1].replace(/^\//, 'https://www.santiebeati.it/'));
    const og = [...txt.matchAll(/property="og:image" content="([^"]+)"/gi)].map(m => m[1]);
    const all = [...new Set([...og, ...thumbs])];
    for (const url of all) {
      if (await imageExists(url)) return url;
    }
    return null;
  } catch { return null; }
}

async function applyMatches(matches) {
  const progress = (() => {
    try { return JSON.parse(fs.readFileSync(PROGRESS, 'utf8')); }
    catch { return { updated: [], gone: [] }; }
  })();
  const done = new Set([...progress.updated, ...progress.gone]);
  let updated = progress.updated.length, gone = progress.gone.length;
  const CONC = 6;
  let cursor = 0;

  async function worker() {
    while (cursor < matches.length) {
      const m = matches[cursor++];
      if (done.has(m.file)) { continue; }
      const b = m.best[0];
      const url = await findRealImage(b.id);
      if (url) {
        const filepath = path.join(SAINTS_DIR, m.file);
        const content = fs.readFileSync(filepath, 'utf8');
        const fm = parseFrontmatter(content);
        if (fm) {
          fm.image = url;
          fm.imageAlt = fm.imageAlt || `Depiction of ${fm.name}`;
          fm.imageCredit = fm.imageCredit || 'Santiebeati.it';
          fm.imageCreditUrl = fm.imageCreditUrl || `https://www.santiebeati.it/dettaglio/${b.id}`;
          updateFile(m.file, fm);
          progress.updated.push(m.file);
          updated++;
        }
      } else {
        progress.gone.push(m.file);
        gone++;
      }
      if ((updated + gone) % 25 === 0) { saveProgress(progress); }
    }
  }

  await Promise.all(Array.from({ length: CONC }, worker));
  saveProgress(progress);
  console.log(`\n=== DONE ===`);
  console.log(`Updated: ${updated}, No image: ${gone}`);
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS, JSON.stringify(progress, null, 2));
  console.log(`  ...checked ${progress.updated.length + progress.gone.length}: ${progress.updated.length} updated, ${progress.gone.length} no-image`);
}

async function main() {
  const mode = process.argv[2] || 'match';
  if (mode === 'crawl') {
    await crawlDates();
    return;
  }
  if (mode === 'apply') {
    const matches = JSON.parse(fs.readFileSync(MATCH_LOG, 'utf8'));
    console.log(`Applying ${matches.length} matched candidates`);
    await applyMatches(matches);
    return;
  }

  const index = loadIndex();
  console.log(`Date index has ${Object.keys(index).length} dates`);

  const files = fs.readdirSync(SAINTS_DIR).filter(f => f.endsWith('.md'));
  const need = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(SAINTS_DIR, file), 'utf8');
    const fm = parseFrontmatter(content);
    if (!fm || !fm.image || !fm.image.includes('placeholder')) continue;
    need.push({ file, name: fm.name, feast: fm.feastDay });
  }
  console.log(`Saints with placeholders: ${need.length}\n`);

  const matches = [];
  let noFeast = 0, noMatch = 0;
  for (const s of need) {
    if (!s.feast || !s.feast.month || !s.feast.day) { noFeast++; continue; }
    const key = `${s.feast.month}-${s.feast.day}`;
    const candidates = index[key];
    if (!candidates || candidates.length === 0) { noMatch++; continue; }
    const best = matchCandidates(s.name, candidates);
    if (best.length > 0) matches.push({ file: s.file, name: s.name, feast: key, best });
  }

  console.log(`With feast: ${need.length - noFeast}, Without feast: ${noFeast}`);
  console.log(`Matched candidates: ${matches.length}\n`);
  fs.writeFileSync(MATCH_LOG, JSON.stringify(matches, null, 2));
  console.log(`Match log: ${MATCH_LOG}`);
}

main().catch(console.error);