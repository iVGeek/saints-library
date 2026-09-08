import fs from 'node:fs';
import * as yaml from 'js-yaml';

function normName(name) {
  let s = name;
  s = s.replace(/^[^–—-]*?\b(of the|the|and)\b[\s\S]*$/, m => m); // noop
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  s = s.replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  const HONORIFICS = ['san', 'santa', 'santi', 'santo', 'sant', 'beato', 'beata', 'beati',
    'servo di dio', 'serva di dio', 'servi di dio', 'servi', 'serva', 'servo',
    'venerabile', 'venerabili', 'card', 'card.', 'padre', 'madre', 'fratello', 'sorella',
    'mons', 'abate', 'badessa', 'vescovo', 'sacerdote', 'martire', 'martiri',
    're', 'profeta', 'patriarca', 'fondatore', 'fondatrice', 'religioso', 'religiosa',
    'dottore', 'apostolo', 'evangelista', 'papà', 'papa', 'cavaliere', 'pellegrino'];
  for (const h of HONORIFICS) {
    s = s.replace(new RegExp(`^${h.replace('.', '\\.')}\\s+`, 'i'), '');
  }
  s = s.replace(/\b(di|d[’'']|de|del|della|delle|dei|o|ed|e)\b/g, ' ');
  return s;
}

function firstToken(norm) {
  const toks = norm.split(/\s+/).filter(t => t.length > 2);
  return toks.length ? toks[0] : '';
}

const cases = [
  ['Blessed Alfredo Almunia López-Teruel', 'Beato Alfredo Almunia López–Teruel'],
  ['Blessed Alramo of Niederaltaich', 'Beato Alramo di Niederaltaich'],
  ['Blessed Andrés Casinello Barroeta', 'Beato Andrea Casinello Barroeta'],
  ['Blessed José Casinello Barroeta', 'Beato Andrea Casinello Barroeta'],
  ['Blessed Abundus of Villers', 'Beato Abbondio di Villers'],
  ['Blessed Angelico of Omura', 'Beato Angelico'],
];

for (const [a, b] of cases) {
  const na = normName(a), nb = normName(b);
  console.log(`ours:   "${a}" -> "${na}" (first="${firstToken(na)}")`);
  console.log(`theirs: "${b}" -> "${nb}" (first="${firstToken(nb)}")`);
  console.log('');
}