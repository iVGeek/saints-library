import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';

const SAINTS_DIR = 'C:\\iVGeek\\communion-of-saints\\src\\content\\saints';

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

function normalizeImageUrl(url) {
  if (!url) return url;
  
  // Already a full URL - check if it's a thumb URL
  if (url.startsWith('https://upload.wikimedia.org/wikipedia/commons/thumb/')) {
    // Extract filename from thumb URL
    // Format: https://upload.wikimedia.org/wikipedia/commons/thumb/x/xx/Filename.jpg/330px-Filename.jpg
    const match = url.match(/\/thumb\/[^/]+\/[^/]+\/(.+?)\/(\d+px-.+)$/);
    if (match) {
      const filename = match[1];
      return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=600`;
    }
  }
  
  // CatholciSaints.info hotlinked images - convert to Special:FilePath if possible
  if (url.startsWith('http://catholicsaints.info/wp-content/uploads/') || 
      url.startsWith('https://catholicsaints.info/wp-content/uploads/')) {
    // These are hotlinked - try to find on Commons instead
    // For now, keep as-is but flag for replacement
    return url;
  }
  
  // Internet Archive PDF thumbnails - these are broken
  if (url.includes('IA_') && (url.includes('.pdf') || url.includes('page1-'))) {
    return url; // Will be flagged as broken
  }
  
  return url;
}

async function main() {
  const files = fs.readdirSync(SAINTS_DIR).filter(f => f.endsWith('.md'));
  
  let updated = 0;
  let errors = 0;
  
  for (const file of files) {
    const filepath = path.join(SAINTS_DIR, file);
    const content = fs.readFileSync(filepath, 'utf8');
    const fm = parseFrontmatter(content);
    if (!fm || !fm.image) continue;
    
    const normalized = normalizeImageUrl(fm.image);
    if (normalized !== fm.image) {
      fm.image = normalized;
      updateFile(file, fm);
      updated++;
    }
  }
  
  console.log(`Normalized ${updated} image URLs`);
}

main().catch(console.error);