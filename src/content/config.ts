import { z, defineCollection } from 'astro:content';

const docsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    section: z.string(),
    order: z.number(),
    badge: z.string().optional(),
  }),
});

const logbookCollection = defineCollection({
  type: 'content',
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