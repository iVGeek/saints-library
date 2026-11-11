import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'src', 'content', 'saints');
const dryRun = process.argv.includes('--dry-run');

function cleanUrl(u) {
  if (typeof u !== 'string' || !/^https?:\/\//i.test(u)) return u;
  let out = u.replace(/^http:\/\/(upload\.wikimedia\.org|commons\.wikimedia\.org|catholicsaints\.info)\//i, 'https://$1/');
  try {
    const url = new URL(out);
    if (/wikimedia\.org$/i.test(url.hostname) || /wikipedia\.org$/i.test(url.hostname)) {
      for (const k of [...url.searchParams.keys()]) {
        if (/^utm_/i.test(k)) url.searchParams.delete(k);
      }
      out = url.toString();
    }
  } catch {}
  return out;
}

let changed = 0, urlChanges = 0;
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
for (const f of files) {
  const full = path.join(dir, f);
  const raw = fs.readFileSync(full, 'utf8');
  // Match an image: line (possibly quoted) at top-level of frontmatter.
  const newRaw = raw.replace(/^image:\s*(.+)$/m, (line, val) => {
    const trimmed = val.trim().replace(/^['"]|['"]$/g, '');
    const nu = cleanUrl(trimmed);
    if (nu !== trimmed) { urlChanges++; return `image: ${/^https?:\/\//.test(nu) ? nu : trimmed}`; }
    return line;
  });
  if (newRaw !== raw) {
    changed++;
    if (!dryRun) fs.writeFileSync(full, newRaw, 'utf8');
  }
}

console.log(`Processed ${files.length} files; ${changed} files changed, ${urlChanges} URLs normalized${dryRun ? ' (dry run)' : ''}.`);