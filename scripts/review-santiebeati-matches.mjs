import fs from 'node:fs';
const matches = JSON.parse(fs.readFileSync('C:\\iVGeek\\communion-of-saints\\scripts\\santiebeati-matches.json', 'utf8'));

const marginal = matches.filter(m => m.best[0].score <= 0.6);
console.log(`Total: ${matches.length}, Marginal (<=0.6): ${marginal.length}\n`);
for (const m of marginal.slice(0, 40)) {
  const b = m.best[0];
  console.log(`${m.name}  [${m.feast}]  ->  ${b.honorific} ${b.name}  (${b.score.toFixed(2)}, id ${b.id})`);
}