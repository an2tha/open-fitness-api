import { z } from '@hono/zod-openapi';

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
};

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const optionalSearchString = z.preprocess(emptyStringToUndefined, z.string().trim().max(256).optional());
export const requiredSearchString = z.preprocess(emptyStringToUndefined, z.string().trim().min(1).max(256));
export const optionalFilterString = z.preprocess(emptyStringToUndefined, z.string().trim().max(256).optional());
export const optionalNonNegativeNumber = z.preprocess(
  emptyStringToUndefined,
  z.coerce.number().finite().min(0).optional(),
);
