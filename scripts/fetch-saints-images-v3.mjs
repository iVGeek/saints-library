import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';

const SAINTS_DIR = 'C:\\iVGeek\\communion-of-saints\\src\\content\\saints';
const PROGRESS_PATH = 'C:\\iVGeek\\communion-of-saints\\scripts\\fetch-progress-v3.json';
const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  try {
    return yaml.load(match[1]);
  } catch (e) {
    return null;
  }
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

async function searchWikipedia(name) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name + ' saint')}&format=json&srlimit=3`;
  const res = await limitedFetch(url);
  return res.json();
}

async function getWikipediaPageImage(pageTitle) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&piprop=original&format=json`;
  const res = await limitedFetch(url);
  const data = await res.json();
  const pages = data.query?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0];
  return page?.original?.source || null;
}

async function searchCommons(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&format=json&srlimit=5`;
  const res = await limitedFetch(url);
  return res.json();
}

async function getFileInfo(filename) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=600&format=json`;
  const res = await limitedFetch(url);
  return res.json();
}

let lastReq = 0;
async function limitedFetch(url) {
  const now = Date.now();
  const wait = Math.max(0, 500 - (now - lastReq));
  if (wait) await new Promise(r => setTimeout(r, wait));
  lastReq = Date.now();
  return fetch(url, { headers: { 'User-Agent': UA } });
}

const allowedLicenses = ['public domain', 'cc0', 'cc-by', 'cc-by-sa', 'cc-by-2.0', 'cc-by-3.0', 'cc-by-4.0', 'cc-by-sa-2.0', 'cc-by-sa-3.0', 'cc-by-sa-4.0'];
const blockedKeywords = ['olympics', 'einstein', 'novembro', 'universal', 'almanaque', 'musicos', 'patnubay', 'agiologio', 'pronouncing', 'dictionary', 'biography', 'mythology', '1919', '1862', '1884', '2004', '2010', 'climate', 'law', 'referral', 'löv', 'isabella', 'summer', 'competition', 'roque', 'geograph', 'geograph.org.uk', 'east-ortho-cross', 'ortho-cross', 'cross.svg', 'flag_of', 'locator_', 'map', 'stained_glass', 'window', 'sigill', 'seal', 'coat_of_arms', 'emblem', 'logo', 'chart', 'diagram', 'graph', 'tropmed', 'album_general', 'cryptogames', 'beatification', 'john_paul', 'bazoule', 'crocodiles', 'monica_of_hippo', 'mark_twain', 'tzarevich', 'dmitry', 'nesterov', 'hannibal', 'barca', 'bust', 'montage', 'ville_de', 'ruines', 'ruins', 'aerial', 'vue_aerienne', 'drone', 'galeazzo', 'sanseverino', 'ruPaul', 'dragcon'];

function isGenericImage(url, title, description) {
  const urlLower = url.toLowerCase();
  const titleLower = title.toLowerCase();
  const descLower = (description || '').toLowerCase();

  for (const blocked of blockedKeywords) {
    if (urlLower.includes(blocked) || titleLower.includes(blocked) || descLower.includes(blocked)) {
      return true;
    }
  }

  if (urlLower.includes('.svg') && (urlLower.includes('cross') || urlLower.includes('ortho'))) {
    return true;
  }

  return false;
}

function isRelevantResult(name, title, description) {
  const nameParts = name.toLowerCase().split(/\s+/).filter(p => p.length > 3);
  const titleLower = title.toLowerCase();
  const descLower = (description || '').toLowerCase();

  for (const part of nameParts) {
    if (titleLower.includes(part) || descLower.includes(part)) {
      return true;
    }
  }

  if (nameParts.length === 1) {
    const part = nameParts[0].substring(0, 4);
    if (titleLower.includes(part) || descLower.includes(part)) {
      return true;
    }
  }

  return false;
}

function isValidImageFile(url, mime) {
  if (url.toLowerCase().includes('.pdf')) return false;
  if (mime && !mime.startsWith('image/')) return false;
  return true;
}

async function tryWikipediaFirst(name) {
  try {
    const search = await searchWikipedia(name);
    if (!search.query?.search?.length) return null;

    for (const item of search.query.search.slice(0, 3)) {
      const image = await getWikipediaPageImage(item.title);
      if (image && image.startsWith('https://upload.wikimedia.org')) {
        if (!isGenericImage(image, item.title, '')) {
          return { url: image, source: 'wikipedia', title: item.title };
        }
      }
    }
  } catch (e) {
    // Ignore
  }
  return null;
}

