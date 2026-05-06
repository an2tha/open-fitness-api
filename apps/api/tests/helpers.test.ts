import { describe, expect, test } from 'bun:test';
import { z } from 'zod';
import { fromZodError, ValidationError } from '../src/lib/error';
import { hashApiKey, safeCompareHashes } from '../src/lib/api-key';
import { toFriendlyCase } from '../src/lib/utils';

describe('API helpers', () => {
  test('toFriendlyCase should normalize all-caps strings', () => {
    expect(toFriendlyCase('VITAMIN C')).toBe('Vitamin C');
    expect(toFriendlyCase('ALL CAPS NAME')).toBe('All Caps Name');
    expect(toFriendlyCase('Mixed Case')).toBe('Mixed Case');
    expect(toFriendlyCase(null)).toBe('');
  });

  test('hashApiKey and safeCompareHashes should work together', () => {
    const key = 'ofd_1234567890abcdefghijklmnopqrstuvwxyz';
    const hash = hashApiKey(key);

    expect(hash).toHaveLength(64);
    expect(safeCompareHashes(hash, hash)).toBe(true);
    expect(safeCompareHashes(hash, '0'.repeat(63) + '1')).toBe(false);
    expect(safeCompareHashes(hash, hash.slice(0, 63))).toBe(false);
  });

  test('fromZodError should convert validation errors', () => {
    const schema = z.object({ age: z.number().int().positive() });

    let caught: unknown;
    try {
      schema.parse({ age: -1 });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeTruthy();
    const validationError = fromZodError(caught as z.ZodError);
    expect(validationError).toBeInstanceOf(ValidationError);
    expect(validationError.code).toBe('VALIDATION_ERROR');
    expect(validationError.message).toContain('age');
  });
});
