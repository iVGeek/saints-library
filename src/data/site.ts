const siteUrl = (process.env.SITE_URL || 'https://main.d3u8wajpj8xb58.amplifyapp.com').replace(/\/$/, '');

export const SITE = {
  name: 'The Communion of Saints',
  tagline: 'A Digital Library of Catholic Sanctity',
  description:
    'A serene digital library dedicated to the lives, writings, miracles, and patronage of Catholic saints — from the early Church to our own times.',
  url: siteUrl,
  locale: 'en',
  language: 'en',
  /** Update after the official launch. */
  copyrightStartYear: 2026,
} as const;

export const NAV = [
  { href: '/saints', label: 'Directory' },
  { href: '/collections', label: 'Collections' },
  { href: '/calendar', label: 'Liturgical Calendar' },
  { href: '/patronage', label: 'Patronage Explorer' },
  { href: '/prayers', label: 'Prayers' },
  { href: '/about', label: 'About & Sources' },
] as const;
