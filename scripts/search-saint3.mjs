const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';

async function search() {
  const cs = await fetch('https://catholicsaints.info/?s=Radiouski', { headers: { 'User-Agent': UA } });
  const html = await cs.text();
  
  // Look for the content
  if (html.includes('Radiouski') || html.includes('radiouski')) {
    const idx = html.indexOf('Radiouski');
    console.log('Found at:', idx);
    console.log(html.slice(Math.max(0, idx-200), idx+200));
  }
  
  // Search for "Adalbert" in results
  const idx2 = html.indexOf('Adalbert');
  if (idx2 >= 0) {
    console.log('Adalbert at:', idx2);
    console.log(html.slice(Math.max(0, idx2-200), idx2+200));
  }
  
  // Try the actual saint page
  const saintPage = await fetch('https://catholicsaints.info/blessed-adalbert-radiouski/', { headers: { 'User-Agent': UA } });
  const saintHtml = await saintPage.text();
  
  // Look for any image
  if (saintHtml.includes('<img')) {
    const imgMatches = saintHtml.match(/<img[^>]+src=["']([^"']+)["']/gi);
    if (imgMatches) imgMatches.forEach(m => console.log('IMG:', m));
  }
  
  // Look for the actual name in the content
  if (saintHtml.includes('Premonstratensian')) {
    const idx = saintHtml.indexOf('Premonstratensian');
    console.log('Premonstratensian at:', idx);
    console.log(saintHtml.slice(Math.max(0, idx-200), idx+200));
  }
}
search();