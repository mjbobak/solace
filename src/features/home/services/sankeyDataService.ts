import { mockBudgetData } from '@/features/budget/services/mockBudgetData';
import { calculateAnnualNet, type IncomeEntry } from '@/features/income';

import type { SankeyData, SankeyPeriod } from '../types/sankeyTypes';

// Color scheme for Sankey nodes
const COLORS = {
  income: '#10b981', // Emerald
  spending: '#f43f5e', // Rose
  investments: '#3b82f6', // Blue
  essential: '#6b7280', // Gray
  funsies: '#a78bfa', // Light purple
};

/**
 * Build Sankey data showing Income → Top-level categories (Essential/Funsies) → Spending
 */
export function buildTopLevelSankeyData(
  period: SankeyPeriod,
  incomeData: IncomeEntry[],
): SankeyData {
  // 1. Aggregate income by stream
  const incomeStreams = incomeData.map((income) => ({
    name: income.stream,
    amount:
      period === 'annual'
        ? calculateAnnualNet(income)
        : calculateAnnualNet(income) / 12,
  }));

  // 2. Aggregate budget by expense type
  const essentialTotal = mockBudgetData
    .filter((b) => b.expenseType === 'ESSENTIAL')
    .reduce((sum, b) => sum + b.budgeted, 0);

  const funsiesTotal = mockBudgetData
    .filter((b) => b.expenseType === 'FUNSIES')
    .reduce((sum, b) => sum + b.budgeted, 0);

  const totalBudget = essentialTotal + funsiesTotal;

  // 3. Build nodes with colors
  const incomeNodes = incomeStreams.map((s) => ({
    name: s.name,
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

  // 4. Build links - distribute income to expense types proportionally
  const links: Array<{ source: number; target: number; value: number }> = [];

  // Income to expense types
  incomeStreams.forEach((income, incomeIdx) => {
    const essentialAllocation = (income.amount * essentialTotal) / totalBudget;
    const funsiesAllocation = (income.amount * funsiesTotal) / totalBudget;

    if (essentialAllocation > 0) {
      links.push({
        source: incomeIdx,
        target: essentialIndex,
        value: Math.round(essentialAllocation * 100) / 100,
      });
    }

    if (funsiesAllocation > 0) {
      links.push({
        source: incomeIdx,
        target: funsiesIndex,
        value: Math.round(funsiesAllocation * 100) / 100,
      });
    }
  });

  // Expense types to spending
  links.push({
    source: essentialIndex,
    target: incomeCount + 2,
    value: Math.round(essentialTotal * 100) / 100,
  });

  links.push({
    source: funsiesIndex,
    target: incomeCount + 2,
    value: Math.round(funsiesTotal * 100) / 100,
  });

  return { nodes, links };
}

/**
 * Build Sankey data showing Income → Budget categories → Spending
 */
export function buildDetailedSankeyData(
  period: SankeyPeriod,
  incomeData: IncomeEntry[],
): SankeyData {
  // 1. Aggregate income by stream
  const incomeStreams = incomeData.map((income) => ({
    name: income.stream,
    amount:
      period === 'annual'
        ? calculateAnnualNet(income)
        : calculateAnnualNet(income) / 12,
  }));

  // 2. Aggregate budget by category
  const categoryTotals: Record<string, number> = {};
  mockBudgetData.forEach((budget) => {
    const cat = budget.expenseCategory;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + budget.budgeted;
  });

  // Get unique categories sorted by total budget (descending)
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8) // Limit to top 8 categories
    .map(([name, total]) => ({ name, total }));

  // If there are more categories, group as "Other"
  const otherTotal =
    Object.values(categoryTotals).reduce((a, b) => a + b, 0) -
    sortedCategories.reduce((sum, c) => sum + c.total, 0);

  if (otherTotal > 0) {
    sortedCategories.push({ name: 'Other', total: otherTotal });
  }

  const totalBudget = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  // 3. Build nodes with colors
  const incomeNodes = incomeStreams.map((s) => ({
    name: s.name,
    fill: COLORS.income,
  }));
  const categoryNodes = sortedCategories.map((c) => ({
    name: c.name,
    fill: c.name.includes('INVESTMENT') ? COLORS.investments : COLORS.essential,
  }));
  const spendingNode = { name: 'Spending', fill: COLORS.spending };

  const nodes = [...incomeNodes, ...categoryNodes, spendingNode];
  const incomeCount = incomeNodes.length;
  const spendingIndex = incomeCount + categoryNodes.length;

  // 4. Build links
  const links: Array<{ source: number; target: number; value: number }> = [];

  // Income to categories - distribute proportionally
  incomeStreams.forEach((income, incomeIdx) => {
    sortedCategories.forEach((category, catIdx) => {
      const categoryAllocation = (income.amount * category.total) / totalBudget;

      if (categoryAllocation > 0) {
        links.push({
          source: incomeIdx,
          target: incomeCount + catIdx,
          value: Math.round(categoryAllocation * 100) / 100,
        });
      }
    });
  });

  // Categories to spending
  sortedCategories.forEach((category, catIdx) => {
    links.push({
      source: incomeCount + catIdx,
      target: spendingIndex,
      value: Math.round(category.total * 100) / 100,
    });
  });

  return { nodes, links };
}
