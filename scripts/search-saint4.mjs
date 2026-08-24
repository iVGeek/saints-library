const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';

async function search() {
  // Get the actual saint profile page
  const saintPage = await fetch('https://catholicsaints.info/blessed-adalbert-radiouski/', { headers: { 'User-Agent': UA } });
  const saintHtml = await saintPage.text();
  
  // Look for the full profile
  if (saintHtml.includes('Premonstratensian')) {
    const idx = saintHtml.indexOf('Premonstratensian');
    console.log('Premonstratensian context:');
    console.log(saintHtml.slice(Math.max(0, idx-300), idx+500));
  }
  
  // Also check for "Wroclaw" or "Wrocław"
  const idx2 = saintHtml.indexOf('Wroclaw') >= 0 ? saintHtml.indexOf('Wroclaw') : saintHtml.indexOf('Wrocław');
  if (idx2 >= 0) {
    console.log('Wroclaw context:');
    console.log(saintHtml.slice(Math.max(0, idx2-300), idx2+500));
  }
  
  // Look for any image in the profile
  const imgMatches = saintHtml.match(/<img[^>]+src=["']([^"']+)["']/gi);
  if (imgMatches) {
    imgMatches.forEach(m => console.log('IMG:', m));
  }
  
  // Try to get the full content
  const contentIdx = saintHtml.indexOf('<div class="postentry">');
  if (contentIdx >= 0) {
    console.log('Post entry:');
    console.log(saintHtml.slice(contentIdx, contentIdx+2000));
  }
}
search();