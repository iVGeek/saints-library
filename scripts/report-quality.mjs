import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'src', 'content', 'saints');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));

const stats = {
  total: files.length,
  missingSummary: 0,
  missingRegion: 0,
  missingVocation: 0,
  missingPatronage: 0,
  shortBody: 0,
  placeholderImage: 0,
  httpImage: 0,
};

const stubs = [];
for (const f of files) {
  const raw = fs.readFileSync(path.join(dir, f), 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = {};
  if (m) {
    for (const line of m[1].split(/\r?\n/)) {
      const mm = line.match(/^([a-zA-Z]+):\s*(.*)$/);
      if (mm) fm[mm[1]] = mm[2];
    }
  }
  const body = m ? raw.slice(m[0].length).trim() : raw.trim();
  let isStub = false;
  if (!fm.summary) { stats.missingSummary++; isStub = true; }
  if (!fm.region) { stats.missingRegion++; isStub = true; }
  if (!/vocation:/m.test(m?.[1] || '')) { stats.missingVocation++; isStub = true; }
  if (!/patronage:/m.test(m?.[1] || '')) { stats.missingPatronage++; isStub = true; }
  if (body.length < 80) { stats.shortBody++; isStub = true; }
  const img = (m?.[1].match(/^image:\s*(.+)$/m)?.[1] || '').trim().replace(/^['"]|['"]$/g, '');
  if (img === '/placeholder-saint.svg') { stats.placeholderImage++; isStub = true; }
  if (/^http:\/\//i.test(img)) { stats.httpImage++; isStub = true; }
  if (isStub) stubs.push(f);
}

console.log(JSON.stringify(stats, null, 2));
console.log(`Stub profiles: ${stubs.length}`);
fs.writeFileSync(path.join(process.cwd(), 'stubs.json'), JSON.stringify(stubs, null, 2));
"created"