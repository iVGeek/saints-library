import type { CollectionEntry } from 'astro:content';

type SaintLike =
  | CollectionEntry<'saints'>
  | { data: Pick<CollectionEntry<'saints'>['data'], 'stub' | 'sources' | 'summary'> };

export function hasSources(saint: SaintLike): boolean {
  return (saint.data.sources?.length ?? 0) > 0;
}

export function isStub(saint: SaintLike): boolean {
  return Boolean(saint.data.stub);
}

/** Profiles with cited sources in frontmatter — the strongest "reliable" signal currently available. */
export function isSourced(saint: SaintLike): boolean {
  return hasSources(saint);
}

/** Non-stub profiles with a summary; useful as a lighter curation baseline than sourced-only. */
export function isCurated(saint: SaintLike): boolean {
  return !isStub(saint) && Boolean(saint.data.summary);
}
