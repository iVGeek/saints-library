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
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&format=json&srlimit=3`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  return res.json();
}

async function getFileInfo(filename) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=600&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  return res.json();
}

const allowedLicenses = ['public domain', 'cc0', 'cc-by', 'cc-by-sa', 'cc-by-2.0', 'cc-by-3.0', 'cc-by-4.0', 'cc-by-sa-2.0', 'cc-by-sa-3.0', 'cc-by-sa-4.0'];

async function searchAndGetBest(name, aliases = []) {
  const queries = [
    name,
    `${name} saint`,
    ...aliases.slice(0, 2).map(a => a)
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
          
          const license = (metadata.LicenseShortName?.value || metadata.License?.value || '').toLowerCase();
          const isAllowed = allowedLicenses.some(l => license.includes(l));
          
          if (!isAllowed) continue;
          
          const artist = metadata.Artist?.value || '';
          const credit = metadata.Credit?.value || artist || 'Wikimedia Commons';
          
          return {
            url,
            title,
            license,
            credit,
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

// Main - process only missing images
async function main() {
  const files = fs.readdirSync(SAINTS_DIR).filter(f => f.endsWith('.md'));
  
  // Find files without images
  const missingFiles = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(SAINTS_DIR, file), 'utf8');
    const fm = parseFrontmatter(content);
    if (fm && !fm.image) {
      missingFiles.push({ file, name: fm.name, aliases: fm.searchAliases || [] });
    }
  }
  
  console.log(`Missing images: ${missingFiles.length}`);
  
  // Process first 100 as test
  const toProcess = missingFiles.slice(0, 50);
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
      
      console.log(`  ✓ Found: ${result.url}`);
      updated++;
    } else {
      console.log(`  ✗ Not found`);
      notFound++;
    }
    
    await new Promise(r => setTimeout(r, 300)); // Rate limit
  }
  
  console.log(`\nDone. Updated: ${updated}, Not found: ${notFound}`);
}

main().catch(console.error);