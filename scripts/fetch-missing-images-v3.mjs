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
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=600&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  return res.json();
}

const allowedLicenses = ['public domain', 'cc0', 'cc-by', 'cc-by-sa', 'cc-by-2.0', 'cc-by-3.0', 'cc-by-4.0', 'cc-by-sa-2.0', 'cc-by-sa-3.0', 'cc-by-sa-4.0'];
const blockedKeywords = ['olympics', 'einstein', 'novembro', 'universal', 'almanaque', 'musicos', 'patnubay', 'agiologio', 'pronouncing', 'dictionary', 'biography', 'mythology', '1919', '1862', '1884', '2004', '2010', 'climate', 'law', 'referral', 'löv', 'isabella', 'summer', 'competition', 'roque'];

function isRelevantResult(name, title, description) {
  const nameParts = name.toLowerCase().split(/\s+/).filter(p => p.length > 2);
  const titleLower = title.toLowerCase();
  const descLower = (description || '').toLowerCase();
  
  for (const blocked of blockedKeywords) {
    if (titleLower.includes(blocked) || descLower.includes(blocked)) {
      return false;
    }
  }
  
  // Must have at least one name part in title or description
  for (const part of nameParts) {
    if (titleLower.includes(part) || descLower.includes(part)) {
      return true;
    }
  }
  
  return false;
}

function isValidImageFile(url, mime) {
  // Must be an image file, not PDF
  if (url.toLowerCase().includes('.pdf')) return false;
  if (mime && !mime.startsWith('image/')) return false;
  return true;
}

async function searchAndGetBest(name, aliases = []) {
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
          
          // Must be actual image file
          if (!isValidImageFile(url, mime)) continue;
          
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
            mime
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

async function main() {
  const files = fs.readdirSync(SAINTS_DIR).filter(f => f.endsWith('.md'));
  
  // Find Saints without images
  const missingFiles = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(SAINTS_DIR, file), 'utf8');
    const fm = parseFrontmatter(content);
    if (fm && !fm.image && fm.canonizationStatus === 'Saint') {
      missingFiles.push({ file, name: fm.name, aliases: fm.searchAliases || [] });
    }
  }
  
  console.log(`Missing images (Saints only): ${missingFiles.length}`);
  
  // Process first 30 as test
  const toProcess = missingFiles.slice(0, 30);
  let updated = 0;
  let notFound = 0;
  
  for (const { file, name, aliases } of toProcess) {
    console.log(`[${updated + notFound + 1}/${toProcess.length}] Searching: ${name}`);
    
    const result = await searchAndGetBest(name, aliases);
    
    if (result) {
      const filepath = path.join(SAINTS_DIR, file);
      const content = fs.readFileSync(filepath, 'utf8');
      const fm = parseFrontmatter(content);
      
      fm.image = result.url;
      fm.imageAlt = fm.imageAlt || `Portrait of ${name}`;
      fm.imageCredit = fm.imageCredit || result.credit;
      fm.imageCreditUrl = fm.imageCreditUrl || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(result.title)}`;
      updateFile(file, fm);
      
      console.log(`  ✓ Found: ${result.url} (${result.mime}) via "${result.query}"`);
      updated++;
    } else {
      console.log(`  ✗ Not found`);
      notFound++;
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\nDone. Updated: ${updated}, Not found: ${notFound}`);
}

main().catch(console.error);