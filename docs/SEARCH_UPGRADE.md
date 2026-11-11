# Search upgrade (scaffold)

Current: Fuse.js over `/search-index.json` (client-side).

Planned: Meilisearch (self-host) or Algolia.

Migration steps:
1. Stand up search backend and index the saint corpus (reuse `search-index.json` shape).
2. Implement `RemoteSearchAdapter` in `src/utils/search.ts`.
3. Swap the adapter in `Header.astro` and `saints/index.astro`.
4. Keep `/search-index.json` as a fallback for offline/no-JS.
"created"