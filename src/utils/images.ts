/**
 * Build a Wikimedia Commons URL from a file name (stable hotlink via
 * Special:FilePath), or pass through any absolute URL (self-hosted, museum
 * open access, etc.) unchanged.
 */
export function imageSrc(src: string | undefined, width = 900): string | null {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  const name = src.replace(/^File:/, '').replace(/ /g, '_');
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${width}`;
}
