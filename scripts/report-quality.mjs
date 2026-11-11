import fs from 'node:fs';
import path from 'node:path';

/**
 * Data-quality report for the saint corpus.
 *
 * `stub` means "short body awaiting a real biography" (body < 80 chars).
 * That is the same definition used by scripts/mark-stubs.mjs and the UI.
 * Missing optional fields are reported separately so they don't get confused
 * with true stubs.
 */

const dir = path.join(process.cwd(), 'src', 'content', 'saints');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));

const stats = {
  total: files.length,
  stubs: 0,
  missingSummary: 0,
  missingRegion: 0,
  missingVocation: 0,
  missingPatronage: 0,
  placeholderImage: 0,
  httpImage: 0,
  missingSources: 0,
};

const stubs = [];
const byMissing = {
  summary: [],
  region: [],
  vocation: [],
  patronage: [],
  image: [],
};

for (const f of files) {
  const raw = fs.readFileSync(path.join(dir, f), 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = m?.[1] ?? '';
  const body = m ? raw.slice(m[0].length).trim() : raw.trim();

  const flag = fm.match(/^stub:\s*(true|false)\s*$/m)?.[1];
  const isStub = flag ? flag === 'true' : body.length < 80;

  if (isStub) {
    stats.stubs++;
    stubs.push(f);
  }

  if (!/^summary:\s*\S/m.test(fm)) {
    stats.missingSummary++;
    byMissing.summary.push(f);
  }
  if (!/^region:\s*\S/m.test(fm)) {
    stats.missingRegion++;
    byMissing.region.push(f);
  }
  if (!/^vocation:\s*(?:\n\s+-|\[.+)/m.test(fm)) {
    stats.missingVocation++;
    byMissing.vocation.push(f);
  }
  if (!/^patronage:\s*(?:\n\s+-|\[.+)/m.test(fm)) {
    stats.missingPatronage++;
    byMissing.patronage.push(f);
  }
  if (!/^sources:\s*(?:\n\s+-|\[.+)/m.test(fm)) {
    stats.missingSources++;
  }

  const img = (fm.match(/^image:\s*(.+)$/m)?.[1] || '').trim().replace(/^['"]|['"]$/g, '');
  if (img === '/placeholder-saint.svg' || img === '') {
    stats.placeholderImage++;
    byMissing.image.push(f);
  }
  if (/^http:\/\//i.test(img)) stats.httpImage++;
}

console.log(JSON.stringify(stats, null, 2));
console.log(`\nStub profiles (short body): ${stubs.length}`);
console.log('Gaps are listed in quality-report.json.');

fs.writeFileSync(path.join(process.cwd(), 'stubs.json'), JSON.stringify(stubs, null, 2) + '\n');
fs.writeFileSync(
  path.join(process.cwd(), 'quality-report.json'),
  JSON.stringify({ stats, stubs, byMissing }, null, 2) + '\n'
);
