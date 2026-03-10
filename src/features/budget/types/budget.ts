/**
 * Budget-related TypeScript types
 */

export type BudgetFrequency =
  | 'monthly'
  | 'quarterly'
  | 'semi-annual'
  | 'annual';

export interface Budget {
  id: number;
  category_id: number;
  month: number;
  year: number;
  amount: number;
  frequency: BudgetFrequency;
  monthly_equivalent: number;
}

export interface BudgetCreate {
  category_id: number;
  month: number;
  year: number;
  amount: number;
  frequency: BudgetFrequency;
}

export interface BudgetUpdate {
  amount?: number;
  frequency?: BudgetFrequency;
}

export interface BudgetVsActual {
  category_id: number;
  category_name: string;
  expense_type?: string; // 'ESSENTIAL' | 'FUNSIES'
  budgeted: number; // Monthly equivalent
  spent: number; // Actual spending (including spread allocations)
  remaining: number; // budgeted - spent
  percentage: number; // (spent / budgeted) * 100
}
