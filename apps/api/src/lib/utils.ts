/**
 * Converts a string to Title Case if it is currently ALL CAPS.
 * If the string is already mixed case, it is returned as is.
 */
export function toFriendlyCase(str: string | null | undefined): string {
  if (!str) return str || '';

  // Only transform if it's all uppercase and has at least one letter
  const hasLetters = /[a-zA-Z]/.test(str);
  if (!hasLetters || str !== str.toUpperCase()) {
    return str;
  }

  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
