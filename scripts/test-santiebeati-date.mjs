import fs from 'node:fs';
const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';

const res = await fetch('https://www.santiebeati.it/04/23', { headers: { 'User-Agent': UA } });
const txt = await res.text();
fs.writeFileSync('C:\\iVGeek\\communion-of-saints\\scripts\\santiebeati-date-sample.html', txt);
console.log('status=' + res.status + ' len=' + txt.length);

// Find all dettaglio links with titles and names
const entries = [...txt.matchAll(/<a href="\/dettaglio\/(\d+)" title="([^"]*)"[^>]*><font size=-2>([^<]*)<\/font> <font size=-1><b>([^<]*)<\/b><\/font><\/a>/gi)]
  .slice(0, 20)
  .map(m => ({ id: m[1], title: m[2].slice(0, 60), honorific: m[3], name: m[4] }));
console.log(JSON.stringify(entries, null, 2));

// Also look for any pattern with the name
const alt = [...txt.matchAll(/<a[^>]*href="\/dettaglio\/(\d+)"[^>]*>([\s\S]*?)<\/a>/g)].slice(0, 5).map(m => ({
  id: m[1], inner: m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
}));
console.log('Alt format:', JSON.stringify(alt, null, 2));