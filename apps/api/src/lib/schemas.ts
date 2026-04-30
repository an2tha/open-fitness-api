
import { z } from '@hono/zod-openapi';

export const paginationSchema = z.object({
  limit: z.number(),
  offset: z.number(),
  total: z.number().optional(),
  count: z.number(),
});

export function createResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    pagination: paginationSchema.optional(),
  });
}
