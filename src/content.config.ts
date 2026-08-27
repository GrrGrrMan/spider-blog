import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const docsCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    section: z.string(),
    order: z.number(),
    badge: z.string().optional(),
  }),
});

const logbookCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/logbook' }),
  schema: z.object({
    date: z.string(),
    title: z.string(),
    order: z.number(),
    tag: z.string().optional(),
    tagType: z.enum(['research', 'build', 'fail', 'success', 'ai']).optional(),
  }),
});

export const collections = {
  docs: docsCollection,
  logbook: logbookCollection,
};