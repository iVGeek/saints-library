import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';

const SAINTS_DIR = 'C:\\iVGeek\\communion-of-saints\\src\\content\\saints';

const CLOSING_PRAYER = `\n\n---\n\n**Closing Prayer**\n\nThank you for joining in this novena. May the intercession of the saints strengthen your faith and bring you closer to God. Through their prayers and example, may you find peace, hope, and grace in your daily life.\n\nGlory be to the Father, and to the Son, and to the Holy Spirit, as it was in the beginning, is now, and ever shall be, world without end. Amen.\n\nSaints of God, pray for us.`;

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  try { return yaml.load(match[1]); } catch { return null; }
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

function addDayLabelsAndClosing(text) {
  let modified = text;

  // Already has closing prayer?
  const hasClosing = /Closing Prayer|thank you for joining|Saints of God, pray/i.test(modified);

  // Already has day labels?
  const hasLabels = /\*\*Day \d/.test(modified);

  if (hasLabels && hasClosing) return modified;

  if (!hasLabels) {
    // Text uses \n\n---\n\n separators between days
    const sections = modified.split(/\n\n---\n\n/);
    if (sections.length >= 9) {
      const labeled = sections.map((section, i) => {
        if (i >= 9) return section;
        const trimmed = section.trim();
        if (!trimmed) return section;
        if (/^Day \d|^Closing|^Let us pray/i.test(trimmed)) return section;
        return `**Day ${i + 1}**\n\n${trimmed}`;
      });
      modified = labeled.join('\n\n---\n\n');
    }
  }

  if (!hasClosing) {
    modified += CLOSING_PRAYER;
  }

  return modified;
}

const files = fs.readdirSync(SAINTS_DIR).filter(f => f.endsWith('.md'));
let fixed = 0;

for (const file of files) {
  const filepath = path.join(SAINTS_DIR, file);
  const content = fs.readFileSync(filepath, 'utf8');
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) continue;
  let fm;
  try { fm = yaml.load(m[1]); } catch { continue; }
  if (!fm || !fm.prayers) continue;

  let changed = false;
  for (const prayer of fm.prayers) {
    if (!/novena/i.test(prayer.name)) continue;
    if (!prayer.text) continue;

    const newText = addDayLabelsAndClosing(prayer.text);
    if (newText !== prayer.text) {
      prayer.text = newText;
      changed = true;
    }
  }

  if (changed) {
    updateFile(filepath, fm);
    fixed++;
  }
}

console.log(`Updated ${fixed} novenas with day labels and closing prayer`);
