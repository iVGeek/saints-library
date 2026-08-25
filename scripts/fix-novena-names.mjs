import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';

const SAINTS_DIR = 'C:\\iVGeek\\communion-of-saints\\src\\content\\saints';

// Real novena metadata
const NOVENA_META = {
  'jude-thaddaeus.md': { feastDate: 'October 28', start: 'October 19', source: 'https://covenantcatholic.org/novenas/st-jude-novena/' },
  'therese-of-lisieux.md': { feastDate: 'October 1', start: 'September 22', source: 'https://littleway.app/blog/novena-to-st-therese-of-lisieux' },
  'joseph.md': { feastDate: 'March 19', start: 'March 10', source: 'https://catholicmasstimes.com/novena-to-st-joseph-9-days-of-prayer/' },
  'anthony-of-padua.md': { feastDate: 'June 13', start: 'June 4', source: 'https://covenantcatholic.org/novenas/st-anthony-novena/' },
  'gerard-majella.md': { feastDate: 'October 16', start: 'October 7', source: 'https://covenantcatholic.org/novenas/st-gerard-novena/' },
  'michael-the-archangel.md': { feastDate: 'September 29', start: 'September 20', source: 'https://covenantcatholic.org/novenas/st-michael-novena/' },
  'padre-pio.md': { feastDate: 'September 23', start: 'September 14', source: 'https://covenantcatholic.org/novenas/padre-pio-novena/' },
  'rita-of-cascia.md': { feastDate: 'May 22', start: 'May 13', source: 'https://covenantcatholic.org/novenas/st-rita-novena/' },
  'francis-of-assisi.md': { feastDate: 'October 4', start: 'September 25', source: 'https://www.catholicculture.org/culture/liturgicalyear/prayers/view.cfm?id=1039' },
  'catherine-of-siena.md': { feastDate: 'April 29', start: 'April 20', source: 'https://www.catholicculture.org/culture/liturgicalyear/prayers/view.cfm?id=1039' },
  'teresa-of-avila.md': { feastDate: 'October 15', start: 'October 6', source: 'https://www.catholicculture.org/culture/liturgicalyear/prayers/view.cfm?id=1039' },
  'patrick-of-ireland.md': { feastDate: 'March 17', start: 'March 8', source: 'https://www.catholicculture.org/culture/liturgicalyear/prayers/view.cfm?id=1039' },
  'benedict-of-nursia.md': { feastDate: 'July 11', start: 'July 2', source: 'https://www.catholicculture.org/culture/liturgicalyear/prayers/view.cfm?id=1039' },
  'anne.md': { feastDate: 'July 26', start: 'July 17', source: 'https://covenantcatholic.org/novenas/st-anne-novena/' },
  'monica.md': { feastDate: 'August 27', start: 'August 18', source: 'https://www.catholicculture.org/culture/liturgicalyear/prayers/view.cfm?id=1039' },
  'augustine-of-hippo.md': { feastDate: 'August 28', start: 'August 19', source: 'https://www.catholicculture.org/culture/liturgicalyear/prayers/view.cfm?id=1039' },
  'faustina-kowalska.md': { feastDate: 'Divine Mercy Sunday', start: 'Good Friday', source: 'https://covenantcatholic.org/novenas/divine-mercy-novena/' },
};

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

  const novenaIdx = fm.prayers.findIndex(p => /novena/i.test(p.name));
  if (novenaIdx === -1) continue;

  const honorific = fm.honorific || 'Saint';
  const fullName = `${honorific} ${fm.name}`;
  const meta = NOVENA_META[file];

  const novena = fm.prayers[novenaIdx];
  // Fix name
  novena.name = `Novena to ${fullName}`;
  // Fix kind with real dates if we have metadata
  if (meta) {
    novena.kind = `Novena — begins ${meta.start}, nine days before the feast of ${fullName} (${meta.feastDate}). Source: ${meta.source}`;
    novena.source = meta.source;
  }

  const newFm = yaml.dump(fm, { indent: 2, lineWidth: 120, noRefs: true, sortKeys: false });
  const newContent = content.replace(/^---\r?\n[\s\S]*?\r?\n---/, `---\n${newFm}---`);
  fs.writeFileSync(filepath, newContent, 'utf8');
  fixed++;
}

console.log(`Fixed ${fixed} novena entries`);
