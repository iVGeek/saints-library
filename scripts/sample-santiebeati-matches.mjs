import fs from 'node:fs';
const matches = JSON.parse(fs.readFileSync('C:\\iVGeek\\communion-of-saints\\scripts\\santiebeati-matches.json', 'utf8'));

// Sample 60 random matches to eyeball
const shuffled = [...matches].sort(() => Math.random() - 0.5).slice(0, 60);
for (const m of shuffled) {
  const b = m.best[0];
  console.log(`${m.name}  [${m.feast}]  ->  ${b.honorific} ${b.name}  (${b.score.toFixed(2)})`);
}