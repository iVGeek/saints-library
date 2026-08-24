const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';

async function search() {
  const url = 'https://catholicsaints.info/blessed-adalbert-radiouski/';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const html = await res.text();
  
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  console.log('Title:', titleMatch ? titleMatch[1] : 'none');
  
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    console.log('Img:', match[1]);
  }
  
  const idx = html.indexOf('Radiouski');
  if (idx >= 0) console.log('Found Radiouski:', html.slice(Math.max(0,idx-100), idx+100));
  
  const idx2 = html.indexOf('Adalbert');
  if (idx2 >= 0) console.log('Found Adalbert:', html.slice(Math.max(0,idx2-100), idx2+100));
  
  // Also check for Polish variant
  if (html.includes('Radzi')) console.log('Has Radzi');
}
search();