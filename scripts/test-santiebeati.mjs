const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';

async function t(q) {
  const url = 'https://www.santiebeati.it/santi_search.php?query=' + encodeURIComponent(q);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    const txt = await res.text();
    const links = [...txt.matchAll(/\/dettaglio\/(\d+)/g)].slice(0, 6).map(m => m[1]);
    const imgs = [...txt.matchAll(/<img[^>]*src="([^"]*immagini[^"]*)"/gi)].slice(0, 4).map(m => m[1]);
    console.log(q + ': status=' + res.status + ' len=' + txt.length);
    console.log('  dettagli: ' + JSON.stringify(links));
    console.log('  immagini: ' + JSON.stringify(imgs));
  } catch (e) { console.log(q + ': ERR ' + e.message); }
}

(async () => {
  await t('Abundus');
  await t('Abrahamus');
  await t('Adalbert');
})();