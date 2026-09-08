import fs from 'node:fs';

const DAYS = JSON.parse(fs.readFileSync('C:\\iVGeek\\communion-of-saints\\scripts\\nominis-days.json', 'utf8'));
const SAINTS_DIR = 'C:\\iVGeek\\communion-of-saints\\src\\content\\saints';
const OUT = 'C:\\iVGeek\\communion-of-saints\\scripts\\nominis-matches.json';

// Derived saint name from URL slug: "/contenus/saint/1818/Bienheureux-Alain-de-la-Roche.html"
function slugName(url) {
  const slug = url.split('/').pop().replace(/\.html$/, '');
  try { return decodeURIComponent(slug).replace(/\+/g, ' ').replace(/--/g, ', ').replace(/-/g, ' '); } catch { return slug.replace(/\+/g, ' ').replace(/--/g, ', ').replace(/-/g, ' '); }
}

const FR_HONORIFICS = [
  'bienheureux', 'bienheureuse', 'saint', 'sainte', 'venerable', 'vénérable', 'serviteur de dieu', 'servante de dieu',
  'bienheureuses', 'bienheureux et', 'saints et', 'saintes', 'ss ', 'st '
];

function normalizeName(name) {
  let n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const h of FR_HONORIFICS) {
    n = n.replace(new RegExp(`^${h}[\\s]+`), '');
  }
  return n.trim();
}

function tokens(n) { return n.split(/\s+/).filter(Boolean); }

const STOPWORDS = new Set(['of', 'the', 'de', 'del', 'des', 'da', 'di', 'du', 'della', 'dello', 'les', 'la', 'le', 'et', 'saint', 'sainte', 'saints', 'bienheureux', 'bienheureuse', 'venerable', 'notre', 'dame', 'auf', 'zu', 'von', 'deo', 'ihr', 'and']);

