import fs from 'node:fs';
import path from 'node:path';
const dir = path.join(process.cwd(), 'src', 'content', 'saints');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
let changed = 0;
for (const f of files) {
  const full = path.join(dir, f);
  const raw = fs.readFileSync(full, 'utf8');
  const newRaw = raw.replace(/^stub:\s*(true|false)\r?\n/m, '');
  if (newRaw !== raw) { fs.writeFileSync(full, newRaw, 'utf8'); changed++; }
}
console.log(`Removed stub lines: ${changed}`);
