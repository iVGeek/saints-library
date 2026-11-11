import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'src', 'content', 'saints');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));

let changed = 0, stubs = 0;
for (const f of files) {
  const full = path.join(dir, f);
  const raw = fs.readFileSync(full, 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) continue;
  const body = raw.slice(m[0].length).trim();
  const isStub = body.length < 80;

  const fm = m[1];
  let newFm = fm;
  if (/^stub:\s*/m.test(newFm)) {
    newFm = newFm.replace(/^stub:\s*.*/m, `stub: ${isStub}`);
  } else {
    newFm = newFm.replace(/^(name:\s*.*)$/m, `$1\nstub: ${isStub}`);
  }
  if (newFm === fm) continue;
  const newRaw = raw.replace(fm, newFm);
  fs.writeFileSync(full, newRaw, 'utf8');
  changed++;
  if (isStub) stubs++;
}
console.log(`Updated ${changed} files; ${stubs} marked as stubs.`);