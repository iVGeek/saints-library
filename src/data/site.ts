export const SITE = {
  name: 'The Communion of Saints',
  tagline: 'A Digital Library of Catholic Sanctity',
  description:
    'A serene digital library dedicated to the lives, writings, miracles, and patronage of Catholic saints — from the early Church to our own times.',
  url: 'https://saints.example.com',
  locale: 'en',
  language: 'en',
  /** Update after the official launch. */
  copyrightStartYear: 2026,
} as const;

export const NAV = [
  { href: '/saints', label: 'Directory' },
  { href: '/calendar', label: 'Liturgical Calendar' },
  { href: '/patronage', label: 'Patronage Explorer' },
  { href: '/prayers', label: 'Prayers' },
  { href: '/articles', label: 'Articles' },
  { href: '/about', label: 'About & Sources' },
] as const;
