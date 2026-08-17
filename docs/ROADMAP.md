# Roadmap

## Phase 1 — MVP (current)

- [x] Static site (Astro 5 + Tailwind 4), design system, layouts
- [x] Content collections + Zod schema (`saints`, `articles`)
- [x] Core pages: home, directory, saint profile, calendar, patronage
      explorer, prayers, articles, about, 404
- [x] Client-side search (Fuse.js) over build-time `/search-index.json`
- [x] Feast-days JSON + sitemap + robots
- [x] 17 sample saints, 9 verified Wikimedia images
- [x] Clean URLs, JSON-LD, canonical/OG metadata
- [x] Patronage vocabulary reconciled (74 categories)
- [x] Documentation (README, SITEMAP, WIREFRAMES, CONTENT_MODEL, ROADMAP)
- [ ] **Deploy prep:** replace `SITE.url` placeholder, real domain, SSL,
      static host (Cloudflare Pages / Netlify / Vercel)

## Phase 2 — Launch (150–250 saints)

- [ ] Content pipeline: research + write biographies in batches by region/era
- [ ] Cover all twelve months evenly (currently gaps in Feb / Nov / Dec)
- [ ] Second pass on image rights: curate public-domain portraits, verify
      `Special:FilePath` links resolve, add credits
- [ ] Accessibility pass: contrast, focus states, reduced motion, alt text
- [ ] Lighthouse/Core Web Vitals pass (image width params, preloading)
- [ ] Share/open-graph page previews for individual saints
- [ ] Custom 404 suggestions and related-article rails
- [ ] Admin cheat-sheet for adding content without touching code (PR template
      for new saint files)

## Phase 3 — Scale

- [ ] **Search upgrade:** Meilisearch (self-host) or Algolia; add typo
      tolerance at scale, facets in the UI, and `patronage`-aware ranking
- [ ] **CMS integration:** Sanity or Strapi with the schema mapped in
      `docs/CONTENT_MODEL.md`; editorial workflow, review states, preview
- [ ] Liturgical year: movable-feast awareness, saint-of-the-day endpoint for
      the full calendar, third-party calendar feed (ICS)
- [ ] Curated collections: Doctors of the Church, patron saints by country,
      martyrs of the 20th century, etc.
- [ ] Translations (phase 2 candidate): i18n routing, locale content dirs
- [ ] Webmentions / reader contributions on articles
- [ ] Newsletter subscription for feast-day digests

## Phase 4 — Long-term

- [ ] API + open access: publish saint data as structured data dumps (JSON,
      the `/feast-days.json` pattern generalised) for reuse
- [ ] Wikidata/Wikimedia integration: bidirectional links, automated image
      suggestions with provenance checks
- [ ] Audio: narrated lives for accessibility
- [ ] Community moderation and correction workflow with editorial oversight

## Decision log

- **Repo-first content** (files + schema) before CMS so launch is simple and
  the schema is proven before editors depend on it.
- **Fuse.js now, Meilisearch/Algolia later** — avoids infra cost at launch
  while keeping a clean search-index endpoint to swap behind.
- **Wikimedia `Special:FilePath` hotlinks** (width-parameterised) over
  bundling binaries at launch; revisit for self-hosting artwork at scale.
- **Clean URLs required** — the `slug()` helper normalises collection ids so
  links never leak `.md`.
