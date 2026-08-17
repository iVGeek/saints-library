/**
 * CURATED PATRONAGE VOCABULARY
 * The "Patronage Explorer" maps a natural-language query ("who is the patron
 * saint of lost things?") to a canonical patronage key via synonyms, then
 * returns saints whose `patronage` array contains that key.
 *
 * When adding saints, use the canonical keys below so the explorer works.
 * You may add new keys freely — keep the key lowercase-hyphenated.
 */
export interface PatronageCategory {
  key: string;
  label: string;
  aliases: string[];
  description?: string;
}

export const PATRONAGE_CATEGORIES: PatronageCategory[] = [
  { key: 'animals', label: 'Animals & Creation', aliases: ['animals', 'animal', 'pets', 'pet', 'creatures', 'birds', 'veterinarians', 'vets', 'ecology', 'nature', 'wildlife', 'beasts'] },
  { key: 'artists', label: 'Artists & Crafts', aliases: ['artists', 'art', 'painters', 'sculptors', 'craftsmen', 'craftsmanship'] },
  { key: 'athletes', label: 'Athletes', aliases: ['athletes', 'athletics', 'sports', 'sport', 'runners', 'swimmers'] },
  { key: 'bankers', label: 'Bankers & Finance', aliases: ['bankers', 'banks', 'banking', 'finance', 'money', 'accountants', 'tax'] },
  { key: 'beekeepers', label: 'Beekeepers', aliases: ['beekeepers', 'bees', 'beekeeping', 'honey'] },
  { key: 'brides', label: 'Brides & Weddings', aliases: ['brides', 'weddings', 'wedding', 'married couples', 'marriage', 'newlyweds', 'engaged'] },
  { key: 'builders', label: 'Builders & Architects', aliases: ['builders', 'building', 'construction', 'architects', 'stonemasons', 'masons'] },
  { key: 'cancer-patients', label: 'Cancer Patients', aliases: ['cancer', 'cancer patients', 'oncology', 'tumors'] },
  { key: 'children', label: 'Children & Youth', aliases: ['children', 'child', 'children of Mary', 'youth', 'teenagers', 'infants', 'babies', 'first communion'] },
  { key: 'cooks', label: 'Cooks & Chefs', aliases: ['cooks', 'chefs', 'cooking', 'kitchen', 'restaurants'] },
  { key: 'conversion', label: 'Conversion of Sinners', aliases: ['conversion', 'sinners', 'return to the church', 'backsliders', 'lapsed catholics', 'prodigal', 'those seeking conversion'] },
  { key: 'dying', label: 'The Dying', aliases: ['dying', 'the dying', 'death', 'dying well', 'deathbed', 'holy death', 'departed'] },
  { key: 'eyesight', label: 'Eyes & Eyesight', aliases: ['eyes', 'eyesight', 'blind', 'blindness', 'vision', 'eye problems', 'ophthalmology', 'those with eye problems'] },
  { key: 'farmers', label: 'Farmers & Harvest', aliases: ['farmers', 'farming', 'agriculture', 'harvest', 'fields', 'crops'] },
  { key: 'fishermen', label: 'Fishermen', aliases: ['fishermen', 'fisherman', 'fishing', 'fisher folk', 'netmakers'] },
  { key: 'gardeners', label: 'Gardeners & Florists', aliases: ['gardeners', 'gardening', 'gardens', 'flowers', 'florists', 'floristry'] },
  { key: 'grooms', label: 'Grooms & Husbands', aliases: ['grooms', 'groom', 'husbands', 'fathers', 'dads'] },
  { key: 'headaches', label: 'Headaches & Migraines', aliases: ['headaches', 'headache', 'migraines', 'migraine'] },
  { key: 'impossible-causes', label: 'Impossible & Hopeless Causes', aliases: ['impossible', 'impossible causes', 'hopeless', 'hopeless cases', 'lost causes', 'desperate', 'desperation', 'desperate situations', 'last resort'] },
  { key: 'lawyers', label: 'Lawyers & Judges', aliases: ['lawyers', 'attorneys', 'law', 'legal', 'judges', 'courts', 'justice', 'politicians', 'politician', 'statesmen', 'civil servants', 'legislators'] },
  { key: 'lost-items', label: 'Lost Items', aliases: ['lost items', 'lost things', 'lost objects', 'lost possessions', 'finding things', 'find things', 'misplaced'] },
  { key: 'mothers', label: 'Mothers & Pregnancy', aliases: ['mothers', 'mother', 'expectant mothers', 'pregnancy', 'pregnant', 'childbirth', 'labor', 'motherhood', 'fertility'] },
  { key: 'missions', label: 'Missions & Missionaries', aliases: ['missions', 'missionaries', 'missionary', 'evangelization', 'spreading the gospel', 'foreign missions', 'parish missions'] },
  { key: 'musicians', label: 'Musicians & Singers', aliases: ['musicians', 'musician', 'singers', 'singing', 'music', 'song', 'choirs', 'composers'] },
  { key: 'physicians', label: 'Physicians & Healthcare', aliases: ['physicians', 'doctors', 'surgeons', 'medical', 'health care', 'healthcare', 'nurses', 'medicine', 'the sick', 'sick'] },
  { key: 'police', label: 'Police & Law Enforcement', aliases: ['police', 'police officers', 'law enforcement', 'sheriffs', 'peace officers'] },
  { key: 'poor', label: 'The Poor & Charity', aliases: ['poor', 'the poor', 'poverty', 'charity', 'charitable works', 'homeless', 'the hungry', 'hunger'] },
  { key: 'prisoners', label: 'Prisoners & Captives', aliases: ['prisoners', 'captives', 'imprisoned', 'jailed', 'prisons', 'hostages', 'kidnapped'] },
  { key: 'priests', label: 'Priests & Vocations', aliases: ['priests', 'priesthood', 'vocations', 'seminarians', 'clergy'] },
  { key: 'sailors', label: 'Sailors & Seafarers', aliases: ['sailors', 'sailor', 'seafarers', 'mariners', 'navy', 'naval', 'the sea', 'ocean', 'stowaways'] },
  { key: 'sick', label: 'The Sick & Healing', aliases: ['sick', 'the sick', 'illness', 'disease', 'healing', 'recovery', 'hospital', 'patients'] },
  { key: 'soldiers', label: 'Soldiers & Armed Forces', aliases: ['soldiers', 'soldier', 'military', 'armies', 'army', 'war', 'veterans'] },
  { key: 'storms', label: 'Storms & Natural Disaster', aliases: ['storms', 'storm', 'weather', 'thunder', 'lightning', 'floods', 'flood', 'earthquakes', 'disaster', 'natural disasters', 'rain', 'drought'] },
  { key: 'scientists', label: 'Scientists & Philosophers', aliases: ['scientists', 'scientist', 'science', 'sciences', 'researchers', 'research', 'philosophers', 'philosopher', 'philosophy', 'academia', 'natural sciences'] },
  { key: 'students', label: 'Students & Scholars', aliases: ['students', 'student', 'studies', 'study', 'exams', 'examinations', 'tests', 'scholars', 'learning', 'education', 'school', 'academics', 'university students', 'theologians'] },
  { key: 'teachers', label: 'Teachers & Educators', aliases: ['teachers', 'teacher', 'teaching', 'educators', 'professors', 'catechists'] },
  { key: 'travelers', label: 'Travelers & Pilots', aliases: ['travelers', 'travellers', 'travel', 'travelers by sea', 'pilots', 'pilots and travelers', 'airline', 'aviation', 'flight', 'journeys', 'commuters'] },
  { key: 'workers', label: 'Workers & Laborers', aliases: ['workers', 'worker', 'laborers', 'labourers', 'working people', 'work', 'job seekers', 'unemployed'] },
  { key: 'writers', label: 'Writers & Journalists', aliases: ['writers', 'writer', 'authors', 'author', 'journalists', 'journalism', 'editors', 'poets', 'bloggers', 'writing', 'communicators'] },
  /* ---- Long-tail categories (added as the library grows) ---- */
  { key: 'aviators', label: 'Aviators & Air Travel', aliases: ['aviators', 'aviator', 'pilots', 'flight crew', 'airlines', 'air travel', 'flight'] },
  { key: 'artisans', label: 'Artisans & Tradespeople', aliases: ['artisans', 'goldsmiths', 'goldsmith', 'silversmiths', 'embroiderers', 'weavers', 'jewelers', 'watchmakers', 'tradespeople', 'crafts'] },
  { key: 'basque-country', label: 'The Basque Country', aliases: ['basque country', 'basque', 'euskadi', 'the basque country'] },
  { key: 'brewers', label: 'Brewers & Publicans', aliases: ['brewers', 'brewer', 'brewing', 'beer', 'ale', 'taverns', 'publicans', 'innkeepers'] },
  { key: 'calcutta', label: 'Calcutta', aliases: ['calcutta', 'kolkata'] },
  { key: 'carpenters', label: 'Carpenters & Woodworkers', aliases: ['carpenters', 'carpenter', 'carpentry', 'woodworkers', 'joiners', 'joinery'] },
  { key: 'chastity', label: 'Chastity & Purity', aliases: ['chastity', 'purity', 'the pure', 'pure hearts', 'purity of heart'] },
  { key: 'couples', label: 'Married Couples', aliases: ['couples', 'married couples', 'marriage', 'husband and wife', 'wedded life', 'engaged couples', 'lovers', 'engagement', 'relationships', 'weddings'] },
  { key: 'emigrants', label: 'Emigrants & Exiles', aliases: ['emigrants', 'emigrant', 'immigrants', 'migrants', 'exiles', 'refugees', 'displaced', 'far from home', 'newcomers'] },
  { key: 'engineers', label: 'Engineers & Technicians', aliases: ['engineers', 'engineer', 'engineering', 'technicians', 'machinists', 'mechanics'] },
  { key: 'europe', label: 'Europe', aliases: ['europe', 'the continent', 'european union'] },
  { key: 'falsely-accused', label: 'The Falsely Accused', aliases: ['falsely accused', 'false accusations', 'the wrongly accused', 'slander victims', 'defamed'] },
  { key: 'families', label: 'Families & Family Life', aliases: ['families', 'family', 'family life', 'households', 'parents and children'] },
  { key: 'fathers', label: 'Fathers & Parenthood', aliases: ['fathers', 'father', 'fatherhood', 'dads', 'parenthood', 'stepfathers', 'adoptive parents'] },
  { key: 'firefighters', label: 'Firefighters & First Responders', aliases: ['firefighters', 'firefighter', 'firemen', 'fire rescue', 'first responders', 'emergency workers', 'rescue workers'] },
  { key: 'france', label: 'France', aliases: ['france', 'the french', 'gaul'] },
  { key: 'grocers', label: 'Grocers & Market Traders', aliases: ['grocers', 'grocer', 'grocery', 'market traders', 'shopkeepers', 'retailers'] },
  { key: 'hairdressers', label: 'Hairdressers & Barbers', aliases: ['hairdressers', 'hairdresser', 'hair stylists', 'barbers', 'cosmetologists'] },
  { key: 'ireland', label: 'Ireland & the Irish', aliases: ['ireland', 'the irish', 'irish people', 'erin', 'hibernia'] },
  { key: 'italy', label: 'Italy', aliases: ['italy', 'the italians', 'italia'] },
  { key: 'laundry-workers', label: 'Laundry Workers', aliases: ['laundry workers', 'laundresses', 'laundry', 'dry cleaners', 'washers'] },
  { key: 'merchants', label: 'Merchants & Traders', aliases: ['merchants', 'merchant', 'traders', 'commerce', 'business', 'shop owners', 'vendors'] },
  { key: 'oppressed', label: 'The Oppressed & Downtrodden', aliases: ['oppressed', 'the oppressed', 'downtrodden', 'the persecuted', 'the powerless'] },
  { key: 'penitents', label: 'Penitents & Sinners', aliases: ['penitents', 'penitent', 'repentant', 'penance', 'sinners seeking forgiveness'] },
  { key: 'perfumers', label: 'Perfumers & Chemists', aliases: ['perfumers', 'perfumer', 'perfume', 'fragrances', 'chemists', 'pharmacists'] },
  { key: 'popes', label: 'Popes & the Papacy', aliases: ['popes', 'pope', 'papacy', 'the papacy', 'the holy see'] },
  { key: 'printers', label: 'Printers & Publishers', aliases: ['printers', 'printer', 'printing', 'publishers', 'publishing', 'typographers'] },
  { key: 'religious-life', label: 'Religious Life & Contemplation', aliases: ['monks', 'nuns', 'monasteries', 'monastic life', 'contemplative prayer', 'contemplatives', 'contemplation', 'retreats', 'religious life', 'cloistered', 'vowed religious'] },
  { key: 'ridiculed', label: 'Those Ridiculed for Their Faith', aliases: ['ridiculed', 'mocked for faith', 'scorned', 'ridicule', 'those ridiculed for their faith'] },
  { key: 'rome', label: 'Rome & the Roman Church', aliases: ['rome', 'roman', 'the eternal city'] },
  { key: 'seekers', label: 'Seekers of Truth', aliases: ['seekers', 'seeker', 'searchers for truth', 'the uncertain', 'skeptics', 'doubters', 'those who seek'] },
  { key: 'snake-fear', label: 'Those Who Fear Snakes', aliases: ['snakes', 'afraid of snakes', 'serpents', 'ophidiophobia', 'those afraid of snakes'] },
  { key: 'spelunkers', label: 'Cavers & Spelunkers', aliases: ['spelunkers', 'spelunker', 'cavers', 'caving', 'caves', 'caverns'] },
  { key: 'the-church', label: 'The Church', aliases: ['the church', 'church unity', 'the universal church'] },
  { key: 'unborn', label: 'The Unborn', aliases: ['unborn', 'the unborn', 'unborn children', 'pro-life'] },
  { key: 'women', label: 'Women & Young Women', aliases: ['women', 'woman', 'girls', 'young women', 'maidens', 'daughters'] },
];

const NORMALIZE_RE = /[^a-z0-9]+/g;

function normalize(q: string): string {
  return q.trim().toLowerCase().replace(NORMALIZE_RE, ' ');
}

export function findPatronageCategory(query: string): PatronageCategory | null {
  const q = normalize(query);
  if (!q) return null;

  // 1. Exact alias match.
  for (const cat of PATRONAGE_CATEGORIES) {
    if (cat.aliases.some((a) => normalize(a) === q)) return cat;
    if (normalize(cat.label) === q || cat.key.replaceAll('-', ' ') === q) return cat;
  }
  // 2. Substring match (longest alias wins) to catch "patron of X".
  let best: { cat: PatronageCategory; len: number } | null = null;
  for (const cat of PATRONAGE_CATEGORIES) {
    for (const a of cat.aliases) {
      const n = normalize(a);
      if (n && q.includes(n) && (!best || n.length > best.len)) {
        best = { cat, len: n.length };
      }
    }
  }
  return best?.cat ?? null;
}
