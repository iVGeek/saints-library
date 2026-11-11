/**
 * Build a Wikimedia Commons URL from a file name (stable hotlink via
 * Special:FilePath), or pass through any absolute URL (self-hosted, museum
 * open access, etc.) unchanged.
 */
export function imageSrc(src: string | undefined, width = 900): string | null {
  if (!src) return null;
  // Treat the generic placeholder as "no portrait" so the devotional monogram
  // is rendered instead of a repeated stock image.
  if (src === '/placeholder-saint.svg' || src === '/placeholder.svg') return null;
  if (/^https?:\/\//i.test(src)) {
    // Normalise to HTTPS where the host supports it, to avoid mixed content.
    let out = src.replace(/^http:\/\/(upload\.wikimedia\.org|commons\.wikimedia\.org|catholicsaints\.info)\//i, 'https://$1/');
    // Strip tracking parameters from any URL.
    try {
      const url = new URL(out);
      for (const k of [...url.searchParams.keys()]) {
        if (/^utm_/i.test(k)) url.searchParams.delete(k);
      }
      out = url.toString();
    } catch {}
    return out;
  }
  const name = src.replace(/^File:/, '').replace(/ /g, '_');
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${width}`;
}
