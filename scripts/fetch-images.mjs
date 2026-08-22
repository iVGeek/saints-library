import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';

const SAINTS_DIR = 'C:\\iVGeek\\communion-of-saints\\src\\content\\saints';
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
  return yaml.dump(fm, { 
    indent: 2, 
    lineWidth: 120,
    noRefs: true,
    sortKeys: false
  });
}

function updateFile(file, fm) {
  const content = fs.readFileSync(path.join(SAINTS_DIR, file), 'utf8');
  const newFm = serializeFrontmatter(fm);
  const newContent = content.replace(/^---\r?\n[\s\S]*?\r?\n---/, `---\n${newFm}---`);
  fs.writeFileSync(path.join(SAINTS_DIR, file), newContent, 'utf8');
}

async function searchCommons(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&format=json&srlimit=5`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  return res.json();
}

async function getFileInfo(filename) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=600&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  return res.json();
}

async function searchAndGetBest(name, aliases = []) {
  // Try multiple search strategies
  const queries = [
    name,
    `${name} saint`,
    `${name} catholic saint`,
    ...aliases.slice(0, 3).map(a => `${a} saint`)
  ];
  
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
          const metadata = page.imageinfo[0].extmetadata || {};
          
          // Check license - prefer public domain or CC0/CC-BY/CC-BY-SA
          const license = metadata.LicenseShortName?.value || metadata.License?.value || '';
          const allowedLicenses = ['Public domain', 'CC0', 'CC-BY', 'CC-BY-SA', 'CC-BY-2.0', 'CC-BY-3.0', 'CC-BY-4.0', 'CC-BY-SA-2.0', 'CC-BY-SA-3.0', 'CC-BY-SA-4.0'];
          const isAllowed = allowedLicenses.some(l => license.includes(l));
          
          if (!isAllowed && !license.includes('public domain') && !license.includes('CC0')) {
            // Skip non-free licenses
            continue;
          }
          
          // Get credit info
          const artist = metadata.Artist?.value || '';
          const credit = metadata.Credit?.value || artist || 'Wikimedia Commons';
          const description = metadata.ImageDescription?.value || '';
          
          return {
            url,
            title,
            license,
            credit,
            description,
            query
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

async function validateImage(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

// Main processing
async function processSaint(file) {
  const filepath = path.join(SAINTS_DIR, file);
  const content = fs.readFileSync(filepath, 'utf8');
  const fm = parseFrontmatter(content);
  if (!fm) return { file, status: 'parse-error' };
  
  const name = fm.name || file.replace('.md', '');
  const aliases = fm.searchAliases || [];
  
  // Check if current image is valid
  let hasValidImage = false;
  if (fm.image) {
    const resolved = fm.image.startsWith('http') ? fm.image : 
      `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fm.image.replace(/^File:/, '').replace(/ /g, '_'))}?width=600`;
    hasValidImage = await validateImage(resolved);
  }
  
  if (hasValidImage) {
    return { file, status: 'ok', image: fm.image };
  }
  
  // Need to find new image
  console.log(`Searching for: ${name}`);
  const result = await searchAndGetBest(name, aliases);
  
  if (result) {
    // Validate the found image
    const valid = await validateImage(result.url);
    if (valid) {
      fm.image = result.url;
      fm.imageAlt = fm.imageAlt || `Portrait of ${name}`;
      fm.imageCredit = fm.imageCredit || result.credit;
      fm.imageCreditUrl = fm.imageCreditUrl || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(result.title)}`;
      updateFile(file, fm);
      console.log(`  ✓ Updated: ${name} -> ${result.url}`);
      return { file, status: 'updated', image: result.url };
    }
  }
  
  console.log(`  ✗ No valid image found for: ${name}`);
  return { file, status: 'not-found' };
}

async function main() {
  const files = fs.readdirSync(SAINTS_DIR).filter(f => f.endsWith('.md'));
  
  // Process in batches
  const BATCH_SIZE = 50;
  let processed = 0;
  let updated = 0;
  let ok = 0;
  let notFound = 0;
  let errors = 0;
  
  // First, just process saints without images (priority)
  const missingFiles = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(SAINTS_DIR, file), 'utf8');
    const fm = parseFrontmatter(content);
    if (fm && !fm.image) {
      missingFiles.push(file);
    }
  }
  
  console.log(`Missing images: ${missingFiles.length}/${files.length}`);
  
  // Also check files with broken images
  const brokenFiles = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(SAINTS_DIR, file), 'utf8');
    const fm = parseFrontmatter(content);
    if (fm && fm.image) {
      const resolved = fm.image.startsWith('http') ? fm.image : 
        `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fm.image.replace(/^File:/, '').replace(/ /g, '_'))}?width=600`;
      const valid = await validateImage(resolved);
      if (!valid) {
        brokenFiles.push(file);
      }
    }
  }
  
  console.log(`Broken images: ${brokenFiles.length}`);
  
  // Process missing first, then broken
  const toProcess = [...missingFiles.slice(0, 200), ...brokenFiles.slice(0, 100)];
  console.log(`Processing ${toProcess.length} files...`);
  
  for (const file of toProcess) {
    const result = await processSaint(file);
    if (result.status === 'ok') ok++;
    else if (result.status === 'updated') updated++;
    else if (result.status === 'not-found') notFound++;
    else errors++;
    
    processed++;
    if (processed % 10 === 0) {
      console.log(`Progress: ${processed}/${toProcess.length} (ok: ${ok}, updated: ${updated}, not-found: ${notFound}, errors: ${errors})`);
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\n=== SUMMARY ===');
  console.log(`Processed: ${processed}`);
  console.log(`Already OK: ${ok}`);
  console.log(`Updated: ${updated}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);