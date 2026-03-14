import type { SpendBasis } from '@/features/budget/types/budgetView';

export const DEFAULT_SPEND_BASIS: SpendBasis = 'monthly_avg_elapsed';

export const SPEND_BASIS_OPTIONS: ReadonlyArray<{
  value: SpendBasis;
  label: string;
}> = [
  { value: 'annual_full_year', label: 'Full Year' },
  {
    value: 'monthly_avg_elapsed',
    label: 'Completed Months',
  },
  {
    value: 'monthly_current_month',
    label: 'Current Month',
  },
];

export function getAvailableSpendBasisOptions(
  planningYear: number,
  currentYear: number = new Date().getFullYear(),
): ReadonlyArray<{
  value: SpendBasis;
  label: string;
}> {
  if (planningYear === currentYear) {
    return SPEND_BASIS_OPTIONS;
  }

  return SPEND_BASIS_OPTIONS.filter(
    (option) => option.value === 'annual_full_year',
  );
}

export function isSpendBasis(
  value: string | null | undefined,
): value is SpendBasis {
  return (
    value === 'annual_full_year' ||
    value === 'monthly_avg_elapsed' ||
    value === 'monthly_avg_12' ||
    value === 'monthly_current_month'
  );
}

export function normalizeSpendBasisForPlanningYear(
  spendBasis: SpendBasis,
  planningYear: number,
  currentYear: number = new Date().getFullYear(),
): SpendBasis {
  if (planningYear !== currentYear && spendBasis !== 'annual_full_year') {
    return 'annual_full_year';
  }

  return spendBasis;
}

export function getComparisonBudgetForSpendBasis(params: {
  spendBasis: SpendBasis;
  monthlyBudget: number;
  completedMonths: number;
}): number {
  const { spendBasis, monthlyBudget, completedMonths } = params;

  switch (spendBasis) {
    case 'annual_full_year':
      return monthlyBudget * 12;
    case 'monthly_avg_elapsed':
      return monthlyBudget * completedMonths;
    case 'monthly_current_month':
    case 'monthly_avg_12':
      return monthlyBudget;
    default:
      return monthlyBudget;
  }
}

export function scaleAnnualAmountForSpendBasis(params: {
  annualAmount: number;
  spendBasis: SpendBasis;
  completedMonths: number;
}): number {
  const { annualAmount, spendBasis, completedMonths } = params;

  switch (spendBasis) {
    case 'annual_full_year':
      return annualAmount;
    case 'monthly_avg_elapsed':
      return (annualAmount / 12) * completedMonths;
    case 'monthly_current_month':
    case 'monthly_avg_12':
      return annualAmount / 12;
    default:
      return annualAmount;
  }
}

export function getCompletedMonthsForYear(year: number): number {
  const now = new Date();
  const currentYear = now.getFullYear();

  if (year < currentYear) return 12;
  if (year > currentYear) return 0;
  return now.getMonth();
}

export function getSpendBasisLabel(spendBasis: SpendBasis): string {
  switch (spendBasis) {
    case 'annual_full_year':
      return 'Annual - Full year';
    case 'monthly_avg_elapsed':
      return 'Total for completed months';
    case 'monthly_avg_12':
      return 'Avg per 12 months';
    case 'monthly_current_month':
      return 'Current month actual';
    default:
      return 'Spending';
  }
}

export function getSpendBasisHelpText(params: {
  spendBasis: SpendBasis;
  year: number;
  longMonth: string;
  completedMonths: number;
}): string {
  const { spendBasis, year, longMonth, completedMonths } = params;

  if (spendBasis === 'annual_full_year') {
    return `Using full-year ${year} actuals (12 months).`;
  }

  if (spendBasis === 'monthly_avg_12') {
    return `Using ${year} totals divided by 12 months.`;
  }

  if (spendBasis === 'monthly_current_month') {
    return `Using ${longMonth} ${year} actuals.`;
  }

  if (completedMonths === 0) {
    return `Using completed months only for ${year} (none completed yet).`;
  }

  const endMonth = new Date(year, completedMonths - 1, 1).toLocaleString(
    'en-US',
    { month: 'short' },
  );
  return `Using Jan-${endMonth} ${year} actuals (${completedMonths} completed month${completedMonths === 1 ? '' : 's'}).`;
}
