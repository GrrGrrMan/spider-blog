import { z, defineCollection } from 'astro:content';

const logbookCollection = defineCollection({
  type: 'content',
  schema: z.object({
    date: z.string(),
    title: z.string(),
    order: z.number() // Used for sorting chronologically
  }),
});

export const collections = {
  'logbook': logbookCollection,
};