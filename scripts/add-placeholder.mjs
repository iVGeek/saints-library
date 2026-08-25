import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';

const SAINTS_DIR = 'C:\\iVGeek\\communion-of-saints\\src\\content\\saints';
const PLACEHOLDER = '/placeholder-saint.svg';

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  try {
    return { match, fm: yaml.load(match[1]) };
  } catch {
    return null;
  }
}

let updated = 0;
let skipped = 0;

const files = fs.readdirSync(SAINTS_DIR).filter(f => f.endsWith('.md'));

for (const file of files) {
  const filepath = path.join(SAINTS_DIR, file);
  const content = fs.readFileSync(filepath, 'utf8');
  const parsed = parseFrontmatter(content);
  if (!parsed) continue;
  const { match, fm } = parsed;
  if (!fm || !fm.name) continue;

  if (fm.image) {
    skipped++;
    continue;
  }

  // Add image field after the first field (name)
  const newContent = content.replace(
    /^---\r?\n/,
    `---\nimage: ${PLACEHOLDER}\n`
  );
  fs.writeFileSync(filepath, newContent, 'utf8');
  updated++;
}

console.log(`Done. Updated: ${updated}, Already had image: ${skipped}`);
