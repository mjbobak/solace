import type { BudgetApiResponse } from '@/features/budget/types/budgetApi';
import type { ExpenseTypeFilter } from '@/features/budget/types/budgetView';
import type { SpendingEntry } from '@/features/spending/types/spendingView';
import { getMonthlyTransactionImpacts } from '@/features/spending/utils/spreadPayments';

export type SpendingAnalysisFilter = ExpenseTypeFilter;

export interface SpendingCategoryDatum {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface DashboardSpendingAnalysis {
  totalsByFilter: Record<SpendingAnalysisFilter, number>;
  categoriesByFilter: Record<SpendingAnalysisFilter, SpendingCategoryDatum[]>;
}

const FILTERS: SpendingAnalysisFilter[] = ['ALL', 'ESSENTIAL', 'FUNSIES'];
const UNCATEGORIZED_CATEGORY = 'Uncategorized';

function createCategoryMap(): Record<SpendingAnalysisFilter, Map<string, number>> {
  return {
    ALL: new Map<string, number>(),
    ESSENTIAL: new Map<string, number>(),
    FUNSIES: new Map<string, number>(),
  };
}

function addToMap(map: Map<string, number>, category: string, amount: number) {
  map.set(category, (map.get(category) ?? 0) + amount);
}

function toSortedCategoryData(
  categoryMap: Map<string, number>,
): SpendingCategoryDatum[] {
  return [...categoryMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => {
      if (b.value !== a.value) {
        return b.value - a.value;
      }

      return a.name.localeCompare(b.name);
    });
}

export function buildDashboardSpendingAnalysis(params: {
  budgets: BudgetApiResponse[];
  transactions: SpendingEntry[];
  year: number;
}): DashboardSpendingAnalysis {
  const { budgets, transactions, year } = params;
  const budgetsById = new Map(budgets.map((budget) => [budget.id, budget]));
  const categoryMaps = createCategoryMap();

  for (const transaction of transactions) {
    const totalAmount = getMonthlyTransactionImpacts(transaction)
      .filter((impact) => impact.year === year)
      .reduce((sum, impact) => sum + impact.amount, 0);

    if (totalAmount <= 0) {
      continue;
    }

    const budget =
      transaction.budgetId !== null && transaction.budgetId !== undefined
        ? budgetsById.get(transaction.budgetId)
        : undefined;

    const categoryName = budget?.expense_category ?? UNCATEGORIZED_CATEGORY;
    addToMap(categoryMaps.ALL, categoryName, totalAmount);

    if (budget?.expense_type === 'ESSENTIAL' || budget?.expense_type === 'FUNSIES') {
      addToMap(categoryMaps[budget.expense_type], categoryName, totalAmount);
    }
  }

  return {
    totalsByFilter: FILTERS.reduce(
      (totals, filter) => {
        totals[filter] = [...categoryMaps[filter].values()].reduce(
          (sum, value) => sum + value,
          0,
        );
        return totals;
      },
      {
        ALL: 0,
        ESSENTIAL: 0,
        FUNSIES: 0,
      } as Record<SpendingAnalysisFilter, number>,
    ),
    categoriesByFilter: FILTERS.reduce(
      (categories, filter) => {
        categories[filter] = toSortedCategoryData(categoryMaps[filter]);
        return categories;
      },
      {
        ALL: [],
        ESSENTIAL: [],
        FUNSIES: [],
      } as Record<SpendingAnalysisFilter, SpendingCategoryDatum[]>,
    ),
  };
}
