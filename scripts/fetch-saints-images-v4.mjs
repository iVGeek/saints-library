import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';

const SAINTS_DIR = 'C:\\iVGeek\\communion-of-saints\\src\\content\\saints';
const PROGRESS_PATH = 'C:\\iVGeek\\communion-of-saints\\scripts\\fetch-progress-v4.json';
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

let requestCount = 0;
let windowStart = Date.now();
async function limitedFetch(url) {
  const now = Date.now();
  if (now - windowStart > 1000) { requestCount = 0; windowStart = now; }
  if (requestCount >= 8) {
    await new Promise(r => setTimeout(r, 150));
    requestCount = 0;
    windowStart = Date.now();
  }
  requestCount++;
  return fetch(url, { headers: { 'User-Agent': UA } });
}

const blockedKeywords = [
  'olympics', 'einstein', 'novembro', 'universal', 'almanaque', 'musicos',
  'patnubay', 'agiologio', 'pronouncing', 'dictionary', 'mythology',
  'climate', 'law', 'referral', 'summer', 'competition', 'geograph',
  'east-ortho-cross', 'ortho-cross', 'cross.svg', 'flag_of', 'locator_',
  'map', 'stained_glass', 'window', 'sigill', 'seal', 'coat_of_arms',
  'emblem', 'logo', 'chart', 'diagram', 'graph', 'montage',
  'aerial', 'vue_aerienne', 'drone', 'ruins', 'ruines', 'ville_de',
  'bust', 'album_general', 'cryptogames', 'dragcon'
];

function isGenericImage(url, title, description) {
  const u = url.toLowerCase(), t = title.toLowerCase(), d = (description || '').toLowerCase();
  return blockedKeywords.some(k => u.includes(k) || t.includes(k) || d.includes(k))
    || (u.includes('.svg') && (u.includes('cross') || u.includes('ortho')));
}

const allowedLicenses = ['public domain', 'cc0', 'cc-by', 'cc-by-sa', 'cc-by-2.0', 'cc-by-3.0', 'cc-by-4.0', 'cc-by-sa-2.0', 'cc-by-sa-3.0', 'cc-by-sa-4.0'];

function isValidLicense(license) {
  const l = (license || '').toLowerCase();
  return allowedLicenses.some(a => l.includes(a));
}

function isRelevantResult(name, title, description) {
  const parts = name.toLowerCase().split(/\s+/).filter(p => p.length > 3);
  const t = title.toLowerCase(), d = (description || '').toLowerCase();
  return parts.some(p => t.includes(p) || d.includes(p));
}

async function wikiSearch(query) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=5`;
    const res = await limitedFetch(url);
    const data = await res.json();
    return data.query?.search || [];
  } catch { return []; }
}

async function wikiImage(title) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=original&format=json`;
    const res = await limitedFetch(url);
    const data = await res.json();
    const page = Object.values(data.query?.pages || {})[0];
    return page?.original?.source || null;
  } catch { return null; }
}

async function commonsSearch(query) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&format=json&srlimit=5`;
    const res = await limitedFetch(url);
    const data = await res.json();
    return data.query?.search || [];
  } catch { return []; }
}

async function commonsFileInfo(filename) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=600&format=json`;
    const res = await limitedFetch(url);
    const data = await res.json();
    const page = Object.values(data.query?.pages || {})[0];
    return page?.imageinfo?.[0] || null;
  } catch { return null; }
}

async function tryWikipedia(name) {
  const searches = [
    `${name} saint`,
    `${name} catholic`,
    `${name} blessed`,
    `${name} martyr`,
  ];
  for (const q of searches) {
    const results = await wikiSearch(q);
    for (const item of results.slice(0, 3)) {
      const img = await wikiImage(item.title);
      if (img && img.startsWith('https://upload.wikimedia.org') && !isGenericImage(img, item.title, '')) {
        return { url: img, source: 'wikipedia', title: item.title };
      }
    }
  }
  return null;
}

