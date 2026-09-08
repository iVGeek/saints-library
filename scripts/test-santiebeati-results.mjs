import fs from 'node:fs';
const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';

const res = await fetch('https://www.santiebeati.it/santi_search.php?query=Victor', {
  headers: { 'User-Agent': UA }
});
const txt = await res.text();
fs.writeFileSync('C:\\iVGeek\\communion-of-saints\\scripts\\santiebeati-search-sample.html', txt);

// Extract anchor + title pairs
const links = [...txt.matchAll(/<a[^>]*href="(\/dettaglio\/\d+)"[^>]*>([^<]*)<\/a>/gi)].slice(0, 20).map(m => ({ href: m[1], text: m[2].trim() }));
console.log('status=' + res.status + ' len=' + txt.length);
console.log(JSON.stringify(links, null, 2));