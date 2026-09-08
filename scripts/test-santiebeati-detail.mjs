import fs from 'node:fs';
const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';

const res = await fetch('https://www.santiebeati.it/dettaglio/50550', {
  headers: { 'User-Agent': UA }
});
const txt = await res.text();
fs.writeFileSync('C:\\iVGeek\\communion-of-saints\\scripts\\santiebeati-sample.html', txt);

const imgs = [...txt.matchAll(/<img[^>]*src="([^"]*)"[^>]*>/gi)].slice(0, 12).map(m => m[1]);
console.log('status=' + res.status + ' len=' + txt.length);
console.log(JSON.stringify(imgs, null, 2));

// Look for og:image
const og = [...txt.matchAll(/property="og:image" content="([^"]*)"/gi)].map(m => m[1]);
console.log('og:image = ' + JSON.stringify(og));
// Look for 'immagini' links
const imm = [...txt.matchAll(/href="([^"]*immagini[^"]*)"/gi)].slice(0, 5).map(m => m[1]);
console.log('immagini links = ' + JSON.stringify(imm));