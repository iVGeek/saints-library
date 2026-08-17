# The Communion of Saints — Digital Library

A serene, museum-quality static website of the lives, writings, patronage, and
prayers of Catholic saints. Built with **Astro 5 + Tailwind CSS 4**, fully
static, searchable, and content-driven.

> **Status:** MVP. 17 saint profiles and 1 featured article in the library.
> Launch target: 150–250 saints from public-domain sources, originally rewritten.

## Quick start

Requires Node.js 20+ (developed on v24).

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # astro check + astro build -> dist/
npm run preview    # serve the production build
```

- `npm run check` — run the Astro type checker alone.
- `npm run sync:index` — regenerate `.astro` content-type definitions.

## Project layout

```
astro.config.mjs          # site URL, sitemap, Tailwind 4 integration
public/                   # favicon.svg, og-default.svg (static assets)
src/
  content.config.ts       # Zod schema — single source of truth for content
  content/
    saints/*.md           # one file per saint (frontmatter + Markdown body)
    articles/*.md         # essays and features
  data/
    site.ts               # SITE metadata + navigation
    patronage.ts          # canonical patronage vocabulary (keys/labels/aliases)
    facets.ts             # vocations, orders, regions, ranks, statuses
    calendar.ts           # feast-date math, liturgical seasons, Easter
  utils/
    slugs.ts              # strip ".md" from collection ids -> clean URLs
    images.ts             # Wikimedia Commons hotlink builder
  components/             # ArchImage, SaintCard, Timeline, PrayerCards, ...
  layouts/BaseLayout.astro
  pages/                  # one route per file (see docs/SITEMAP.md)
  styles/global.css       # design tokens and central utility classes
docs/                     # project documentation (this directory)
```

## Content model at a glance

Every saint is a Markdown file under `src/content/saints/`. The frontmatter is
validated against `src/content.config.ts`; the Markdown body is the life story.

```md
---
name: "Thérèse of Lisieux"
honorific: "Saint"
title: "Virgin, Doctor of the Church"
summary: "One-sentence description for cards and search."
searchAliases: ["Little Flower", "Teresa of Lisieux"]
birthYear: 1873
deathYear: 1897
feastDay: { month: 10, day: 1 }
vocation: ["Nun", "Doctor", "Mystic"]
patronage: ["missionaries", "aviators", "flowers"]
symbols: ["Roses", "Crucifix"]
image: "Therese_de_Lisieux_ph.jpg"
quotes:
  - text: "A quotation."
prayers:
  - name: "A Prayer"
    text: "Prayer text."
lifeEvents:
  - year: "1873"
    event: "Born in Alençon, France."
sources:
  - "Story of a Soul (public domain)"
---

Biography body (Markdown). The default portrait, feast day, patronage, quotes,
and prayers are drawn from frontmatter; everything else lives here.
```

See **docs/CONTENT_MODEL.md** for the full field reference, controlled
vocabularies, and the future CMS (Sanity/Strapi) mapping.

## Adding a saint

1. Copy `src/content/saints/therese-of-lisieux.md` as a template.
2. Set the slug by the filename: `luke-the-evangelist.md` → `/saints/luke-the-evangelist/`.
3. Fill frontmatter. Keep `patronage` keys to the canonical list in
   `src/data/patronage.ts` (aliases let visitors find them by plain words).
4. Write the biography in the body.
5. Optional: add a `relatedSaints` entry in other profiles to cross-link.
6. Run `npm run build` — Astro validates the schema for you.

## Images

`image` accepts a Wikimedia Commons file name (bare or `File:...`) or any
absolute URL. Bare names are hotlinked via
`https://commons.wikimedia.org/wiki/Special:FilePath/...?width=N`.
Saints without an image get an automated gold monogram
(`src/components/Monogram.astro`).

## Editing on Windows

- Use an editor or the standard tooling — **avoid rewriting files with
  PowerShell `Set-Content`**, which double-encodes non-ASCII text (em-dashes
  become mojibake). Read/write as UTF-8 in any decent editor.
- If you use PowerShell to read files, pass `-Encoding UTF8`.

## Roadmap

Content growth, search upgrade (Meilisearch/Algolia), and CMS integration are
tracked in **docs/ROADMAP.md**. Site structure and page blueprints live in
**docs/SITEMAP.md** and **docs/WIREFRAMES.md**.

## Before deploy

- Replace `SITE.url` in `src/data/site.ts` (and `astro.config.mjs`) with the
  real domain — the current value is a placeholder and feeds robots.txt,
  sitemap, canonical links, and JSON-LD.
