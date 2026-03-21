import { statusPalette } from '@/shared/theme';

import type { DashboardMoneyFlowSummary } from '../utils/dashboardKpiReport';
import type { SankeyData } from '../types/sankeyTypes';

const COLORS = {
  income: statusPalette.income,
  essential: statusPalette.budget,
  funsies: statusPalette.funsies,
  wealth: statusPalette.investments,
} as const;

function sanitizeAmount(amount: number | null): number {
  if (amount === null || !Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return Math.round(amount * 100) / 100;
}

export function buildAnnualMoneyFlowSankeyData(
  summary: DashboardMoneyFlowSummary | null,
): SankeyData {
  const netIncome = sanitizeAmount(summary?.netIncome ?? null);
  const preTax401kContribution = sanitizeAmount(
    summary?.preTax401kContribution ?? null,
  );
  const essentialSpending = sanitizeAmount(summary?.essentialSpending ?? null);
  const netIncomeWealthContribution = sanitizeAmount(
    summary?.netIncomeWealthContribution ?? null,
  );
  const funsiesSpending = sanitizeAmount(summary?.funsiesSpending ?? null);

  if (netIncome === 0 && preTax401kContribution === 0) {
    return { nodes: [], links: [] };
  }

  return {
    nodes: [
      { name: 'Annual Net Income', fill: COLORS.income },
      { name: 'Pre-Tax 401(k)', fill: COLORS.wealth },
      { name: 'Essential Spending', fill: COLORS.essential },
      { name: 'Funsies Spending', fill: COLORS.funsies },
      { name: 'Wealth Contribution', fill: COLORS.wealth },
    ],
    links: [
      {
        source: 0,
        target: 2,
        value: essentialSpending,
      },
      {
        source: 0,
        target: 3,
        value: funsiesSpending,
      },
      {
        source: 0,
        target: 4,
        value: netIncomeWealthContribution,
      },
      {
        source: 1,
        target: 4,
        value: preTax401kContribution,
      },
    ].filter((link) => link.value > 0),
  };
}
