import z from 'zod';

export const JobsDetailSchema = z.object({
  slug: z.string(),
});
