export function slug(id: string): string {
  return id.endsWith('.md') ? id.slice(0, -3) : id;
}
