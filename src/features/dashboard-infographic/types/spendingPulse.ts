/**
 * Types for the Spending Pulse feature
 */

export interface SpendingPulseData {
  month: string;
  budget: number;
  actual: number;
  variance: number; // budget - actual (positive = under budget)
  variancePercent: number; // (variance / budget) * 100
}

export interface SpendingPulseTableData extends SpendingPulseData {
  percentOfBudget: number; // (actual / budget) * 100
}