function normToks(toks) {
  return toks
    .map(t => t.replace(/^d'/, '').replace(/^l'/, ''))
    .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

function dice(a, b) {
  const A = new Set(a), B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return 2 * inter / (A.size + B.size);
}

function field(content, key) {
  const m = content.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  if (!m) return null;
  return m[1].replace(/^["']|["']$/g, '').trim();
}

// GIVEN name equivalence pairs (first tokens between languages)
const GIVEN_EQUIVS = {
  jean: ['john', 'juan', 'giovanni', 'jan', 'johannes', 'ioannes', 'hans', 'schmitt'],
  jacques: ['james', 'jameses', 'gobain', 'jago', 'jaime'],
  jose: ['joseph', 'giuseppe', 'josef', 'yosef', 'ioseph'],
  pierre: ['peter', 'pietro', 'petrus', 'pedro', 'peeter'],
  andrew: ['andre', 'andres', 'andrea', 'andrue'],
  andre: ['andrew', 'andres', 'andrea', 'andrue'],
  francois: ['francis', 'francesco', 'francisco'],
  jeanne: ['joan', 'jane', 'joanna', 'giovanna'],
  charles: ['carlo', 'charles', 'carlos', 'karl'],
  marie: ['mary', 'maria', 'mari'],
  anne: ['anna', 'ann', 'hannah'],
  michel: ['michael', 'michele', 'miguel', 'michael'],
  leon: ['leo', 'leonard', 'leonardo'],
  paul: ['paolo', 'pablo', 'paul', 'pavel'],
  bernard: ['bernardo', 'bernhard', 'bernard'],
  jacob: ['james', 'grimoald'],
  teresa: ['theresa', 'teresa', 'tereza'],
  luis: ['louis', 'luigi', 'alojzy'],
  louis: ['luis', 'luigi', 'alojzy', 'lewis'],
  vincent: ['vicente', 'vincenzo', 'vincens'],
  antoine: ['anthony', 'antonio', 'antonin'],
  antony: ['anthony', 'antonio', 'antonin'],
  martin: ['martin', 'martinho'],
  marc: ['mark', 'marco', 'marcien'],
  simon: ['simone', 'syneon'],
  francis: ['francois', 'francesco', 'francisco', 'frank'],
  benjamin: ['benjamen'],
  claude: ['claudius', 'claude'],
  jacomo: ['james'],
  guillaume: ['william', 'wilhelm', 'guillelmo', 'guglielmo'],
  william: ['guillaume', 'wilhelm', 'guglielmo'],
  gui: ['guy', 'guido'],
  guy: ['gui', 'guido'],
  henri: ['henry', 'heinrich', 'enrique'],
  henry: ['henri', 'heinrich', 'enrique'],
  augustin: ['augustine', 'augustinus'],
  augustine: ['augustin', 'augustinus'],
  jeanbaptiste: ['johnbaptist', 'giovannibattista'],
  mathieu: ['matthew', 'matteo', 'mateo'],
  matthew: ['mathieu', 'matteo', 'mateo'],
  hugues: ['hugo', 'hugh', 'ugone'],
  jude: ['judas'],
  rayne: ['rhein', 'reina'],
  edmund: ['edmond', 'edme'],
  edmond: ['edmund', 'edme'],
  antoninus: ['antoninum', 'antoninus'],
  trefina: ['tremeur'],
  thomas: ['tomas', 'tommaso', 'tommase'],
  blaise: ['blasius'],
  christopher: ['christophorus', 'cristoforo'],
  morfudd: ['morfydd'],
  archangel: ['archangelo'],
  gabriel: ['gabriele', 'gabrielle'],
  raphael: ['rafael'],
  michael: ['michel', 'miguel', 'michele', 'yves'],
  yves: ['ivon', 'ivo', 'yvo'],
  ivo: ['yves', 'ivon'],
  columba: ['colomban', 'colm'],
  colomba: ['columba'],
  majolus: ['mayeul'],
  mayeul: ['majolus'],
  minor: ['meinrad'],
  oswald: ['oswald', 'ansbald'],
};

// check equivalence of first given tokens
function givenMatch(our, their) {
  const o = our[0] || '';
  const t = their[0] || '';
  if (o === t) return true;
  const eq = GIVEN_EQUIVS[o] || [];
  return eq.includes(t) || (GIVEN_EQUIVS[t] || []).includes(o);
}

const files = fs.readdirSync(SAINTS_DIR).filter(f => f.endsWith('.md'));
const placeholders = [];
for (const f of files) {
  const c = fs.readFileSync(SAINTS_DIR + '\\' + f, 'utf8');
  if (!/image:\s*\/placeholder-saint\.svg/.test(c)) continue;
  const name = field(c, 'name');
  const mMonth = c.match(/feastDay:\s*\n\s*month:\s*(\d+)/);
  const mDay = c.match(/feastDay:\s*\n\s*month:\s*\d+\s*\n\s*day:\s*(\d+)/);
  if (!mMonth || !mDay) continue;
  placeholders.push({ file: f, name, date: `${String(+mDay[1]).padStart(2, '0')}-${String(+mMonth[1]).padStart(2, '0')}` });
}
console.log('placeholders with feastDay: ' + placeholders.length);

// Build nominis index: date -> [{url, name, tokens}]
const nomIndex = {};
for (const [date, urls] of Object.entries(DAYS)) {
  for (const url of urls) {
    const name = slugName(url);
    const nt = normalizeName(name);
    const toks = tokens(nt);
    if (!nomIndex[date]) nomIndex[date] = [];
    nomIndex[date].push({ url, name, toks });
  }
}

// match
const matches = [];
for (const p of placeholders) {
  const candidates = nomIndex[p.date] || [];
  if (!candidates.length) continue;
  const ourName = normalizeName(p.name);
  const ourToks = tokens(ourName);

  let best = null;
  for (const cand of candidates) {
    // first-token given name match
    if (!givenMatch(ourToks, cand.toks)) continue;
    const d = dice(normToks(ourToks), normToks(cand.toks));
    if (d >= 0.6) {
      if (!best || d > best.score) best = { ...cand, score: d };
    }
  }
  if (best) {
    matches.push({ ...p, url: best.url, score: best.score, nominisName: best.name });
  }
}

console.log('matches: ' + matches.length);
fs.writeFileSync(OUT, JSON.stringify(matches, null, 2));
// show a sample
for (const m of matches.slice(0, 40)) console.log(`${m.name}  [${m.date}]  ->  ${m.nominisName}  (d=${m.score.toFixed(2)})`);