import { describe, expect, it } from 'vitest';

import type { BudgetEntry } from '@/features/budget/types/budgetView';
import type {
  IncomeProjectionTotals,
  TaxAdvantagedInvestments,
} from '@/features/income/types/income';
import {
  buildDashboardKpiGroups,
  matchesBudgetLabel,
} from '@/features/dashboard-infographic/utils/dashboardKpiReport';

function createIncomeTotals(
  overrides?: Partial<IncomeProjectionTotals>,
): IncomeProjectionTotals {
  return {
    committedGross: 200000,
    committedNet: 150000,
    plannedGross: 210000,
    plannedNet: 160000,
    ...overrides,
  };
}

function createTaxAdvantagedInvestments(
  overrides?: Partial<TaxAdvantagedInvestments>,
): TaxAdvantagedInvestments {
  return {
    contributions401k: 22000,
    total: 22000,
    ...overrides,
  };
}

function createBudgetEntry(
  overrides?: Partial<BudgetEntry>,
): BudgetEntry {
  return {
    id: 'BUD-0001',
    expenseType: 'ESSENTIAL',
    expenseCategory: 'HOUSING',
    expenseLabel: 'Mortgage',
    budgeted: 3000,
    spent: 0,
    remaining: 3000,
    percentage: 0,
    isAccrual: false,
    ...overrides,
  };
}

function findRow(
  groups: ReturnType<typeof buildDashboardKpiGroups>,
  key: string,
) {
  return groups.flatMap((group) => group.rows).find((row) => row.key === key);
}

describe('buildDashboardKpiGroups', () => {
  it('calculates supported KPI values from income and budget models', () => {
    const groups = buildDashboardKpiGroups({
      currentIncomeTotals: createIncomeTotals(),
      previousIncomeTotals: createIncomeTotals({ plannedGross: 200000 }),
      currentTaxAdvantagedInvestments: createTaxAdvantagedInvestments(),
      budgetEntries: [
        createBudgetEntry(),
        createBudgetEntry({
          id: 'BUD-0002',
          expenseCategory: 'INVESTMENTS',
          expenseLabel: '529A',
          budgeted: 500,
        }),
        createBudgetEntry({
          id: 'BUD-0003',
          expenseCategory: 'INVESTMENTS',
          expenseLabel: 'Roth IRA',
          budgeted: 250,
        }),
        createBudgetEntry({
          id: 'BUD-0004',
          expenseCategory: 'BENEFITS',
          expenseLabel: 'HSA',
          budgeted: 100,
        }),
      ],
    });

    expect(findRow(groups, 'gross-income')?.value).toEqual({
      kind: 'currency',
      amount: 210000,
    });
    expect(findRow(groups, 'annual-living-expenses')?.value).toEqual({
      kind: 'currency',
      amount: 37200,
    });
    expect(findRow(groups, 'annual-investment-contributions')?.value).toEqual({
      kind: 'currency',
      amount: 9000,
    });
    expect(findRow(groups, 'annual-savings-amount')?.value).toEqual({
      kind: 'currency',
      amount: 113800,
    });
    expect(findRow(groups, 'savings-rate')?.value).toEqual({
      kind: 'percentage',
      amount: 0.7675,
    });
    expect(findRow(groups, 'income-growth-rate')?.value).toEqual({
      kind: 'percentage',
      amount: 0.05,
    });
    expect(findRow(groups, '401k-contributions')?.value).toEqual({
      kind: 'currency',
      amount: 22000,
    });
    expect(findRow(groups, '529-contributions')?.value).toEqual({
      kind: 'currency',
      amount: 6000,
    });
    expect(findRow(groups, 'roth-ira-contributions')?.value).toEqual({
      kind: 'currency',
      amount: 3000,
    });
    expect(findRow(groups, 'hsa-contributions')?.value).toEqual({
      kind: 'currency',
      amount: 1200,
    });
    expect(findRow(groups, 'tax-advantaged-contributions')?.value).toEqual({
      kind: 'currency',
      amount: 32200,
    });
  });

  it('falls back to N/A when a previous-year income comparison is unavailable', () => {
    const groups = buildDashboardKpiGroups({
      currentIncomeTotals: createIncomeTotals(),
      previousIncomeTotals: null,
      currentTaxAdvantagedInvestments: createTaxAdvantagedInvestments(),
      budgetEntries: [createBudgetEntry()],
    });

    expect(findRow(groups, 'income-growth-rate')?.value).toEqual({
      kind: 'text',
      text: 'N/A',
    });
  });

  it('renders unsupported KPIs as N/A', () => {
    const groups = buildDashboardKpiGroups({
      currentIncomeTotals: createIncomeTotals(),
      previousIncomeTotals: null,
      currentTaxAdvantagedInvestments: createTaxAdvantagedInvestments(),
      budgetEntries: [createBudgetEntry()],
    });

    expect(findRow(groups, 'net-worth')?.value).toEqual({
      kind: 'text',
      text: 'N/A',
    });
    expect(findRow(groups, 'cash-reserves')?.value).toEqual({
      kind: 'text',
      text: 'N/A',
    });
    expect(findRow(groups, 'retirement-funding-ratio')?.value).toEqual({
      kind: 'text',
      text: 'N/A',
    });
  });

  it('matches tax-advantaged budget labels for 529, HSA, and Roth', () => {
    expect(matchesBudgetLabel('529A', '529')).toBe(true);
    expect(matchesBudgetLabel('Health HSA Contribution', 'HSA')).toBe(true);
    expect(matchesBudgetLabel('Backdoor Roth IRA', 'Roth')).toBe(true);
    expect(matchesBudgetLabel('Brokerage', 'Roth')).toBe(false);
  });
});
