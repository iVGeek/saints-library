const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';

async function search() {
  const res = await fetch('http://www.katolsk.no/biografier/historisk/adalradi', { headers: { 'User-Agent': UA } });
  const html = await res.text();
  console.log('Norwegian site length:', html.length);
  
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  console.log('Title:', titleMatch ? titleMatch[1] : 'none');
  
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    console.log('IMG:', match[1]);
  }
  
  if (html.includes('Adalbert')) {
    const idx = html.indexOf('Adalbert');
    console.log('Adalbert at:', idx);
    console.log(html.slice(Math.max(0,idx-200), idx+500));
  }
  
  const listRes = await fetch('https://en.wikipedia.org/wiki/List_of_Polish_Catholic_saints', { headers: { 'User-Agent': UA } });
  const listHtml = await listRes.text();
  if (listHtml.includes('Radiouski') || listHtml.includes('Radzi') || listHtml.includes('Adalbert')) {
    const idx = listHtml.indexOf('Radiouski') >= 0 ? listHtml.indexOf('Radiouski') : listHtml.indexOf('Adalbert');
    if (idx >= 0) console.log('Found at:', idx, listHtml.slice(Math.max(0,idx-200), idx+200));
  }
}
search();