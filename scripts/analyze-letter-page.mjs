import fs from 'node:fs';
const html = fs.readFileSync('C:\\iVGeek\\communion-of-saints\\scripts\\santiebeati-letter-sample.html', 'utf8');
const ids = [...new Set([...html.matchAll(/\(id (\d+) - ord (\d)\)/g)].map(m => m[1]))];
console.log('unique ids: ' + ids.length);
const ords = [...html.matchAll(/\(id \d+ - ord (\d)\)/g)].map(m => parseInt(m[1], 10));
console.log('ord range: ' + Math.min(...ords) + '..' + Math.max(...ords));
// look at last 40 lines for navigation
const lines = html.split('\n');
console.log('=== last 30 lines ===');
console.log(lines.slice(-30).join('\n'));