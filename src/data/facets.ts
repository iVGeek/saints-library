/**
 * Controlled vocabularies for the directory facets. Values are normalized
 * lowercase keys; the same values must be used in saint frontmatter.
 * Extend these lists freely — the UI renders whatever is present.
 */

export const VOCATIONS = [
  'Apostle',
  'Evangelist',
  'Martyr',
  'Confessor',
  'Virgin',
  'Doctor',
  'Mystic',
  'Pope',
  'Bishop',
  'Priest',
  'Deacon',
  'Monk',
  'Nun',
  'Hermit',
  'Founder',
  'Lay',
  'Widow',
  'Married',
  'Teacher',
  'Preacher',
  'Missionary',
  'Queen',
  'King',
  'Emperor',
  'Archangel',
] as const;

export const RELIGIOUS_ORDERS = [
  'Benedictine',
  'Franciscan',
  'Poor Clares',
  'Dominican',
  'Jesuit',
  'Carmelite',
  'Discalced Carmelite',
  'Augustinian',
  'Cistercian',
  'Carthusian',
  'Salesian',
  'Vincentian',
  'Servite',
  'Norbertine',
  'Passionist',
  'Redemptorist',
  'Ursuline',
  'Daughters of Charity',
  'Missionaries of Charity',
  'Anglican Use',
  'Oratorian',
] as const;

export const REGIONS = [
  'Italy',
  'France',
  'Spain',
  'Portugal',
  'Ireland',
  'Scotland',
  'England',
  'Wales',
  'Germany',
  'Austria',
  'Poland',
  'Netherlands',
  'Belgium',
  'Switzerland',
  'Greece',
  'Turkey',
  'Syria',
  'Lebanon',
  'Armenia',
  'Georgia',
  'Russia',
  'Ukraine',
  'Egypt',
  'North Africa',
  'Ethiopia',
  'Holy Land',
  'Israel',
  'Palestine',
  'India',
  'China',
  'Japan',
  'Vietnam',
  'Philippines',
  'Korea',
  'Mexico',
  'Central America',
  'South America',
  'Brazil',
  'Peru',
  'United States',
  'Canada',
  'Australia',
  'New Zealand',
  'Africa',
] as const;

export const LITURGICAL_RANKS = [
  'Solemnity',
  'Feast',
  'Memorial',
  'Optional Memorial',
  'Commemoration',
] as const;

export const CANONIZATION_STATUSES = ['Saint', 'Blessed', 'Venerable'] as const;

/** Human ordinal for a century number: 1 -> "1st", 13 -> "13th". */
export function centuryLabel(c: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = c % 100;
  return `${c}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export function centuryLabels(count: number): string[] {
  return Array.from({ length: count }, (_, i) => centuryLabel(i + 1));
}
