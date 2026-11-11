/**
 * Search adapter abstraction.
 *
 * The site currently uses Fuse.js over a build-time JSON index. This module
 * defines a common interface so a future Meilisearch/Algolia backend can be
 * swapped in without changing the UI contract (see docs/SEARCH_UPGRADE.md).
 */

export interface SearchHit {
  slug: string;
  name: string;
  feast: string;
  image: string | null;
  score?: number;
}

export interface SearchAdapter {
  /** Load the index (no-op for remote adapters). */
  init(): Promise<void>;
  /** Run a query and return up to `limit` hits. */
  search(query: string, limit?: number): Promise<SearchHit[]>;
}

/** Fuse.js adapter (current). Implemented in the client bundle; this is a stub. */
export class FuseAdapter implements SearchAdapter {
  async init() {}
  async search(_query: string, _limit = 8): Promise<SearchHit[]> {
    return [];
  }
}

/** Placeholder for a future Meilisearch/Algolia adapter. */
export class RemoteSearchAdapter implements SearchAdapter {
  constructor(private endpoint: string) {}
  async init() {}
  async search(_query: string, _limit = 8): Promise<SearchHit[]> {
    const res = await fetch(`${this.endpoint}?q=${encodeURIComponent(_query)}&limit=${_limit}`);
    return res.json();
  }
}