import fs from 'node:fs';
const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';

const res = await fetch('https://www.santiebeati.it/onomastico.html', {
  headers: { 'User-Agent': UA }
});
const txt = await res.text();
fs.writeFileSync('C:\\iVGeek\\communion-of-saints\\scripts\\santiebeati-onomastico.html', txt);
console.log('status=' + res.status + ' len=' + txt.length);
// find links to letter pages
const links = [...new Set([...txt.matchAll(/href="([^"]*)"[^>]*>/g)].map(m => m[1]))].filter(u => /^\/([A-Z]|LU|A\/)/.test(u) || u.includes('onomastico') || u.includes('LETTERE'));
console.log(JSON.stringify(links.slice(0, 60), null, 2));