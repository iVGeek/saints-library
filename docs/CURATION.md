# Content curation guide (scaffold)

Profiles marked `stub: true` (short body) need curation:
- Add a full biography body.
- Fill `patronage`, `vocation`, `region`, `summary`.
- Replace placeholder images or keep the monogram.
- Verify feast day, sources, and quotes.

Run `node scripts/report-quality.mjs` to regenerate `stubs.json`.
Run `node scripts/normalize-saints.mjs` to normalize image URLs.
"created"