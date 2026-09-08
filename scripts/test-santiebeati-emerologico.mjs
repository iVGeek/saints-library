const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';

async function probe(url, name) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    const txt = await res.text();
    const dets = [...new Set([...txt.matchAll(/\(id (\d+) - ord (\d)\)/g)].map(m => m[1]))];
    const imgs = [...new Set([...txt.matchAll(/\/immagini\/Thumbs\/(\d+)/g)].map(m => m[1]))];
    console.log(`${name}: status=${res.status} len=${txt.length} dettagli=${dets.length} thumbImgs=${imgs.length}`);
  } catch (e) { console.log(`${name}: ERR ${e.message}`); }
}

await probe('https://www.santiebeati.it/emerologico.html', 'emerologico index');
await new Promise(r => setTimeout(r, 300));
await probe('https://www.santiebeati.it/01/01', 'jan 1');
await new Promise(r => setTimeout(r, 300));
await probe('https://www.santiebeati.it/04/23', 'apr 23 (Adalberto feast)');