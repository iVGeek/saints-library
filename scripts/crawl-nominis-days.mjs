import fs from 'node:fs';

const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';
const CACHE = 'C:\\iVGeek\\communion-of-saints\\scripts\\nominis-days.json';

function pad(n) { return String(n).padStart(2, '0'); }
const MONTHS = ['', 'Janvier', 'F%C3%A9vrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Ao%C3%BBt', 'Septembre', 'Octobre', 'Novembre', 'D%C3%A9cembre'];

if (fs.existsSync(CACHE)) fs.rmSync(CACHE);

let cache = {};

for (let d = 1; d <= 31; d++) {
  for (let m = 1; m <= 12; m++) {
    if ([4, 6, 9, 11].includes(m) && d > 30) continue;
    if (m === 2 && d > 29) continue;
    const key = `${pad(d)}-${pad(m)}`;
    const url = `https://nominis.cef.fr/contenus/fetes/${d}/${m}/2026/${d}-${MONTHS[m]}-2026.html`;
    let res;
    try {
      res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    } catch (e) { console.log(`${key}: ERR ${e.message}`); continue; }
    const txt = await res.text();
    const links = [...new Set([...txt.matchAll(/href="(\/contenus\/saint\/\d+\/[^"]+\.html)"/g)].map(x => x[1]))];
    cache[key] = links;
    if (links.length === 5) console.log(`${key}: ${links.length} (fallback?)`);
    await new Promise(r => setTimeout(r, 200));
  }
}

fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2));
const all = Object.values(cache).flat();
console.log('\nTotal: ' + all.length + ' entries, ' + new Set(all).size + ' unique');
const fbs = Object.entries(cache).filter(([, v]) => v.length <= 5);
console.log('days with 5 or fewer links: ' + fbs.length);
console.log(fbs.map(([k]) => k).join(', '));