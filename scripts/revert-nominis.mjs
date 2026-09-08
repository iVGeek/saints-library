import fs from 'node:fs';

const PROGRESS = JSON.parse(fs.readFileSync('C:\\iVGeek\\communion-of-saints\\scripts\\nominis-progress.json', 'utf8'));
const SAINTS_DIR = 'C:\\iVGeek\\communion-of-saints\\src\\content\\saints';
const BAD = new Set(['https://nominis.cef.fr/images/gallerie/covid150.jpg', 'https://nominis.cef.fr/images/gallerie/soutienetudiantsirak.jpg']);

let reverted = 0;
for (const f of PROGRESS.updated) {
  const fp = SAINTS_DIR + '\\' + f;
  let c;
  try { c = fs.readFileSync(fp, 'utf8'); } catch { continue; }
  const m = c.match(/^image:\s*(.*)$/m);
  if (m && BAD.has(m[1].trim())) {
    const cleaned = c
      .replace(/^image:\s*.*$/m, 'image: /placeholder-saint.svg')
      .replace(/^imageAlt:.*$/m, '')
      .replace(/^imageCredit:.*$/m, '')
      .replace(/^imageCreditUrl:.*$/m, '')
      .replace(/\n{3,}/g, '\n\n');
    fs.writeFileSync(fp, cleaned);
    reverted++;
  }
}
console.log('reverted: ' + reverted);
// also count how many keep real images
let keep = 0;
for (const f of PROGRESS.updated) {
  const fp = SAINTS_DIR + '\\' + f;
  let c;
  try { c = fs.readFileSync(fp, 'utf8'); } catch { continue; }
  const m = c.match(/^image:\s*(.*)$/m);
  if (m && !BAD.has(m[1].trim()) && m[1].includes('nominis')) keep++;
}
console.log('kept real nominis images: ' + keep);