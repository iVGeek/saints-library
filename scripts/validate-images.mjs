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

async function validateImage(url) {
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

async function main() {
  const files = fs.readdirSync(SAINTS_DIR).filter(f => f.endsWith('.md'));
  
  // Validate all existing images
  const withImages = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(SAINTS_DIR, file), 'utf8');
    const fm = parseFrontmatter(content);
    if (fm && fm.image) {
      withImages.push({ file, name: fm.name, image: fm.image });
    }
  }
  
  console.log(`Validating ${withImages.length} existing images...`);
  
  let valid = 0;
  let broken = 0;
  const brokenFiles = [];
  
  for (let i = 0; i < withImages.length; i++) {
    const { file, name, image } = withImages[i];
    const resolved = image.startsWith('http') ? image : 
      `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(image.replace(/^File:/, '').replace(/ /g, '_'))}?width=600`;
    const ok = await validateImage(resolved);
    
    if (ok) {
      valid++;
    } else {
      broken++;
      brokenFiles.push({ file, name, image, resolved });
      console.log(`  BROKEN: ${name} - ${resolved}`);
    }
    
    if ((i + 1) % 100 === 0) {
      console.log(`Progress: ${i + 1}/${withImages.length} (valid: ${valid}, broken: ${broken})`);
    }
    
    await new Promise(r => setTimeout(r, 50));
  }
  
  console.log(`\n=== VALIDATION RESULTS ===`);
  console.log(`Total: ${withImages.length}`);
  console.log(`Valid: ${valid} (${((valid/withImages.length)*100).toFixed(1)}%)`);
  console.log(`Broken: ${broken} (${((broken/withImages.length)*100).toFixed(1)}%)`);
  
  fs.writeFileSync('C:\\iVGeek\\communion-of-saints\\scripts\\image-validation-report.json', 
    JSON.stringify({ total: withImages.length, valid, broken, brokenFiles }, null, 2));
}

main().catch(console.error);