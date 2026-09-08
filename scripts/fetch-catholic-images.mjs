import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';

const SAINTS_DIR = 'C:\\iVGeek\\communion-of-saints\\src\\content\\saints';
const CACHE = 'C:\\iVGeek\\communion-of-saints\\scripts\\catholicorg-cache.json';
const PROGRESS = 'C:\\iVGeek\\communion-of-saints\\scripts\\catholicorg-progress.json';
const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';

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

// Build name -> saint_id map from the saved directory HTML
function buildCatholicMap() {
  if (fs.existsSync(CACHE)) {
    const cached = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
    if (Date.now() - cached.timestamp < 30 * 24 * 60 * 60 * 1000) {
      console.log(`  Loaded catholic.org cache: ${Object.keys(cached.map).length} entries`);
      return cached.map;
    }
  }

  const htmlPath = 'C:\\Users\\user\\.local\\share\\opencode\\tool-output\\tool_0832d3fcf00105w4WcTNeUhs0o';
  const html = fs.readFileSync(htmlPath, 'utf8');
  const map = {};

  const linkRe = /<a href="\/saints\/saint\.php\?saint_id=(\d+)"[^>]*>([^<]+)<\/a>/g;
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const id = m[1];
    let name = m[2].replace(/^St\.\s*/, '').trim();
    // Normalize: lower, strip diacritics, collapse spaces
    name = name
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/\s+/g, ' ').trim();
    map[name] = id;
  }

  fs.writeFileSync(CACHE, JSON.stringify({ timestamp: Date.now(), map }, null, 2));
  console.log(`  Built catholic.org map: ${Object.keys(map).length} saints`);
  return map;
}

// Normalize a saint name from our catalog to match catholic.org's naming
function normalizeName(name) {
  return name
    .replace(/^(saint|blessed|venerable|st\.?|bl\.?)\s+/i, '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
}

function loadProgress() {
  try { return JSON.parse(fs.readFileSync(PROGRESS, 'utf8')); }
  catch { return { processed: [], updated: 0, notFound: 0 }; }
}
function saveProgress(d) { fs.writeFileSync(PROGRESS, JSON.stringify(d, null, 2)); }

async function imageExists(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA } });
    return res.ok && res.headers.get('content-type')?.startsWith('image/');
  } catch { return false; }
}

async function main() {
  console.log('=== catholic.org image scraper ===\n');
  const map = buildCatholicMap();

  const files = fs.readdirSync(SAINTS_DIR).filter(f => f.endsWith('.md'));
  const need = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(SAINTS_DIR, file), 'utf8');
    const fm = parseFrontmatter(content);
    if (!fm || !fm.image || !fm.image.includes('placeholder')) continue;
    need.push({ file, name: fm.name });
  }
  console.log(`Saints with placeholders: ${need.length}\n`);

  const progress = loadProgress();
  const processedSet = new Set(progress.processed);

  // Match our saints to catholic.org names
  const matched = [];
  const unmatched = [];
  const seen = new Set(processedSet);
  for (const s of need) {
    if (seen.has(s.file)) continue;
    const norm = normalizeName(s.name);
    const id = map[norm];
    if (id) {
      matched.push({ ...s, id });
    } else {
      unmatched.push(s.file);
      seen.add(s.file);
    }
  }

  console.log(`After matching: ${matched.length} matched, ${unmatched.length} unmatched (no catholic.org entry)`);
  console.log(`Remaining to verify images for: ${matched.length}\n`);

  const MAX = process.env.MAX ? parseInt(process.env.MAX, 10) : Infinity;
  const CONC = parseInt(process.env.CONC || '10', 10);
  const queue = matched.slice(0, MAX);
  let updated = progress.updated || 0;
  let verified = 0;
  let notImage = 0;
  let active = 0;
  let idx = 0;

  await new Promise((resolve) => {
    function next() {
      while (active < CONC && idx < queue.length) {
        const item = queue[idx++];
        active++;
        (async () => {
          const url = `https://www.catholic.org/files/images/saints/${item.id}.jpg`;
          const ok = await imageExists(url);
          if (ok) {
            const filepath = path.join(SAINTS_DIR, item.file);
            const content = fs.readFileSync(filepath, 'utf8');
            const fm = parseFrontmatter(content);
            if (fm) {
              fm.image = url;
              fm.imageAlt = fm.imageAlt || `Artistic portrait of ${item.name}`;
              fm.imageCredit = fm.imageCredit || 'Catholic Online';
              fm.imageCreditUrl = fm.imageCreditUrl || `https://www.catholic.org/saints/saint.php?saint_id=${item.id}`;
              updateFile(item.file, fm);
              updated++;
            }
          } else {
            notImage++;
          }
          seen.add(item.file);
          verified++;
          active--;
          if (verified % 100 === 0) {
            saveProgress({ processed: [...seen], updated, notFound: notImage });
            console.log(`  ...${verified}/${queue.length} verified, ${updated} ok, ${notImage} no-image`);
          }
          if (active === 0 && idx >= queue.length) resolve();
          else next();
        })();
      }
    }
    next();
  });

  saveProgress({ processed: [...seen], updated, notFound: notImage });
  console.log(`\n=== DONE ===`);
  console.log(`Verified: ${verified}, Updated: ${updated}, No image at URL: ${notImage}`);
}

main().catch(console.error);