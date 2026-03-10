/**
 * Type adapter functions for converting between backend API types and frontend view types
 */

import type {
  BudgetApiCreate,
  BudgetApiResponse,
  BudgetApiUpdate,
} from '@/features/budget/types/budgetApi';
import type { BudgetEntry } from '@/features/budget/types/budgetView';

/**
 * Convert backend API response to frontend view type
 * - Transforms snake_case field names to camelCase
 * - Converts integer ID to string ID format (e.g., "BUD-0042")
 * - Calculates derived fields (spent, remaining, percentage)
 * - Merges spending data from transactions if provided
 *
 * @param apiResponse - Backend API response
 * @param spendingMap - Optional map of budget ID -> spent amount
 */
export function backendToView(
  apiResponse: BudgetApiResponse,
  spendingMap?: Map<number, number>,
  options?: {
    comparisonBudget?: number;
  },
): BudgetEntry {
  // Use spending from map if available, otherwise 0
  const spent = spendingMap?.get(apiResponse.id) ?? 0;
  const budgeted = apiResponse.budgeted;
  const comparisonBudget = options?.comparisonBudget ?? budgeted;

  return {
    id: formatStringId(apiResponse.id),
    expenseType: apiResponse.expense_type as 'ESSENTIAL' | 'FUNSIES',
    expenseCategory: apiResponse.expense_category,
    expenseLabel: apiResponse.expense_label,
    expenseLabelNote: apiResponse.expense_label_note,
    budgeted,
    spent,
    remaining: comparisonBudget - spent,
    percentage: comparisonBudget > 0 ? (spent / comparisonBudget) * 100 : 0,
    isAccrual: apiResponse.is_accrual,
  };
}

/**
 * Convert frontend view type to backend create request
 * - Transforms camelCase field names to snake_case
 * - Omits derived fields (id, spent, remaining, percentage)
 * - Note: expenseCategory is a string name that will be matched to an ID by the API
 *   (or the category service can provide the ID mapping)
 */
export function viewToCreateRequest(
  entry: Omit<BudgetEntry, 'id' | 'spent' | 'remaining' | 'percentage'>,
): BudgetApiCreate {
  return {
    expense_type: entry.expenseType,
    expense_category: entry.expenseCategory,
    expense_label: entry.expenseLabel,
    expense_label_note: entry.expenseLabelNote,
    budgeted: entry.budgeted,
    is_accrual: entry.isAccrual ?? false,
  };
}

/**
 * Convert partial updates to backend update request
 * - Transforms camelCase field names to snake_case
 * - Only includes fields that are provided (for partial updates)
 */
export function viewToUpdateRequest(
  updates: Omit<BudgetEntry, 'id' | 'spent' | 'remaining' | 'percentage'>,
): BudgetApiUpdate {
  const request: BudgetApiUpdate = {};

  if (updates.expenseType !== undefined)
    request.expense_type = updates.expenseType;
  if (updates.expenseCategory !== undefined)
    request.expense_category = updates.expenseCategory;
  if (updates.expenseLabel !== undefined)
    request.expense_label = updates.expenseLabel;
  if (updates.expenseLabelNote !== undefined)
    request.expense_label_note = updates.expenseLabelNote;
  if (updates.budgeted !== undefined) request.budgeted = updates.budgeted;
  if (updates.isAccrual !== undefined) request.is_accrual = updates.isAccrual;

  return request;
}

/**
 * Extract numeric ID from string ID format
 * Example: "BUD-0042" → 42
 *
 * @throws Error if ID format is invalid
 */
export function extractNumericId(stringId: string): number {
  const match = stringId.match(/\d+/);
  if (!match) {
    throw new Error(`Invalid budget ID format: ${stringId}`);
  }
  return parseInt(match[0], 10);
}

/**
 * Format numeric ID to string ID format
 * Example: 42 → "BUD-0042"
 */
export function formatStringId(numericId: number): string {
  return `BUD-${String(numericId).padStart(4, '0')}`;
}