async function tryCommons(name) {
  const baseName = name.replace(/^(blessed|venerable|saint)\s+/i, '').trim();
  const queries = [
    `"${baseName}"`,
    `${baseName} saint`,
    `${baseName} catholic`,
    `${baseName} painting`,
    `${baseName} portrait`,
    `${baseName} icon`,
  ];

  for (const query of queries) {
    const results = await commonsSearch(query);
    for (const item of results.slice(0, 3)) {
      const title = item.title.replace('File:', '');
      const info = await commonsFileInfo(title);
      if (!info?.url) continue;
      if (!info.mime?.startsWith('image/')) continue;
      if (isGenericImage(info.url, title, info.extmetadata?.ImageDescription?.value || '')) continue;
      if (!isValidLicense(info.extmetadata?.LicenseShortName?.value)) continue;
      if (!isRelevantResult(name, title, info.extmetadata?.ImageDescription?.value || '')) continue;
      return {
        url: info.url,
        source: 'commons',
        title,
        credit: info.extmetadata?.Artist?.value || 'Wikimedia Commons',
        license: info.extmetadata?.LicenseShortName?.value || '',
      };
    }
  }
  return null;
}

async function findImage(name) {
  const wiki = await tryWikipedia(name);
  if (wiki) return wiki;
  return await tryCommons(name);
}

function loadProgress() {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'));
  } catch {
    return { processed: [], updated: 0, notFound: 0 };
  }
}

function saveProgress(data) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(data, null, 2));
}

async function main() {
  const files = fs.readdirSync(SAINTS_DIR).filter(f => f.endsWith('.md'));
  const missing = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(SAINTS_DIR, file), 'utf8');
    const fm = parseFrontmatter(content);
    if (!fm || !fm.image || !fm.image.includes('placeholder')) continue;
    missing.push({ file, name: fm.name, status: fm.canonizationStatus || 'unknown' });
  }

  const progress = loadProgress();
  const processedSet = new Set(progress.processed);
  const todo = missing.filter(m => !processedSet.has(m.file));

  const statusCounts = {};
  for (const m of todo) {
    statusCounts[m.status] = (statusCounts[m.status] || 0) + 1;
  }
  console.log(`Missing: ${missing.length}, already processed: ${processedSet.size}, to do: ${todo.length}`);
  console.log(`By status:`, statusCounts);

  const MAX = process.env.MAX ? parseInt(process.env.MAX, 10) : Infinity;
  const CONCURRENCY = parseInt(process.env.CONC || '10', 10);
  const queue = todo.slice(0, MAX);
  let updated = progress.updated || 0;
  let notFound = progress.notFound || 0;
  let processed = 0;
  let active = 0;
  let idx = 0;

  await new Promise((resolve) => {
    function next() {
      while (active < CONCURRENCY && idx < queue.length) {
        const item = queue[idx++];
        active++;
        (async () => {
          try {
            const result = await findImage(item.name);
            if (result) {
              const filepath = path.join(SAINTS_DIR, item.file);
              const content = fs.readFileSync(filepath, 'utf8');
              const fm = parseFrontmatter(content);
              if (fm) {
                fm.image = result.url;
                fm.imageAlt = fm.imageAlt || `Portrait of ${item.name}`;
                fm.imageCredit = fm.imageCredit || result.credit;
                fm.imageCreditUrl = fm.imageCreditUrl ||
                  (result.source === 'wikipedia'
                    ? `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title)}`
                    : `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(result.title)}`);
                updateFile(item.file, fm);
                console.log(`  [ok] ${item.name} <- ${result.source}`);
                updated++;
              }
            } else {
              notFound++;
            }
          } catch (e) {
            notFound++;
          }
          processedSet.add(item.file);
          processed++;
          active--;
          if (processed % 25 === 0) {
            saveProgress({ processed: [...processedSet], updated, notFound });
            console.log(`  ...${processed}/${queue.length} done, ${updated} ok, ${notFound} miss`);
          }
          if (active === 0 && idx >= queue.length) resolve();
          else next();
        })();
      }
    }
    next();
  });

  saveProgress({ processed: [...processedSet], updated, notFound });
  console.log(`\n=== DONE ===`);
  console.log(`Processed: ${processed}, Updated: ${updated}, Not found: ${notFound}`);
}

main().catch(console.error);
