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

// Sample 200 files with images
let checked = 0;
let valid = 0;
let invalid = 0;
const broken = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(SAINTS_DIR, file), 'utf8');
  const fm = parseFrontmatter(content);
  if (!fm || !fm.image) continue;
  
  const resolved = imageSrc(fm.image, 600);
  const ok = await checkImage(resolved);
  
  if (ok) valid++;
  else {
    invalid++;
    broken.push({ file, name: fm.name, image: fm.image, resolved });
  }
  
  checked++;
  if (checked % 20 === 0) console.log(`Checked ${checked}: ${valid} valid, ${invalid} broken`);
  if (checked >= 200) break;
}

console.log(`\nSample of ${checked} images:`);
console.log(`Valid: ${valid}`);
console.log(`Broken: ${invalid}`);
console.log(`Success rate: ${((valid/checked)*100).toFixed(1)}%`);

if (broken.length > 0) {
  console.log('\nBroken examples:');
  for (const b of broken.slice(0, 10)) {
    console.log(`  ${b.file}: ${b.resolved}`);
  }
}

fs.writeFileSync('C:\\iVGeek\\communion-of-saints\\scripts\\image-sample-check.json', 
  JSON.stringify({ checked, valid, invalid, broken }, null, 2));