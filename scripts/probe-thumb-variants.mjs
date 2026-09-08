import fs from 'node:fs';
const progress = JSON.parse(fs.readFileSync('C:\\iVGeek\\communion-of-saints\\scripts\\santiebeati-progress.json', 'utf8'));
const matches = JSON.parse(fs.readFileSync('C:\\iVGeek\\communion-of-saints\\scripts\\santiebeati-matches.json', 'utf8'));
const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';

const gone = new Set(progress.gone);
const failed = matches.filter(m => gone.has(m.file)).slice(0, 10);
for (const f of failed) {
  const id = f.best[0].id;
  console.log(`\n${f.name} (id ${id}):`);
  for (const suffix of ['.JPG', '.jpg', 'A.JPG', 'AA.JPG', 'B.JPG']) {
    const url = `https://www.santiebeati.it/immagini/Thumbs/${id}/${id}${suffix}`;
    try {
      const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA } });
      console.log(`  ${suffix}: ${res.status} ${res.headers.get('content-type')}`);
    } catch (e) { console.log(`  ${suffix}: ERR`); }
  }
}