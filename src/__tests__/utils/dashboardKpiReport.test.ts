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
      emergencyFundBalance: 10000,
      monthlyBudgetEntries: [
        createBudgetEntry({ spent: 2800 }),
        createBudgetEntry({
          id: 'BUD-0002',
          expenseType: 'FUNSIES',
          expenseCategory: 'DINING',
          expenseLabel: 'Restaurants',
          budgeted: 400,
          spent: 350,
          remaining: 50,
          percentage: 0.875,
        }),
        createBudgetEntry({
          id: 'BUD-0003',
          expenseCategory: 'INVESTMENTS',
          expenseLabel: '529A',
          budgeted: 500,
          spent: 500,
        }),
        createBudgetEntry({
          id: 'BUD-0004',
          expenseCategory: 'INVESTMENTS',
          expenseLabel: 'Roth IRA',
          budgeted: 250,
          spent: 250,
        }),
        createBudgetEntry({
          id: 'BUD-0005',
          expenseCategory: 'BENEFITS',
          expenseLabel: 'HSA',
          budgeted: 100,
          spent: 100,
        }),
      ],
      annualBudgetEntries: [
        createBudgetEntry({ spent: 33000 }),
        createBudgetEntry({
          id: 'BUD-0002',
          expenseType: 'FUNSIES',
          expenseCategory: 'DINING',
          expenseLabel: 'Restaurants',
          budgeted: 400,
          spent: 4200,
          remaining: 50,
          percentage: 0.875,
        }),
        createBudgetEntry({
          id: 'BUD-0003',
          expenseCategory: 'INVESTMENTS',
          expenseLabel: '529A',
          budgeted: 500,
          spent: 5400,
        }),
        createBudgetEntry({
          id: 'BUD-0004',
          expenseCategory: 'INVESTMENTS',
          expenseLabel: 'Roth IRA',
          budgeted: 250,
          spent: 2800,
        }),
        createBudgetEntry({
          id: 'BUD-0005',
          expenseCategory: 'BENEFITS',
          expenseLabel: 'HSA',
          budgeted: 100,
          spent: 1200,
        }),
      ],
    });

    expect(findRow(groups, 'gross-income')?.actualValue).toEqual({
      kind: 'currency',
      amount: 210000,
    });
    expect(findRow(groups, 'annual-living-expenses')?.plannedValue).toEqual({
      kind: 'currency',
      amount: 42000,
    });
    expect(findRow(groups, 'annual-living-expenses')?.actualValue).toEqual({
      kind: 'currency',
      amount: 38400,
    });
    expect(
      findRow(groups, 'annual-investment-contributions')?.plannedValue,
    ).toEqual({
      kind: 'currency',
      amount: 9000,
    });
    expect(
      findRow(groups, 'annual-investment-contributions')?.actualValue,
    ).toEqual({
      kind: 'currency',
      amount: 8200,
    });
    expect(findRow(groups, 'essential-spending')?.actualValue).toEqual({
      kind: 'currency',
      amount: 2900,
    });
    expect(findRow(groups, 'essential-spending')?.plannedValue).toEqual({
      kind: 'currency',
      amount: 3100,
    });
    expect(findRow(groups, 'funsies-spending')?.actualValue).toEqual({
      kind: 'currency',
      amount: 350,
    });
    expect(findRow(groups, 'funsies-spending')?.plannedValue).toEqual({
      kind: 'currency',
      amount: 400,
    });
    expect(findRow(groups, 'emergency-fund-balance')?.actualValue).toEqual({
      kind: 'currency',
      amount: 10000,
    });
    expect(findRow(groups, 'emergency-fund-months')?.actualValue).toEqual({
      kind: 'text',
      text: '3.2 months',
    });
    expect(findRow(groups, 'annual-savings-amount')?.plannedValue).toEqual({
      kind: 'currency',
      amount: 109000,
    });
    expect(findRow(groups, 'annual-savings-amount')?.actualValue).toEqual({
      kind: 'currency',
      amount: 103400,
    });
    expect(findRow(groups, 'savings-rate')?.actualValue).toEqual({
      kind: 'percentage',
      amount: 0.744,
    });
    expect(findRow(groups, 'savings-rate')?.plannedValue).toEqual({
      kind: 'percentage',
      amount: 0.7375,
    });
    expect(findRow(groups, 'savings-rate')?.benchmark).toBe(
      'Strong: 20%+ of after-tax income.',
    );
    expect(findRow(groups, 'total-monthly-expenses')?.plannedValue).toEqual({
      kind: 'currency',
      amount: 3500,
    });
    expect(findRow(groups, 'total-monthly-expenses')?.actualValue).toEqual({
      kind: 'currency',
      amount: 3250,
    });
    expect(findRow(groups, 'savings-efficiency')?.plannedValue).toEqual({
      kind: 'percentage',
      amount: 0.68125,
    });
    expect(findRow(groups, 'savings-efficiency')?.actualValue).toEqual({
      kind: 'percentage',
      amount: 0.6893333333333334,
    });
    expect(findRow(groups, 'expense-ratio')?.plannedValue).toEqual({
      kind: 'percentage',
      amount: 0.2625,
    });
    expect(findRow(groups, 'expense-ratio')?.actualValue).toEqual({
      kind: 'percentage',
      amount: 0.256,
    });
    expect(findRow(groups, 'income-growth-rate')?.actualValue).toEqual({
      kind: 'percentage',
      amount: 0.05,
    });
    expect(findRow(groups, '401k-contributions')?.actualValue).toEqual({
      kind: 'currency',
      amount: 22000,
    });
    expect(findRow(groups, '529-contributions')?.actualValue).toEqual({
      kind: 'currency',
      amount: 6000,
    });
    expect(findRow(groups, 'roth-ira-contributions')?.actualValue).toEqual({
      kind: 'currency',
      amount: 3000,
    });
    expect(findRow(groups, 'hsa-contributions')?.actualValue).toEqual({
      kind: 'currency',
      amount: 1200,
    });
    expect(findRow(groups, 'tax-advantaged-contributions')?.actualValue).toEqual({
      kind: 'currency',
      amount: 32200,
    });
  });

  it('falls back to N/A when a previous-year income comparison is unavailable', () => {
    const groups = buildDashboardKpiGroups({
      currentIncomeTotals: createIncomeTotals(),
      previousIncomeTotals: null,
      currentTaxAdvantagedInvestments: createTaxAdvantagedInvestments(),
      monthlyBudgetEntries: [createBudgetEntry()],
      annualBudgetEntries: [createBudgetEntry()],
    });

    expect(findRow(groups, 'income-growth-rate')?.actualValue).toEqual({
      kind: 'text',
      text: 'N/A',
    });
  });

  it('renders unsupported KPIs as N/A', () => {
    const groups = buildDashboardKpiGroups({
      currentIncomeTotals: createIncomeTotals(),
      previousIncomeTotals: null,
      currentTaxAdvantagedInvestments: createTaxAdvantagedInvestments(),
      monthlyBudgetEntries: [createBudgetEntry()],
      annualBudgetEntries: [createBudgetEntry()],
    });

    expect(findRow(groups, 'net-worth')?.actualValue).toEqual({
      kind: 'text',
      text: 'N/A',
    });
    expect(findRow(groups, 'cash-reserves')?.actualValue).toEqual({
      kind: 'text',
      text: 'N/A',
    });
    expect(findRow(groups, 'retirement-funding-ratio')?.actualValue).toEqual({
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
