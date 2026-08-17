# Content Model — Admin Guide

The content schema lives in `src/content.config.ts` and is validated by Zod on
every build. This guide explains each field, the controlled vocabularies, and
how the model maps to a future CMS (Sanity or Strapi) — the Astro collection is
a faithful mirror of the CMS schema so migration is a content move, not a
rewrite.

## Conventions

- **Slug = filename.** `therese-of-lisieux.md` → `/saints/therese-of-lisieux/`.
  Use lowercase, hyphens, ASCII. The build strips the `.md` suffix via
  `src/utils/slugs.ts`.
- **Frontmatter** is YAML; the **body** is the biography/essay in Markdown.
- **Unicode is fine** (Thérèse, é, —,  ) but files must be saved as **UTF-8**
  with no BOM. Avoid rewriting files through PowerShell (see README).
- **Unknown/extra frontmatter fields fail the build.** Remove keys you don't
  use; leave known fields out rather than null.

## Saints — field reference

### Identity

| Field | Type | Notes |
| ----- | ---- | ----- |
| `name` | string | Display name, e.g. `Thérèse of Lisieux`. |
| `honorific` | string | Default `Saint`. E.g. `Saint`, `Blessed`, `Venerable`. |
| `title` | string? | Formal title, e.g. `Doctor of the Church`, `Virgin and Martyr`. |
| `summary` | string? | One sentence; used in cards, `<meta description>`, search index. |
| `searchAliases` | string[] | Variant names for search tolerance: `Little Flower`, `St. Therese`. |

### Life span

| Field | Type | Notes |
| ----- | ---- | ----- |
| `birthYear` / `deathYear` | int? | For sorting/filters and JSON-LD. Nullable. |
| `born` / `died` | string? | Display strings for uncertain dates, e.g. `c. 1417`. |
| `birthPlace` / `deathPlace` | string? | Free text. |
| `region` | string? | Use a value from `REGIONS` in `src/data/facets.ts` for facet consistency. |
| `centuries` | int[] | E.g. `[3, 4]`. Powers the century filter. |

### Liturgical identity

| Field | Type | Notes |
| ----- | ---- | ----- |
| `feastDay` | `{ month, day }` | Required. `month` 1–12, `day` 1–31. |
| `feastDayLabel` | string? | For movable/alternate feasts, e.g. `Easter`, `Pre-Council (1960)`. |
| `liturgicalRank` | enum? | `Solemnity` / `Feast` / `Memorial` / `Optional Memorial` / `Commemoration`. |
| `canonizationStatus` | enum | Default `Saint`; `Saint` / `Blessed` / `Venerable`. |
| `beatifiedDate` / `canonizedDate` | string? | Display strings, e.g. `1933`. |

### Vocation & patronage

| Field | Type | Notes |
| ----- | ---- | ----- |
| `vocation` | string[] | Use `VOCATIONS` values (`Martyr`, `Doctor`, `Founder`, …). |
| `religiousOrder` | string? | Use a `RELIGIOUS_ORDERS` value for the filter. |
| `patronage` | string[] | **Canonical keys only** — see the patronage vocabulary below. |
| `causes` | string[] | Special causes / secondary patronships, free text, shown as non-link chips. |
| `symbols` | string[] | Iconographic attributes, e.g. `Roses`, `Keys`, `Lion`. |
| `martyr` | boolean | Adds a "Martyr" chip. |

### Imagery

| Field | Type | Notes |
| ----- | ---- | ----- |
| `image` | string? | Wikimedia Commons file name (bare or `File:…`) or any absolute URL. |
| `imageAlt` | string? | Always set for accessibility. |
| `imageCredit` / `imageCreditUrl` | string? | Required for non-public-domain art. |

### Collected content

