# Content curation guide

## What counts as a stub

A profile is a **stub** when its Markdown body is shorter than 80 characters.
That is the definition used by `scripts/mark-stubs.mjs`, the `stub` field in
`src/content.config.ts`, the directory's "Hide stub profiles" filter, and the
profile badge.

Missing optional fields (`patronage`, `region`, `vocation`, `sources`, image)
are reported separately by `scripts/report-quality.mjs`; they do **not** make a
profile a stub by themselves.

```bash
node scripts/report-quality.mjs
```

This regenerates `stubs.json` and `quality-report.json` and prints the current
counts.

## Source policy

Only use sources that are reliable and that permit reuse:

| Source | Rights | Use |
| --- | --- | --- |
| [The Catholic Encyclopedia (1913)](https://www.newadvent.org/cathen/) | Public domain | Preferred for pre-1913 saints. Full-text biographies may be quoted with attribution. |
| [Wikipedia](https://en.wikipedia.org/) | CC BY-SA 4.0 | Use only with an explicit attribution and link. Do not copy without the licence notice. |
| [Wikidata](https://www.wikidata.org/) | CC0 | Structured facts: feast day, patronage, image, dates. |
| [Vatican.va](https://www.vatican.va/) | Vatican copyright | Citations and facts; do not copy long passages. |

Do **not** copy text from CatholicSaints.info, Nominis, Santiebeati, or other
aggregators. They are useful for cross-checking facts, but their prose is not
licensed for reuse.

Every applied biography must carry a visible source line in the body and a
matching entry in the `sources` frontmatter field.

## Catholic Encyclopedia pipeline

Build the article index once (11,609 entries):

```bash
node scripts/build-cathen-index.mjs
```

Dry-run the matcher over the current stubs:

```bash
node scripts/curate-catholic-encyclopedia.mjs --limit 200
```

This writes `curation-queue.json` and `curation-queue.md` (ignored by Git).
Inspect the queue before applying anything. The matcher is deliberately
conservative: exact title matches, locality evidence, feast-day evidence, and
person cues all raise confidence; bare-name matches without corroboration are
capped at review level.

Apply only high-confidence matches:

```bash
node scripts/curate-catholic-encyclopedia.mjs --apply --min-confidence 0.9
```

To re-run or repair a reviewed batch without scanning every stub, pass the
filenames as a comma-separated list:

```bash
node scripts/curate-catholic-encyclopedia.mjs --file saint-a.md,saint-b.md --apply
```

Article text is decoded from the source HTML, including named entities such
as `&uuml;` and `&eacute;`, so excerpts keep the original spelling
(`Münster`, `Mémoires`). The matcher caches each article in `.cache/cathen/`;
delete that directory to force a fresh download.

## Wikipedia pipeline

```bash
node scripts/curate-wikipedia.mjs --limit 200
node scripts/curate-wikipedia.mjs --apply --min-confidence 0.9
```

The Wikipedia matcher requires a saint-related category, a name match, and
(when the profile has a locality) locality corroboration. Applied text is
quoted and attributed under CC BY-SA 4.0.

## Review workflow

1. Run the dry-run matcher for a batch.
2. Open `curation-queue.md` and spot-check the source articles.
3. Reject wrong matches by editing the queue or rerunning with `--file`.
4. Apply the approved batch.
5. Run `node scripts/report-quality.mjs` and `npm run check`.
6. Commit the curated profiles in a batch (for example 100–300 files), not the
   whole corpus at once.

## Image work

- `node scripts/normalize-saints.mjs` normalizes image URLs.
- Profiles without a portrait fall back to a generated monogram.
- Prefer Wikimedia Commons / museum open-access images with a credit.
