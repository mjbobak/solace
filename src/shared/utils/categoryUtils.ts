/**
 * Utility functions for category mapping and normalization.
 * Handles bidirectional conversion between category IDs and names.
 */

import type { ExpenseCategory } from '@/shared/types/category';

/**
 * Get category name from ID using a list of categories.
 * @param id - Category ID to look up
 * @param categories - List of available categories
 * @returns Category name if found, null otherwise
 */
export function getCategoryNameById(
  id: number,
  categories: ExpenseCategory[],
): string | null {
  const category = categories.find((cat) => cat.id === id);
  return category?.name ?? null;
}

/**
 * Get category ID from name using a list of categories.
 * @param name - Category name to look up (case-sensitive)
 * @param categories - List of available categories
 * @returns Category ID if found, null otherwise
 */
export function getCategoryIdByName(
  name: string,
  categories: ExpenseCategory[],
): number | null {
  const category = categories.find((cat) => cat.name === name);
  return category?.id ?? null;
}

/**
 * Normalize category name for matching.
 * Use this when comparing category names across different sources.
 * @param name - Category name to normalize
 * @returns Normalized name (trimmed, lowercase for comparison)
 */
export function normalizeCategoryName(name: string): string {
  return name.trim().toUpperCase();
}

/**
 * Check if two category names match (case-insensitive comparison).
 * @param name1 - First category name
 * @param name2 - Second category name
 * @returns True if names match
 */
export function categoryNamesMatch(name1: string, name2: string): boolean {
  return normalizeCategoryName(name1) === normalizeCategoryName(name2);
}
