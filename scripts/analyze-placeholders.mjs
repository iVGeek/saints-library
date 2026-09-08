import fs from 'node:fs';
import path from 'node:path';

const SAINTS_DIR = 'C:\\iVGeek\\communion-of-saints\\src\\content\\saints';
const files = fs.readdirSync(SAINTS_DIR).filter(f => f.endsWith('.md'));

function field(content, key) {
  const m = content.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  if (!m) return null;
  return m[1].replace(/^["']|["']$/g, '').trim();
}

const need = [];
for (const f of files) {
  const c = fs.readFileSync(path.join(SAINTS_DIR, f), 'utf8');
  const isPlaceholder = /image:\s*\/placeholder-saint\.svg/.test(c);
  if (!isPlaceholder) continue;
  need.push({ file: f, name: field(c, 'name'), honorific: field(c, 'honorific'), region: field(c, 'region') });
}
console.log('Placeholders: ' + need.length);

const byHonorific = {};
for (const { honorific } of need) {
  const h = honorific || 'Saint';
  byHonorific[h] = (byHonorific[h] || 0) + 1;
}
console.log('\nBy honorific:');
console.log(JSON.stringify(byHonorific, null, 2));

const byRegion = {};
for (const { region } of need) {
  const r = region || 'unknown';
  byRegion[r] = (byRegion[r] || 0) + 1;
}
const topRegions = Object.entries(byRegion).sort((a, b) => b[1] - a[1]).slice(0, 30);
console.log('\nTop regions:');
for (const [r, n] of topRegions) console.log(`  ${r}: ${n}`);

console.log('\nSample names:');
for (const { name, region } of need.slice(0, 50)) console.log(`  ${name}  (${region || '?'})`);