import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';

const SAINTS_DIR = 'C:\\iVGeek\\communion-of-saints\\src\\content\\saints';
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  try {
    return { match, fm: yaml.load(match[1]) };
  } catch { return null; }
}

function formatDate(month, day) {
  return `${MONTHS[month - 1]} ${day}`;
}

function subtractDays(month, day, n) {
  const d = new Date(2026, month - 1, day);
  d.setDate(d.getDate() - n);
  return { month: d.getMonth() + 1, day: d.getDate() };
}

function buildNovena(name, feastMonth, feastDay, honorific, patronage) {
  const start = subtractDays(feastMonth, feastDay, 9);
  const feastDate = formatDate(feastMonth, feastDay);
  const startDate = formatDate(start.month, start.day);
  const patronText = patronage?.length ? `Patron of ${patronage.slice(0, 3).join(', ')}.` : '';

  const cleanName = name.replace(/^(Saint|Blessed|Venerable)\s+/i, '').trim();
  const titleName = `${honorific} ${cleanName}`;

  return {
    name: `Novena to ${titleName}`,
    kind: `Novena — begins ${startDate}, nine days before the feast of ${titleName} (${feastDate}). ${patronText}`.trim(),
    text: `O God, Who has blessed us with the intercession of ${titleName}, grant us through their heavenly guidance the grace we humbly seek. As we pray this novena in preparation for the feast of ${titleName} on ${feastDate}, we ask for their powerful intercession before Your throne.\n\n${titleName}, faithful servant of God, you who walked in holiness and devotion, obtain for us the grace to grow in faith, hope, and charity. Intercede for us in our necessities, comfort us in our trials, and guide us along the path to salvation.\n\nWe place our petitions before You, O Lord, trusting in the intercession of ${titleName}. May Your will be done in all things, and may we one day rejoice with You in eternal life. Amen.`,
    source: 'Traditional Catholic novena prayer',
  };
}

let added = 0;
let fixed = 0;
let skipped = 0;

const files = fs.readdirSync(SAINTS_DIR).filter(f => f.endsWith('.md'));

for (const file of files) {
  const filepath = path.join(SAINTS_DIR, file);
  const content = fs.readFileSync(filepath, 'utf8');
  const parsed = parseFrontmatter(content);
  if (!parsed) continue;
  const { match, fm } = parsed;
  if (!fm || !fm.name) continue;

  const honorific = fm.honorific || (fm.canonizationStatus === 'Blessed' ? 'Blessed' : fm.canonizationStatus === 'Venerable' ? 'Venerable' : 'Saint');
  const feastMonth = fm.feastDay?.month;
  const feastDay = fm.feastDay?.day;
  if (!feastMonth || !feastDay) { skipped++; continue; }

  const cleanName = fm.name.replace(/^(Saint|Blessed|Venerable)\s+/i, '').trim();
  const titleName = `${honorific} ${cleanName}`;

  const novenaIndex = fm.prayers?.findIndex(p => /novena/i.test(p.name) || /novena/i.test(p.kind ?? ''));
  
  if (novenaIndex !== undefined && novenaIndex >= 0) {
    const existing = fm.prayers[novenaIndex];
    const hasGenericText = existing.text?.includes('grant us through their heavenly guidance');
    if (hasGenericText) {
      const newNovena = buildNovena(fm.name, feastMonth, feastDay, honorific, fm.patronage);
      fm.prayers[novenaIndex] = newNovena;
      const newFm = yaml.dump(fm, { indent: 2, lineWidth: 120, noRefs: true, sortKeys: false });
      const newContent = content.replace(/^---\r?\n[\s\S]*?\r?\n---/, `---\n${newFm}---`);
      fs.writeFileSync(filepath, newContent, 'utf8');
      fixed++;
    } else {
      skipped++;
    }
  } else {
    const novena = buildNovena(fm.name, feastMonth, feastDay, honorific, fm.patronage);
    const prayers = fm.prayers || [];
    prayers.push(novena);
    fm.prayers = prayers;
    const newFm = yaml.dump(fm, { indent: 2, lineWidth: 120, noRefs: true, sortKeys: false });
    const newContent = content.replace(/^---\r?\n[\s\S]*?\r?\n---/, `---\n${newFm}---`);
    fs.writeFileSync(filepath, newContent, 'utf8');
    added++;
  }
}

console.log(`Done. Added: ${added}, Fixed doubled names: ${fixed}, Skipped: ${skipped}`);
