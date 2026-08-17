# Wireframes

Layout blueprints for the core templates. Common styling vocabulary (design
tokens, `.navy-bg`, `.parchment-bg`, `.card-glow`, `.chip`, `.btn-gold`,
`.saint-prose`) is defined in `src/styles/global.css`.

```
Header (every page)
┌────────────────────────────────────────────────────────────────┐
│ ☩ The Communion of Saints — a digital library of Catholic      │
│    sanctity            [Directory] [Calendar] [Patronage]      │
│                        [Prayers] [Articles] [About]            │
└────────────────────────────────────────────────────────────────┘
```

## Home (`/`)

```
Hero (navy, season-tinted) ─────────────────────────────
  label: "Enter the library"
  H1: tagline
  intro paragraph
  [Explore the directory] [Browse patronage]   (btn-gold / outline)
└───────────────────────────────────────────────
Feast of the day (auto-selected by date)
  Saint card with monogram/photo → /saints/:slug
Featured saints (horizontal row of SaintCards)
Season's essay + "The library grows" note
  Latest articles (from articles collection)
Footer (navy): colophon, nav, copyright
```

## Directory (`/saints`)

```
Page header: label + H1 "The Directory" + count
Search box (name, aliases, keywords) — live filter, no page reload
Filter bars: Vocation | Region | Religious order | Century
             Patronage | Liturgical rank | Status
Active-filter chips with × to clear
Saint grid: SaintCard (photo/monogram, name, title, feast, tags)
Empty state: "No saints match…"
```

## Saint profile (`/saints/:slug/`)

```
Hero (navy)
  breadcrumbs: Home / Directory / <name>
  left:  honorific + status chips (Saint/Blessed/Martyr)
         H1 name, italic title
         summary paragraph
         stat row: Feast day · Next observance · Region · Canonized
         patronage chips → /saints?patronage=:key
  right: ArchImage (vintage frame) + image credit
Main (parchment, two-column: article + 320px aside)
  article
    biography (Content body, .saint-prose typography)
    Timeline "Life at a glance"      (lifeEvents)
    Symbols & iconography chips
    Patronage & causes (links)       (patronage + causes)
  aside
    QuickFacts (born, died, birth/death place, centuries, status)
    "Feast in <month>" card → /calendar
    Religious family card → /saints?order=…
    Century card
Sections (full width, spaced mt-20)
  Quotes "Words of the saint"        (QuoteBlock)
  Prayers & novenas                  (PrayerCards)
  Related saints                     (RelatedSaints)
  Sources & further reading          (SourcesList)
```

## Liturgical calendar (`/calendar`)

```
Page header
12 month grids (7-column), one card per month
  weekday header row; cells = day number
  feast days: tinted cell, saint name → /saints/:slug
  today's date ringed in gold
```

## Patronage explorer (`/patronage`)

```
Hero (navy): label + H1 + description + search input + example chips
Popular patrons: 10 curated cards (photo/monogram + "Patron of <label>")
Every patronage we carry (alphabetical accordions)
  <details> per category: label, saint name preview, count
  open state reveals chips linking to profiles
  live search hides non-matching categories
Empty state panel for unmatched queries
```

## Prayers (`/prayers`)

```
Page header + search input
Grouped by saint (section per saint with prayers)
  each prayer: name, kind, prayer text, optional source
  "Full profile →" link to /saints/:slug#prayers
```

## Articles

```
Index (/articles): grid of article cards (hero, title, category, date)
Article (/articles/:slug/): hero image, meta (author/category/date),
  prose body, breadcrumbs, related articles (future)
```

## About (`/about`)

```
Mission statement, editorial principles (public domain + original
composition), source policy, image policy, contact placeholder.
```

## 404 (`/404`)

```
Centered: monogram, "Page not found", link back to the library.
```

## Footer

```
Navy band: site name + mission line · nav links · copyright line
with start year. Small print: editorial provenance note.
```

## Responsive behavior

- Nav collapses to a horizontal-scroll bar (MVP) — hamburger menu is planned.
- Hero grids collapse from 2-column to 1-column below `lg`/`md`.
- Saint grids and popular-patrons grids collapse via Tailwind breakpoints
  (`sm:grid-cols-2 lg:grid-cols-5`, etc.).
- Calendar cells stay 7-across; day content wraps inside the cell.
