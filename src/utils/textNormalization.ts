/**
 * Utility functions for text normalization, particularly for Vietnamese text
 */

/**
 * Removes diacritics (tone marks) from Vietnamese and other accented text
 * Examples: ê -> e, é -> e, ă -> a, ô -> o, etc.
 */
export function removeDiacritics(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Normalizes text for search by removing diacritics and converting to lowercase
 */
export function normalizeForSearch(text: string): string {
  return removeDiacritics(text).toLowerCase().trim();
}

/**
 * Checks if a text contains a search term (both normalized)
 */
export function containsNormalized(text: string, searchTerm: string): boolean {
  const normalizedText = normalizeForSearch(text);
  const normalizedSearchTerm = normalizeForSearch(searchTerm);
  return normalizedText.includes(normalizedSearchTerm);
}
