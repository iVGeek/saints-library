const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';

async function t(q) {
  const url = 'https://www.santiebeati.it/santi_search.php?query=' + encodeURIComponent(q);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    const txt = await res.text();
    const links = [...new Set([...txt.matchAll(/\/dettaglio\/(\d+)/g)].map(m => m[1]))].slice(0, 5);
    console.log(`${q}: status=${res.status} len=${txt.length} ids=${JSON.stringify(links)}`);
  } catch (e) { console.log(q + ': ERR ' + e.message); }
}

const names = [
  'Abundus', 'Abrahamus', 'Adalbert', 'Alanus', 'Alexander', 'Alexius',
  'Amadeus', 'Andronicus', 'Anysius', 'Apelles', 'Arcadius', 'Aspasius',
  'Aurelius', 'Baldred', 'Bassus', 'Cassian', 'Castorinus', 'Colette',
  'Damian', 'Dominic', 'Felix', 'Germaine', 'Hadrian', 'Irenaeus',
  'Modestus', 'Monica', 'Odo', 'Pior', 'Quintus', 'Susanna', 'Tanca',
  'Theodore', 'Victor', 'Zeno',
];

for (const n of names) {
  await t(n);
  await new Promise(r => setTimeout(r, 400));
}