async function searchAndGetBest(name, aliases = []) {
  const wikiResult = await tryWikipediaFirst(name);
  if (wikiResult) {
    return wikiResult;
  }

  const baseName = name.replace(/^blessed\s+/i, '').replace(/^venerable\s+/i, '').replace(/^saint\s+/i, '').trim();

  const queries = [
    `"${baseName}" saint`,
    `"${baseName}" artwork`,
    `"${baseName}" painting`,
    `"${baseName}" icon`,
    `"${baseName}" portrait`,
    baseName + ' saint',
  ];

  for (const alias of aliases.slice(0, 2)) {
    const a = alias.replace(/^st\.\s+/i, '').replace(/^saint\s+/i, '').trim();
    queries.push(`"${a}" saint`);
    queries.push(`"${a}" artwork`);
  }

  for (const query of queries) {
    try {
      const searchResult = await searchCommons(query);
      if (!searchResult.query?.search?.length) continue;

      for (const item of searchResult.query.search.slice(0, 3)) {
        const title = item.title.replace('File:', '');
        try {
          const fileInfo = await getFileInfo(title);
          const pages = fileInfo.query?.pages;
          if (!pages) continue;

          const page = Object.values(pages)[0];
          if (!page.imageinfo?.[0]?.url) continue;

          const url = page.imageinfo[0].url;
          const mime = page.imageinfo[0].mime;
          const metadata = page.imageinfo[0].extmetadata || {};

          if (!isValidImageFile(url, mime)) continue;
          if (isGenericImage(url, title, metadata.ImageDescription?.value || '')) continue;

          const license = (metadata.LicenseShortName?.value || metadata.License?.value || '').toLowerCase();
          const isAllowed = allowedLicenses.some(l => license.includes(l));

          if (!isAllowed) continue;

          const description = metadata.ImageDescription?.value || '';

          if (!isRelevantResult(name, title, description)) {
            continue;
          }

          const artist = metadata.Artist?.value || '';
          const credit = metadata.Credit?.value || artist || 'Wikimedia Commons';

          return {
            url,
            title,
            license,
            credit,
            query,
            mime,
            source: 'commons'
          };
        } catch (e) {
          // Try next
        }
      }
    } catch (e) {
      // Try next query
    }
  }

  return null;
}

function loadProgress() {
  try {
    const p = JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'));
    return {
      processed: new Set(p.processed || []),
      totalUpdated: p.totalUpdated || 0,
      totalNotFound: p.totalNotFound || 0,
    };
  } catch {
    return { processed: new Set(), totalUpdated: 0, totalNotFound: 0 };
  }
}

function saveProgress(processedSet, totalUpdated, totalNotFound) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify({
    processed: [...processedSet],
    totalUpdated,
    totalNotFound,
  }, null, 2));
}

async function worker(queue, processedSet, counters, concurrency, sleepMs) {
  while (queue.length) {
    const item = queue.shift();
    if (processedSet.has(item.file)) continue;

    const result = await searchAndGetBest(item.name, item.aliases);

    if (result) {
      const filepath = path.join(SAINTS_DIR, item.file);
      const content = fs.readFileSync(filepath, 'utf8');
      const fm = parseFrontmatter(content);

      fm.image = result.url;
      fm.imageAlt = fm.imageAlt || `Portrait of ${item.name}`;
      fm.imageCredit = fm.imageCredit || result.credit;
      fm.imageCreditUrl = fm.imageCreditUrl ||
        (result.source === 'wikipedia'
          ? `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title)}`
          : `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(result.title)}`);
      updateFile(item.file, fm);

      console.log(`  [ok] ${item.name} <- ${result.source}: ${result.url}`);
      counters.updated++;
    } else {
      console.log(`  [--] ${item.name} not found`);
      counters.notFound++;
    }

    processedSet.add(item.file);
    counters.processed++;

    if (counters.processed % 25 === 0) {
      saveProgress(processedSet, counters.updated, counters.notFound);
      console.log(`  ...progress: ${counters.processed} done, ${counters.updated} updated, ${counters.notFound} not found`);
    }

    await new Promise(r => setTimeout(r, sleepMs));
  }
}

async function main() {
  const files = fs.readdirSync(SAINTS_DIR);
  const missing = [];
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const content = fs.readFileSync(path.join(SAINTS_DIR, file), 'utf8');
    const fm = parseFrontmatter(content);
    if (fm && !fm.image && fm.canonizationStatus === 'Saint') {
      missing.push({ file, name: fm.name, aliases: fm.searchAliases || [] });
    }
  }

  const progress = loadProgress();
  const todo = missing.filter(m => !progress.processed.has(m.file));
  console.log(`Missing Saints: ${missing.length}, already processed: ${progress.processed.size}, to do: ${todo.length}`);

  const CONCURRENCY = 6;
  const SLEEP_MS = 400;
  const MAX = process.env.MAX ? parseInt(process.env.MAX, 10) : Infinity;

  const queue = [...todo].slice(0, MAX);
  const counters = { processed: 0, updated: progress.totalUpdated, notFound: progress.totalNotFound };

  const workers = [];
  for (let i = 0; i < Math.min(CONCURRENCY, queue.length); i++) {
    workers.push(worker(queue, progress.processed, counters, CONCURRENCY, SLEEP_MS));
  }
  await Promise.all(workers);

  saveProgress(progress.processed, counters.updated, counters.notFound);
  console.log(`\n=== FINAL ===`);
  console.log(`Processed this run: ${counters.processed}`);
  console.log(`Total updated: ${counters.updated}`);
  console.log(`Total not found: ${counters.notFound}`);
}

main().catch(console.error);