| Field | Type | Notes |
| ----- | ---- | ----- |
| `quotes` | `{ text, source? }[]` | Quotations from the saint or tradition. |
| `prayers` | `{ name, kind?, text, source? }[]` | `kind` e.g. `Prayer for…` or `Novena day 1`. |
| `lifeEvents` | `{ year, event }[]` | Rendered as the timeline. `year` is a string (e.g. `c. 1182`). |
| `relatedSaints` | `{ name, slug, relation? }[]` | `slug` is the other saint's **slug** (no `.md`, no leading slash). |
| `sources` | string[] | Public-domain works, Vatican docs, museum catalogs; URLs render as links. |

## Articles — field reference

| Field | Type | Notes |
| ----- | ---- | ----- |
| `title` | string | Required. |
| `description` | string | Required; cards + meta. |
| `pubDate` | date | Required (YAML `2026-08-01`). |
| `updatedDate` | date? | Shown when present. |
| `heroImage` | string? | Same rules as saint `image`. |
| `author` | string | Default `The Communion of Saints Editors`. |
| `category` | string | Default `History`; powers grouping. |
| `tags` | string[] | Default empty. |
| `featured` | boolean | Featured article on the home page. |

## Patronage vocabulary

`src/data/patronage.ts` is the **only** allowed source of `patronage` keys.
Each category has a `key` (used in frontmatter and URLs), a `label`, and
`aliases` (free-text search terms). ~74 categories exist today (see the file);
add a new one when a saint's patronage isn't covered:

```ts
{ key: 'aviators', label: 'Aviators & Air Travel',
  aliases: ['aviators', 'aviator', 'pilots', 'flight crew', 'airlines', 'flight'] },
```

Rules:
- Keys are lowercase, hyphenated (`laundry-workers`, `falsely-accused`).
- **Do not invent keys in frontmatter** — a key with no category silently
  disappears from the explorer. Add the category first, then use the key.
- Link labels are generated from the key by replacing hyphens with spaces; a
  custom `label` is what visitors read on the explorer page.

## Writing the biography

- **Original composition**, grounded in public-domain sources (Butler's Lives,
  the Golden Legend, Church documents, Acta Sanctorum tradition). Do not copy
  living authors' text.
- Structure suggested: early life → conversion/call → apostolic work → trials →
  death/legacy. Use Markdown headings, `##` at most (the page H1 is the name).
- Where tradition and scholarship differ (dates, places, legends), prefer
  mainstream scholarship and note the difference.
- Cite specifics in `sources`; add inline links sparingly (URLs in prose are
  stripped from the search index for cleanliness).

## YAML gotchas

- **Colons inside values must be quoted** or the string wrapped in a folded
  scalar: `source: "The Pillar of the Cloud (1833)"`.
- **Leading non-keyword dashes**: a list item starting with a word can be
  misread; quote whole items like `- "Apostle to the Apostles (title used in tradition)"`.
- **En-dashes / em-dashes are fine** once the file is UTF-8, but re-check after
  any tooling rewrite.
- Booleans: `martyr: false` — don't write `no`.

## CMS mapping (Sanity / Strapi)

| Astro field | Sanity type | Strapi type |
| ----------- | ----------- | ----------- |
| `name`, `honorific`, `title`, `summary` | `string` / `text` | `string` / `text` |
| `searchAliases`, `vocation`, `patronage`, `symbols`, `causes`, `sources` | `array(string)` | `array of string` |
| `feastDay` | `object{month,day}` | `component` |
| `liturgicalRank`, `canonizationStatus` | `string` (options) | `enumeration` |
| `birthYear`, `deathYear` | `number` | `integer` |
| `image` (+alt/credit) | `image` with hotspot | `media` |
| `quotes`, `prayers`, `lifeEvents`, `relatedSaints` | `array of object` | `components / relations` |
| `relatedSaints` | reference to `saint` document | `relation` (one-to-many) |
| Body (biography) | portable text / markdown | `rich-text` |

Sanity/Strapi validation options should mirror the Zod rules (required vs
optional, enums, min/max) so editors cannot create invalid entries. A build
hook can then pull CMS content into `src/content/` or render it server-side in
the CMS-backed phase.
