const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';
const saints = ['Blessed Abrahamus of Pratea', 'Blessed Abundus of Villers', 'Alessandro Dordi'];

for (const name of saints) {
  console.log(`--- Testing: ${name} ---`);
  const searches = [`${name} saint`, `${name} catholic`, `${name} blessed`];
  let found = false;
  for (const q of searches) {
    if (found) break;
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&srlimit=3`;
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      const data = await res.json();
      const results = data.query?.search || [];
      if (results.length > 0) {
        console.log(`  Search "${q}": ${results.length} results`);
        for (const r of results.slice(0, 2)) {
          const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(r.title)}&prop=pageimages&piprop=original&format=json`;
          const imgRes = await fetch(imgUrl, { headers: { 'User-Agent': UA } });
          const imgData = await imgRes.json();
          const page = Object.values(imgData.query?.pages || {})[0];
          const img = page?.original?.source;
          if (img && img.startsWith('https://upload.wikimedia.org')) {
            console.log(`  [FOUND] ${r.title} -> ${img.substring(0, 80)}...`);
            found = true;
            break;
          }
        }
      }
    } catch (e) { console.log(`  Error: ${e.message}`); }
  }
  if (!found) {
    console.log(`  [NOT FOUND]`);
    // Try Commons
    try {
      const baseName = name.replace(/^(blessed|venerable|saint)\s+/i, '').trim();
      const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`"${baseName}" portrait`)}&srnamespace=6&format=json&srlimit=3`;
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      const data = await res.json();
      const results = data.query?.search || [];
      console.log(`  Commons search: ${results.length} results`);
      for (const r of results.slice(0, 2)) {
        console.log(`    ${r.title}`);
      }
    } catch (e) { console.log(`  Commons error: ${e.message}`); }
  }
  console.log('');
}
