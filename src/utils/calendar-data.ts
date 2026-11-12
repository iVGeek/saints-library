import type { CollectionEntry } from 'astro:content';
import { MONTHS } from '../data/calendar';
import { slug } from './slugs';

/**
 * Compact, serialisable shape for one saint on the calendar.
 * Kept deliberately small: a month endpoint for January carries ~1,800
 * entries, so every field here is rendered somewhere in the UI.
 */
export interface CalendarEntry {
  slug: string;
  name: string;
  status: 'Saint' | 'Blessed' | 'Venerable';
  martyr: boolean;
  summary: string;
  patronage: string[];
  rank: string | null;
  /** Present when a profile overrides the display label of its feast. */
  label: string | null;
}

export interface CalendarMonth {
  month: number;
  name: string;
  /** Keyed by day of month, 1–31. Days without entries are omitted. */
  days: Record<string, CalendarEntry[]>;
  total: number;
}

const STATUS_ORDER: Record<CalendarEntry['status'], number> = {
  Saint: 0,
  Blessed: 1,
  Venerable: 2,
};

const RANK_ORDER: Record<string, number> = {
  Solemnity: 0,
  Feast: 1,
  Memorial: 2,
  'Optional Memorial': 3,
  Commemoration: 4,
};

/**
 * Canonised saints first, then blesseds, then venerables; within a group the
 * few profiles with a known liturgical rank lead, then alphabetical order.
 */
export function compareCalendarEntries(a: CalendarEntry, b: CalendarEntry): number {
  const status = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  if (status !== 0) return status;
  const rank = (a.rank ? RANK_ORDER[a.rank] ?? 9 : 9) - (b.rank ? RANK_ORDER[b.rank] ?? 9 : 9);
  if (rank !== 0) return rank;
  return a.name.localeCompare(b.name, 'en');
}

export function toCalendarEntry(saint: CollectionEntry<'saints'>): CalendarEntry {
  return {
    slug: slug(saint.id),
    name: saint.data.name,
    status: saint.data.canonizationStatus,
    martyr: saint.data.martyr,
    summary: saint.data.summary ?? '',
    patronage: saint.data.patronage,
    rank: saint.data.liturgicalRank ?? null,
    label: saint.data.feastDayLabel ?? null,
  };
}

/** Build one month of the sanctoral calendar from the content collection. */
export function buildCalendarMonth(
  saints: CollectionEntry<'saints'>[],
  month: number
): CalendarMonth {
  const days: Record<string, CalendarEntry[]> = {};
  let total = 0;

  for (const saint of saints) {
    if (saint.data.feastDay.month !== month) continue;
    const key = String(saint.data.feastDay.day);
    (days[key] ??= []).push(toCalendarEntry(saint));
    total++;
  }

  for (const list of Object.values(days)) {
    list.sort(compareCalendarEntries);
  }

  return {
    month,
    name: MONTHS[month - 1] ?? '',
    days,
    total,
  };
}
