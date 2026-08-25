import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';

const SAINTS_DIR = 'C:\\iVGeek\\communion-of-saints\\src\\content\\saints';
const NOVENAS_JSON = 'C:\\iVGeek\\catholic_novenas.json';

const data = JSON.parse(fs.readFileSync(NOVENAS_JSON, 'utf8'));

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  try {
    return { match, fm: yaml.load(match[1]) };
  } catch { return null; }
}

function serializeFrontmatter(fm) {
  return yaml.dump(fm, { indent: 2, lineWidth: 120, noRefs: true, sortKeys: false });
}

function updateFile(filepath, fm) {
  const content = fs.readFileSync(filepath, 'utf8');
  const newFm = serializeFrontmatter(fm);
  const newContent = content.replace(/^---\r?\n[\s\S]*?\r?\n---/, `---\n${newFm}---`);
  fs.writeFileSync(filepath, newContent, 'utf8');
}

// Build a lookup of all saint files by name (lowercase, stripped)
const files = fs.readdirSync(SAINTS_DIR).filter(f => f.endsWith('.md'));
const fileByName = new Map();
for (const file of files) {
  const content = fs.readFileSync(path.join(SAINTS_DIR, file), 'utf8');
  const parsed = parseFrontmatter(content);
  if (!parsed) continue;
  const { fm } = parsed;
  if (!fm || !fm.name) continue;
  const key = fm.name.toLowerCase().replace(/^(saint|blessed|venerable)\s+/i, '').trim();
  fileByName.set(key, { file, fm });
}

let updated = 0;
let notFound = [];

for (const novena of data.novenas) {
  const saintKey = novena.saint_name
    .toLowerCase()
    .replace(/^(saint|st\.?)\s+/i, '')
    .replace(/\s*\(.*\)/, '')
    .trim();

  const match = fileByName.get(saintKey);

  if (!match) {
    // Try partial match
    let found = false;
    for (const [key, val] of fileByName) {
      if (key.includes(saintKey) || saintKey.includes(key)) {
        matchFile(val);
        found = true;
        break;
      }
    }
    if (!found) {
      notFound.push(novena.saint_name);
      continue;
    }
  } else {
    matchFile(match);
  }

  function matchFile({ file, fm }) {
    // Remove any existing generic novena
    fm.prayers = (fm.prayers || []).filter(p => 
      !(/novena/i.test(p.name) && /grant us through their heavenly guidance/.test(p.text))
    );

    // Build the real novena text
    const openingParts = [];
    if (novena.opening_prayer) openingParts.push(novena.opening_prayer);
    if (novena.initial_prayer) openingParts.push(novena.initial_prayer);

    const dayTexts = novena.days.map(d => {
      let prefix = '';
      if (d.theme) prefix = `**Day ${d.day_number} — ${d.theme}**\n\n`;
      return `${prefix}${d.text}`;
    }).join('\n\n---\n\n');

    const closingParts = [];
    if (novena.closing_prayer) closingParts.push(novena.closing_prayer);
    if (novena.concluding_prayer) closingParts.push(novena.concluding_prayer);
    if (novena.closing_prayers?.length) closingParts.push(novena.closing_prayers.join('\n\n'));

    let fullText = '';
    if (openingParts.length) fullText += openingParts.join('\n\n') + '\n\n---\n\n';
    fullText += dayTexts;
    if (closingParts.length) fullText += '\n\n---\n\n' + closingParts.join('\n\n');

    const novenaEntry = {
      name: `Novena to ${fm.name}`,
      kind: `Novena — ${novena.novena_start_date}, nine days before the feast of ${fm.name} (${novena.feast_date}). Source: ${novena.source_url}`,
      text: fullText,
      source: novena.source_url,
    };

    // Remove existing novena with same name pattern and add the real one
    fm.prayers = (fm.prayers || []).filter(p => !(/novena/i.test(p.name)));
    fm.prayers.push(novenaEntry);

    const filepath = path.join(SAINTS_DIR, file);
    updateFile(filepath, fm);
    updated++;
  }
}

console.log(`Updated: ${updated} saints with real novenas`);
if (notFound.length) console.log(`Not found: ${notFound.join(', ')}`);
