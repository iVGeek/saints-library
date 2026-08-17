# Site Map

All routes are static and generated at build time. Content pages (saints,
articles) are derived from the content collections; everything else is a
hand-written page or endpoint.

## Public pages

| Route                     | Source file                | Description |
| ------------------------- | -------------------------- | ----------- |
| `/`                       | `pages/index.astro`        | Home: hero with current liturgical season, feast-of-the-day, featured saints, latest articles, site intro. |
| `/saints`                 | `pages/saints/index.astro` | Directory with search box and filters (vocation, region, order, century, patronage, rank, status). |
| `/saints/:slug/`          | `pages/saints/[slug].astro`| Saint profile (see WIREFRAMES.md). Slug = filename minus `.md`. |
| `/calendar`               | `pages/calendar.astro`     | Twelve liturgical months; days link to the saints whose feast falls on them. |
| `/patronage`              | `pages/patronage.astro`    | Patronage explorer: search + popular patrons + every category as an accordion. |
| `/prayers`                | `pages/prayers.astro`      | All prayers, grouped by saint, client-filterable. |
| `/articles`               | `pages/articles/index.astro` | Article index. |
| `/articles/:slug/`        | `pages/articles/[slug].astro` | Article page. |
| `/about`                  | `pages/about.astro`        | Mission, editorial principles, and source policy. |
| `/404`                    | `pages/404.astro`          | Custom not-found page. |

## Generated data endpoints

| Route               | Source file                  | Purpose |
| ------------------- | ---------------------------- | ------- |
| `/search-index.json` | `pages/search-index.json.ts` | Fuse.js search corpus: saint name, aliases, summary, and ~2000 chars of biography body. |
| `/feast-days.json`  | `pages/feast-days.json.ts`   | `{ month, day, saints: [...] }` per fixed feast, for external calendar/embeds. |
| `/robots.txt`       | `pages/robots.txt.ts`        | Points crawlers at the sitemap. |
| `sitemap-index.xml` | via `@astrojs/sitemap`       | Auto-generated from all canonical URLs. |

## Not yet built (planned)

- `/saints?era=…` deep-links and canonical facet routes.
- `/collections/:id` curated saint lists (e.g. "Doctors of the Church").
- Saint-of-the-day and feast-day JSON for the full liturgical year.
