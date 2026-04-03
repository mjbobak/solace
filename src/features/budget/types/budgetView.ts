// View-specific types for Budget feature

export type BudgetPeriod = 'monthly' | 'annual';
export type ExpenseTypeFilter = 'ESSENTIAL' | 'FUNSIES' | 'ALL';
export type SpendBasis =
  | 'annual_full_year'
  | 'monthly_avg_elapsed'
  | 'monthly_avg_12'
  | 'monthly_current_month';

export interface BudgetEntry {
  id: string;
  expenseType: 'ESSENTIAL' | 'FUNSIES';
  expenseCategory: string;
  expenseLabel: string;
  expenseLabelNote?: string; // Optional note displayed as tooltip
  isInvestment?: boolean;
  budgeted: number;
  spent: number;
  remaining: number;
  percentage: number;
  isAccrual?: boolean; // Flag for items paid quarterly, semi-annually, or annually
}
