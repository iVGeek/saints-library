import fs from 'node:fs';
const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';

async function probe(url, name) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    const txt = await res.text();
    const dets = [...new Set([...txt.matchAll(/\/dettaglio\/(\d+)/g)].map(m => m[1]))];
    console.log(`${name}: ${res.status} len=${txt.length} dettagli=${dets.length}`);
    if (dets.length > 0 && !fs.existsSync('C:\\iVGeek\\communion-of-saints\\scripts\\santiebeati-letter-sample.html')) {
      fs.writeFileSync('C:\\iVGeek\\communion-of-saints\\scripts\\santiebeati-letter-sample.html', txt);
    }
  } catch (e) { console.log(`${name}: ERR ${e.message}`); }
}

await probe('https://www.santiebeati.it/onomastico.html', 'onomastico');
await new Promise(r => setTimeout(r, 400));
await probe('https://www.santiebeati.it/A', 'letter A');
await new Promise(r => setTimeout(r, 400));
await probe('https://www.santiebeati.it/Z', 'letter Z');
await new Promise(r => setTimeout(r, 400));
await probe('https://www.santiebeati.it/sitemap.xml', 'sitemap');