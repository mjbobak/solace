import { mockBudgetData } from '@/features/budget/services/mockBudgetData';
import type { IncomeYearProjection } from '@/features/income';
import { statusPalette } from '@/shared/theme';

import type { SankeyData, SankeyPeriod } from '../types/sankeyTypes';

const COLORS = {
  income: statusPalette.income,
  spending: statusPalette.spending,
  investments: statusPalette.investments,
  essential: statusPalette.essential,
  funsies: statusPalette.funsies,
} as const;

function getIncomeSources(
  projection: IncomeYearProjection | null,
  period: SankeyPeriod,
) {
  if (!projection) {
    return [];
  }

  return projection.sources
    .map((source) => ({
      name: source.name,
      amount:
        period === 'annual'
          ? source.totals.plannedNet
          : source.totals.plannedNet / 12,
    }))
    .filter((source) => source.amount > 0);
}

export function buildTopLevelSankeyData(
  period: SankeyPeriod,
  projection: IncomeYearProjection | null,
): SankeyData {
  const incomeSources = getIncomeSources(projection, period);
  const essentialTotal = mockBudgetData
    .filter((entry) => entry.expenseType === 'ESSENTIAL')
    .reduce((sum, entry) => sum + entry.budgeted, 0);
  const funsiesTotal = mockBudgetData
    .filter((entry) => entry.expenseType === 'FUNSIES')
    .reduce((sum, entry) => sum + entry.budgeted, 0);
  const totalBudget = essentialTotal + funsiesTotal;

  const incomeNodes = incomeSources.map((source) => ({
    name: source.name,
    fill: COLORS.income,
  }));
  const expenseNodes = [
    { name: 'ESSENTIAL', fill: COLORS.essential },
    { name: 'FUNSIES', fill: COLORS.funsies },
  ];
  const spendingNode = { name: 'Spending', fill: COLORS.spending };
  const nodes = [...incomeNodes, ...expenseNodes, spendingNode];

  const incomeCount = incomeNodes.length;
  const essentialIndex = incomeCount;
  const funsiesIndex = incomeCount + 1;
  const spendingIndex = incomeCount + 2;
  const links: Array<{ source: number; target: number; value: number }> = [];

  incomeSources.forEach((income, incomeIndex) => {
    const essentialAllocation =
      totalBudget > 0 ? (income.amount * essentialTotal) / totalBudget : 0;
    const funsiesAllocation =
      totalBudget > 0 ? (income.amount * funsiesTotal) / totalBudget : 0;

    if (essentialAllocation > 0) {
      links.push({
        source: incomeIndex,
        target: essentialIndex,
        value: Math.round(essentialAllocation * 100) / 100,
      });
    }

    if (funsiesAllocation > 0) {
      links.push({
        source: incomeIndex,
        target: funsiesIndex,
        value: Math.round(funsiesAllocation * 100) / 100,
      });
    }
  });

  links.push({
    source: essentialIndex,
    target: spendingIndex,
    value: Math.round(essentialTotal * 100) / 100,
  });
  links.push({
    source: funsiesIndex,
    target: spendingIndex,
    value: Math.round(funsiesTotal * 100) / 100,
  });

  return { nodes, links };
}

export function buildDetailedSankeyData(
  period: SankeyPeriod,
  projection: IncomeYearProjection | null,
): SankeyData {
  const incomeSources = getIncomeSources(projection, period);

  const categoryTotals: Record<string, number> = {};
  mockBudgetData.forEach((budget) => {
    categoryTotals[budget.expenseCategory] =
      (categoryTotals[budget.expenseCategory] || 0) + budget.budgeted;
  });

  const sortedCategories = Object.entries(categoryTotals)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([name, total]) => ({ name, total }));

  const otherTotal =
    Object.values(categoryTotals).reduce((sum, value) => sum + value, 0) -
    sortedCategories.reduce((sum, category) => sum + category.total, 0);

  if (otherTotal > 0) {
    sortedCategories.push({ name: 'Other', total: otherTotal });
  }

  const totalBudget = Object.values(categoryTotals).reduce(
    (sum, value) => sum + value,
    0,
  );

  const incomeNodes = incomeSources.map((source) => ({
    name: source.name,
    fill: COLORS.income,
  }));
  const categoryNodes = sortedCategories.map((category) => ({
    name: category.name,
    fill: category.name.includes('INVESTMENT')
      ? COLORS.investments
      : COLORS.essential,
  }));
  const spendingNode = { name: 'Spending', fill: COLORS.spending };
  const nodes = [...incomeNodes, ...categoryNodes, spendingNode];
  const incomeCount = incomeNodes.length;
  const spendingIndex = incomeCount + categoryNodes.length;
  const links: Array<{ source: number; target: number; value: number }> = [];

  incomeSources.forEach((income, incomeIndex) => {
    sortedCategories.forEach((category, categoryIndex) => {
      const allocation =
        totalBudget > 0 ? (income.amount * category.total) / totalBudget : 0;
      if (allocation > 0) {
        links.push({
          source: incomeIndex,
          target: incomeCount + categoryIndex,
          value: Math.round(allocation * 100) / 100,
        });
      }
    });
  });

  sortedCategories.forEach((category, categoryIndex) => {
    links.push({
      source: incomeCount + categoryIndex,
      target: spendingIndex,
      value: Math.round(category.total * 100) / 100,
    });
  });

  return { nodes, links };
}
