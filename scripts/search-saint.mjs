const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';

async function search() {
  const search = await fetch('https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=Premonstratensian+martyr+Wroclaw&format=json&srlimit=5', { headers: { 'User-Agent': UA } });
  const result = await search.json();
  console.log('Wiki:', JSON.stringify(result.query.search.map(x => x.title)));
  
  const cs = await fetch('https://catholicsaints.info/?s=Premonstratensian+Wroclaw', { headers: { 'User-Agent': UA } });
  const html = await cs.text();
  console.log('CatholicSaints length:', html.length);
  
  const nameMatches = html.match(/<h2[^>]*class="entry-title"[^>]*>(.*?)<\/h2>/gi);
  if (nameMatches) {
    nameMatches.forEach(m => console.log('Saint:', m.replace(/<[^>]+>/g, '')));
  }
}
search();