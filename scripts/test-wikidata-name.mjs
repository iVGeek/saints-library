const UA = 'CommunionOfSaintsBot/1.0 (educational; https://saints-library.onrender.com)';

// Test with different name variations
const tests = [
  'Thérèse of Lisieux',
  'Therese of Lisieux',
  'Saint Thérèse',
  'Teresa of Avila',
  'Teresa of vila',
  'Joan of Arc',
  'John Paul II',
  'Pio of Pietrelcina',
  'Padre Pio',
];

for (const name of tests) {
  const query = `SELECT ?item ?image WHERE {
    ?item rdfs:label "${name}"@en;
      wdt:P18 ?image.
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  } LIMIT 1`;
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    const data = await res.json();
    const b = data.results?.bindings || [];
    const img = b[0]?.image?.value;
    console.log(`${name}: ${b.length} results${img ? ' -> ' + img.substring(0, 60) : ''}`);
  } catch (e) { console.log(`${name}: Error ${e.message}`); }
}
