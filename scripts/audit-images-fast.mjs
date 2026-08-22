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

function imageSrc(src, width = 900) {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  const name = src.replace(/^File:/, '').replace(/ /g, '_');
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${width}`;
}

const files = fs.readdirSync(SAINTS_DIR).filter(f => f.endsWith('.md'));
console.log(`Total saint files: ${files.length}`);

const results = {
  total: files.length,
  withImage: 0,
  withoutImage: 0,
  bySource: {},
  missing: [],
  details: []
};

for (const file of files) {
  const content = fs.readFileSync(path.join(SAINTS_DIR, file), 'utf8');
  const fm = parseFrontmatter(content);
  if (!fm) continue;
  
  const name = fm.name || file.replace('.md', '');
  
  if (fm.image) {
    results.withImage++;
    let source = 'other';
    if (fm.image.startsWith('https://upload.wikimedia.org')) source = 'wikimedia';
    else if (fm.image.startsWith('https://commons.wikimedia.org')) source = 'commons';
    else if (fm.image.startsWith('http://catholicsaints.info') || fm.image.startsWith('https://catholicsaints.info')) source = 'catholicsaints';
    results.bySource[source] = (results.bySource[source] || 0) + 1;
    
    const resolved = imageSrc(fm.image, 600);
    results.details.push({ file, name, image: fm.image, resolved, source });
  } else {
    results.withoutImage++;
    results.missing.push({ file, name });
    results.details.push({ file, name, image: null, resolved: null, source: 'none' });
  }
}

console.log('\n=== IMAGE AUDIT RESULTS (no HTTP check) ===');
console.log(`Total: ${results.total}`);
console.log(`With image: ${results.withImage}`);
console.log(`Without image: ${results.withoutImage}`);
console.log(`By source:`, results.bySource);

fs.writeFileSync('C:\\iVGeek\\communion-of-saints\\scripts\\image-audit-report.json', 
  JSON.stringify(results, null, 2));

console.log('\nFull report saved to scripts/image-audit-report.json');