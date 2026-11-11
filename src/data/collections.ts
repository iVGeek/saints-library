import type { CollectionEntry } from 'astro:content';

export interface CollectionDef {
  id: string;
  title: string;
  description: string;
  match: (s: CollectionEntry<'saints'>) => boolean;
}

export const COLLECTIONS: CollectionDef[] = [
  {
    id: 'doctors-of-the-church',
    title: 'Doctors of the Church',
    description: 'The saints honoured by the Church for their eminent teaching.',
    match: (s) => s.data.vocation.includes('Doctor'),
  },
  {
    id: 'martyrs',
    title: 'Martyrs',
    description: 'Those who witnessed to Christ by their blood.',
    match: (s) => s.data.martyr === true,
  },
  {
    id: 'venerables',
    title: 'Venerables',
    description: 'Servants of God whose heroic virtue has been recognised.',
    match: (s) => s.data.canonizationStatus === 'Venerable',
  },
  {
    id: 'blesseds',
    title: 'Blesseds',
    description: 'The beatified, one step from canonisation.',
    match: (s) => s.data.canonizationStatus === 'Blessed',
  },
];