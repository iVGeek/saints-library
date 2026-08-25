import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';

const dir = 'C:\\iVGeek\\communion-of-saints\\src\\content\\saints';
const targets = ['jude-thaddaeus.md', 'joseph.md', 'anthony-of-padua.md', 'francis-of-assisi.md', 'patrick-of-ireland.md'];

for (const f of targets) {
  const c = fs.readFileSync(path.join(dir, f), 'utf8');
  const m = c.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = yaml.load(m[1]);
  console.log(`${f}: name="${fm.name}" honorific="${fm.honorific}"`);
}
