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
  validImages: 0,
  invalidImages: 0,
  bySource: {},
  missing: [],
  broken: [],
  details: []
};

async function checkImage(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

async function audit() {
  const BATCH_SIZE = 20;
  let processed = 0;
  
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (file) => {
      const content = fs.readFileSync(path.join(SAINTS_DIR, file), 'utf8');
      const fm = parseFrontmatter(content);
      if (!fm) return;
      
      const name = fm.name || file.replace('.md', '');
      
      if (fm.image) {
        results.withImage++;
        let source = 'other';
        if (fm.image.startsWith('https://upload.wikimedia.org')) source = 'wikimedia';
        else if (fm.image.startsWith('https://commons.wikimedia.org')) source = 'commons';
        else if (fm.image.startsWith('http://catholicsaints.info') || fm.image.startsWith('https://catholicsaints.info')) source = 'catholicsaints';
        results.bySource[source] = (results.bySource[source] || 0) + 1;
        
        const resolved = imageSrc(fm.image, 600);
        const valid = await checkImage(resolved);
        
        if (valid) {
          results.validImages++;
        } else {
          results.invalidImages++;
          results.broken.push({ file, name, image: fm.image, resolved });
        }
        
        results.details.push({ file, name, image: fm.image, resolved, valid, source });
      } else {
        results.withoutImage++;
        results.missing.push({ file, name });
        results.details.push({ file, name, image: null, resolved: null, valid: false, source: 'none' });
      }
    }));
    
    processed += batch.length;
    if (processed % 1000 === 0 || processed === files.length) {
      console.log(`Progress: ${processed}/${files.length} (${((processed/files.length)*100).toFixed(1)}%)`);
    }
  }
  
  console.log('\n=== IMAGE AUDIT RESULTS ===');
  console.log(`Total: ${results.total}`);
  console.log(`With image: ${results.withImage}`);
  console.log(`Without image: ${results.withoutImage}`);
  console.log(`Valid images: ${results.validImages}`);
  console.log(`Invalid images: ${results.invalidImages}`);
  console.log(`By source:`, results.bySource);
  
  if (results.broken.length > 0) {
    console.log(`\nBroken images (${results.broken.length}):`);
    for (const b of results.broken.slice(0, 30)) {
      console.log(`  ${b.file}: ${b.resolved}`);
    }
  }
  
  fs.writeFileSync('C:\\iVGeek\\communion-of-saints\\scripts\\image-audit-report.json', 
    JSON.stringify(results, null, 2));
  
  console.log('\nFull report saved to scripts/image-audit-report.json');
}

audit().catch(console.error);