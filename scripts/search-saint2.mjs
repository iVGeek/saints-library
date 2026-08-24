const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';

async function search() {
  // Search CatholicSaints.info for Radiouski
  const cs = await fetch('https://catholicsaints.info/?s=Radiouski', { headers: { 'User-Agent': UA } });
  const html = await cs.text();
  console.log('Radiouski search length:', html.length);
  
  // Extract saint names
  const nameMatches = html.match(/<h2[^>]*class="entry-title"[^>]*>(.*?)<\/h2>/gi);
  if (nameMatches) {
    nameMatches.forEach(m => console.log('Saint:', m.replace(/<[^>]+>/g, '')));
  }
  
  // Also search for Radziński
  const cs2 = await fetch('https://catholicsaints.info/?s=Radzi%C5%84ski', { headers: { 'User-Agent': UA } });
  const html2 = await cs2.text();
  console.log('Radzinski search length:', html2.length);
  
  const nameMatches2 = html2.match(/<h2[^>]*class="entry-title"[^>]*>(.*?)<\/h2>/gi);
  if (nameMatches2) {
    nameMatches2.forEach(m => console.log('Saint:', m.replace(/<[^>]+>/g, '')));
  }
}
search();