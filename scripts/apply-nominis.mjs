import fs from 'node:fs';

const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';
const MATCHES = JSON.parse(fs.readFileSync('C:\\iVGeek\\communion-of-saints\\scripts\\nominis-matches.json', 'utf8'));
const SAINTS_DIR = 'C:\\iVGeek\\communion-of-saints\\src\\content\\saints';
const PROGRESS = 'C:\\iVGeek\\communion-of-saints\\scripts\\nominis-progress2.json';
const CACHE = 'C:\\iVGeek\\communion-of-saints\\scripts\\nominis-portraits.json';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

let cache = {};
if (fs.existsSync(CACHE)) cache = JSON.parse(fs.readFileSync(CACHE, 'utf8'));

async function getPortrait(url) {
  if (cache[url] !== undefined) return cache[url];
  let img = null;
  for (let tries = 0; tries < 3; tries++) {
    try {
      const res = await fetch('https://nominis.cef.fr' + url, { headers: { 'User-Agent': UA } });
      const txt = await res.text();
      // Portrait: <img ... class="img-thumbnail" ... src="/images/gallerie/X.jpg">
      const m = txt.match(/<img[^>]*class="img-thumbnail"[^>]*src="(\/images\/gallerie\/[^"]+\.(?:jpg|jpeg|png))"/i)
             || txt.match(/<img[^>]*src="(\/images\/gallerie\/[^"]+\.(?:jpg|jpeg|png))"[^>]*class="img-thumbnail"/i);
      if (m) img = 'https://nominis.cef.fr' + m[1];
      break;
    } catch { await sleep(1500); }
  }
  cache[url] = img;
  return img;
}

async function headOK(url) {
  for (let tries = 0; tries < 3; tries++) {
    try {
      const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA }, redirect: 'follow' });
      if (res.ok) return true;
    } catch {}
    await sleep(1000);
  }
  return false;
}

let progress = { updated: [], skipped: [] };
if (fs.existsSync(PROGRESS)) progress = JSON.parse(fs.readFileSync(PROGRESS, 'utf8'));
const done = new Set([...progress.updated, ...progress.skipped]);

let ok = 0, noImg = 0;
for (const m of MATCHES) {
  if (done.has(m.file)) continue;
  const fp = SAINTS_DIR + '\\' + m.file;
  let content;
  try { content = fs.readFileSync(fp, 'utf8'); } catch { continue; }
  if (!/image:\s*\/placeholder-saint\.svg/.test(content)) { progress.skipped.push(m.file); continue; }

  const img = await getPortrait(m.url);
  await sleep(120);

  if (!img || !(await headOK(img))) {
    noImg++;
    progress.skipped.push(m.file);
    console.log(`no-portrait| ${m.name} -> ${img || 'none'}`);
  } else {
    const alt = `Artistic portrait of ${m.name}`;
    const final = content
      .replace(/image:\s*\/placeholder-saint\.svg/, `image: ${img}`)
      .replace(/^imageAlt:.*$/m, `imageAlt: "${alt.replace(/"/g, '\\"')}"`)
      .replace(/^imageCredit:.*$/m, 'imageCredit: Nominis (French Episcopal Conference)')
      .replace(/^imageCreditUrl:.*$/m, 'imageCreditUrl: https://nominis.cef.fr');
    // if there was no imageAlt/credit line, insert after image line
    if (!/imageAlt:/.test(final)) {
      const lines = final.split('\n');
      const idx = lines.findIndex(l => /^image:/.test(l));
      lines.splice(idx + 1, 0, `imageAlt: "${alt.replace(/"/g, '\\"')}"`, 'imageCredit: Nominis (French Episcopal Conference)', 'imageCreditUrl: https://nominis.cef.fr');
      fs.writeFileSync(fp, lines.join('\n'));
    } else {
      fs.writeFileSync(fp, final);
    }
    progress.updated.push(m.file);
    ok++;
    console.log(`OK| ${m.name} -> ${img}`);
  }
  fs.writeFileSync(PROGRESS, JSON.stringify(progress));
  fs.writeFileSync(CACHE, JSON.stringify(cache));
  await sleep(180);
}

fs.writeFileSync(PROGRESS, JSON.stringify(progress));
fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2));
console.log(`\nDone: ${ok} portrait images applied, ${noImg} had none`);