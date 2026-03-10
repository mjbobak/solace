/**
 * Shared expense category type used across features (budget, spending, etc.)
 */

export interface ExpenseCategory {
  id: number;
  name: string;
  created_at: string;
}
