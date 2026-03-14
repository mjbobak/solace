import type { SpendBasis } from '@/features/budget/types/budgetView';

import {
  setMultiValueParam,
  setNumberParam,
  setStringParam,
} from '@/shared/utils/searchParams';

const SPENDING_QUERY_PARAM_KEYS = [
  'year',
  'month',
  'account',
  'budget',
  'accrual',
  'min',
  'max',
  'q',
  'page',
  'pageSize',
  'sort',
  'dir',
  'budgetId',
  'forceEmpty',
] as const;

export interface BudgetDrillThroughParams {
  baseSearchParams: URLSearchParams;
  planningYear: number;
  spendBasis: SpendBasis;
  budgetId: number;
  currentDate?: Date;
}

function clearSpendingSearchParams(searchParams: URLSearchParams): void {
  SPENDING_QUERY_PARAM_KEYS.forEach((key) => searchParams.delete(key));
}

function setBudgetDrillThroughPeriod(params: {
  searchParams: URLSearchParams;
  planningYear?: number;
  months?: string[];
  forceEmpty?: boolean;
}): void {
  const { searchParams, planningYear, months = [], forceEmpty = false } = params;

  setMultiValueParam(
    searchParams,
    'year',
    planningYear === undefined ? [] : [String(planningYear)],
  );
  setMultiValueParam(searchParams, 'month', months);
  setStringParam(searchParams, 'forceEmpty', forceEmpty ? '1' : undefined);
}

function getCompletedMonthsForYearAtDate(year: number, currentDate: Date): number {
  const currentYear = currentDate.getFullYear();

  if (year < currentYear) return 12;
  if (year > currentYear) return 0;
  return currentDate.getMonth();
}

export function buildBudgetDrillThroughSearchParams(
  params: BudgetDrillThroughParams,
): URLSearchParams {
  const {
    baseSearchParams,
    planningYear,
    spendBasis,
    budgetId,
    currentDate = new Date(),
  } = params;
  const nextSearchParams = new URLSearchParams(baseSearchParams);
  const currentMonth = currentDate.getMonth() + 1;
  const completedMonths = getCompletedMonthsForYearAtDate(
    planningYear,
    currentDate,
  );

  clearSpendingSearchParams(nextSearchParams);
  setNumberParam(nextSearchParams, 'planningYear', planningYear);
  setStringParam(nextSearchParams, 'spendBasis', spendBasis);
  setNumberParam(nextSearchParams, 'budgetId', budgetId);

  switch (spendBasis) {
    case 'annual_full_year':
    case 'monthly_avg_12':
      setBudgetDrillThroughPeriod({
        searchParams: nextSearchParams,
        planningYear,
      });
      break;
    case 'monthly_current_month':
      setBudgetDrillThroughPeriod({
        searchParams: nextSearchParams,
        planningYear,
        months: [String(currentMonth)],
      });
      break;
    case 'monthly_avg_elapsed':
      if (completedMonths === 0) {
        setBudgetDrillThroughPeriod({
          searchParams: nextSearchParams,
          forceEmpty: true,
        });
        break;
      }

      setBudgetDrillThroughPeriod({
        searchParams: nextSearchParams,
        planningYear,
        months: Array.from({ length: completedMonths }, (_, index) =>
          String(index + 1),
        ),
      });
      break;
  }

  return nextSearchParams;
}
