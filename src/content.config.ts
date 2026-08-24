import { defineCollection, z } from 'astro:content';

/**
 * THE COMMUNION OF SAINTS — CONTENT SCHEMA
 * ========================================
 * This Zod schema is the single source of truth for the saint data model.
 * It intentionally mirrors 1:1 the fields you would create as Sanity/Strapi
 * schemas, so a future CMS migration is a straight content move — not a
 * rewrite. See docs/CONTENT_MODEL.md for the admin guide and CMS mapping.
 */

export const feastSchema = z.object({
  /** 1-12 */
  month: z.number().int().min(1).max(12),
  /** 1-31 */
  day: z.number().int().min(1).max(31),
});

const saints = defineCollection({
  type: 'content',
  schema: z.object({
    /** Display name, e.g. "Thérèse of Lisieux" */
    name: z.string(),
    /** Short honorific line, e.g. "Virgin, Doctor of the Church" */
    honorific: z.string().default('Saint'),
    /** Formal title, e.g. "Doctor of the Church" */
    title: z.string().optional(),
    /** One-sentence description used in cards, meta descriptions, search. */
    summary: z.string().optional(),
    /**
     * Common variations users search for: "Little Flower", "Teresa of
     * Lisieux", "St. Therese", etc. Powers autocomplete tolerance.
     */
    searchAliases: z.array(z.string()).default([]),

    /* ——— Life span ——— */
    birthYear: z.number().int().nullable().optional(),
    deathYear: z.number().int().nullable().optional(),
    /** Display strings for uncertain dates, e.g. "c. 1873" / "c. 1417". */
    born: z.string().optional(),
    died: z.string().optional(),
    birthPlace: z.string().optional(),
    deathPlace: z.string().optional(),
    /** Geographic/cultural region, e.g. "Italy", "North Africa", "Holy Land". */
    region: z.string().optional(),
    /** Centuries of life, e.g. [12] or [3, 4]. */
    centuries: z.array(z.number().int()).default([]),

    /* ——— Liturgical identity ——— */
    feastDay: feastSchema,
    /** Human label if the feast is movable or known differently, e.g. "Easter" (optional). */
    feastDayLabel: z.string().optional(),
    liturgicalRank: z
      .enum(['Solemnity', 'Feast', 'Memorial', 'Optional Memorial', 'Commemoration'])
      .optional(),
    canonizationStatus: z.enum(['Saint', 'Blessed', 'Venerable']).default('Saint'),
    beatifiedDate: z.string().optional(),
    canonizedDate: z.string().optional(),

    /* ——— Vocation & identity ——— */
    vocation: z.array(z.string()).default([]),
    religiousOrder: z.string().optional(),
    patronage: z.array(z.string()).default([]),
    /** Special causes / secondary patronships not commonly listed. */
    causes: z.array(z.string()).default([]),
    symbols: z.array(z.string()).default([]),
    martyr: z.boolean().default(false),

    /* ——— Imagery ——— */
    /** Absolute URL (Wikimedia Commons, museum open access, or self-hosted). */
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    imageCredit: z.string().optional(),
    imageCreditUrl: z.string().optional(),

    /* ——— Collected content ——— */
    quotes: z
      .array(
        z.object({
          text: z.string(),
          source: z.string().optional(),
        })
      )
      .default([]),
    prayers: z
      .array(
        z.object({
          name: z.string(),
          /** Short descriptor, e.g. "Prayer for [intention]" or "Novena day 1". */
          kind: z.string().optional(),
          text: z.string(),
          source: z.string().optional(),
        })
      )
      .default([]),
    /** Key life events rendered as a timeline on the profile page. */
    lifeEvents: z
      .array(
        z.object({
          year: z.string(),
          event: z.string(),
        })
      )
      .default([]),
    /** Companions, teachers, students, fellow founders — linked by slug. */
    relatedSaints: z
      .array(
        z.object({
          name: z.string(),
          slug: z.string(),
          relation: z.string().optional(),
        })
      )
      .default([]),
    /** Citations: public-domain works, Vatican documents, museum catalogs. */
    sources: z.array(z.string()).default([]),
  }),
});

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    author: z.string().default('The Communion of Saints Editors'),
    category: z.string().default('History'),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

export const collections = { saints, articles };