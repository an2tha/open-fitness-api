import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

/** Prefix prepended to every generated key so users know it's an OFD key */
const KEY_PREFIX = 'ofd_';
/** Length of the random portion in bytes (32 bytes = 256 bits of entropy) */
const KEY_RANDOM_BYTES = 32;
/** Length of the short prefix stored for identification */
const KEY_ID_PREFIX_LEN = 8;

/**
 * Generate a new cryptographically-secure API key.
 * Returns the plaintext key (shown once) and its SHA-256 hash (stored in DB).
 */
export function generateApiKey(): {
  /** The full plaintext key to give to the user – never stored */
  plaintextKey: string;
  /** The first 8 characters of the key (after the ofd_ prefix) – stored for identification */
  keyPrefix: string;
  /** The SHA-256 hex digest of the full key – stored in DB */
  keyHash: string;
} {
  const randomPart = randomBytes(KEY_RANDOM_BYTES).toString('base64url');
  const plaintextKey = `${KEY_PREFIX}${randomPart}`;
  const keyPrefix = randomPart.slice(0, KEY_ID_PREFIX_LEN);
  const keyHash = hashApiKey(plaintextKey);

  return { plaintextKey, keyPrefix, keyHash };
}

/**
 * Produce a SHA-256 hex digest of an API key.
 * Used both at generation time and at validation time.
 */
export function hashApiKey(plaintextKey: string): string {
  return createHash('sha256').update(plaintextKey, 'utf8').digest('hex');
}

/**
 * Constant-time comparison of two hex hash strings.
 * Prevents timing side-channel attacks.
 */
export function safeCompareHashes(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}
