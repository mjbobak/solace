import { describe, expect, it } from 'vitest';

import type { BudgetEntry } from '@/features/budget/types/budgetView';
import {
  buildEmergencyRunwaySummary,
  buildDashboardMoneyFlowSummary,
  buildPlannedDashboardMoneyFlowSummary,
  buildDashboardKpiGroups,
  matchesBudgetLabel,
} from '@/features/dashboard-infographic/utils/dashboardKpiReport';
import type {
  IncomeProjectionTotals,
  IncomeYearProjection,
  ProjectedIncomeSource,
  TaxAdvantagedInvestments,
} from '@/features/income/types/income';

function createIncomeTotals(
  overrides?: Partial<IncomeProjectionTotals>,
): IncomeProjectionTotals {
  return {
    committedGross: 200000,
    committedCashNet: 150000,
    committedNet: 150000,
    plannedGross: 210000,
    plannedCashNet: 160000,
    plannedNet: 160000,
    ...overrides,
  };
}

function createTaxAdvantagedInvestments(
  overrides?: Partial<TaxAdvantagedInvestments>,
): TaxAdvantagedInvestments {
  return {
    entries: [
      { bucketType: '401k', annualAmount: 22000 },
      { bucketType: 'hsa', annualAmount: 1200 },
      { bucketType: 'fsa_daycare', annualAmount: 3500 },
      { bucketType: 'fsa_medical', annualAmount: 500 },
    ],
    lockedTotal: 23200,
    spendableTotal: 4000,
    total: 27200,
    ...overrides,
  };
}

function createProjectedSource(
  name: string,
  plannedCashNet: number,
): ProjectedIncomeSource {
  return {
    id: name.length,
    name,
    isActive: true,
    sortOrder: 0,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    totals: createIncomeTotals({ plannedCashNet }),
    components: [],
  };
}

function createProjection(
  overrides?: Partial<IncomeYearProjection>,
): IncomeYearProjection {
  return {
    year: 2025,
    totals: createIncomeTotals(),
    emergencyFundBalance: 12000,
    taxAdvantagedInvestments: createTaxAdvantagedInvestments(),
    sources: [
      createProjectedSource('Striker', 36000),
      createProjectedSource('Serious', 24000),
      createProjectedSource('Non-Standard', 12000),
    ],
    ...overrides,
  };
}

function createBudgetEntry(overrides?: Partial<BudgetEntry>): BudgetEntry {
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
      previousBudgetEntries: [
        createBudgetEntry({ spent: 30000 }),
        createBudgetEntry({
          id: 'PREV-0002',
          expenseType: 'FUNSIES',
          expenseCategory: 'DINING',
          expenseLabel: 'Restaurants',
          budgeted: 400,
          spent: 3600,
          remaining: 0,
          percentage: 1,
        }),
      ],
      spendBasis: 'annual_full_year',
      completedMonths: 12,
      emergencyFundBalance: 10000,
      budgetEntries: [
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
    expect(findRow(groups, 'after-tax-income')?.actualValue).toEqual({
      kind: 'currency',
      amount: 160000,
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
      amount: 34200,
    });
    expect(findRow(groups, 'essential-spending')?.plannedValue).toEqual({
      kind: 'currency',
      amount: 37200,
    });
    expect(findRow(groups, 'funsies-spending')?.actualValue).toEqual({
      kind: 'currency',
      amount: 4200,
    });
    expect(findRow(groups, 'funsies-spending')?.plannedValue).toEqual({
      kind: 'currency',
      amount: 4800,
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
      amount: 113400,
    });
    expect(findRow(groups, 'savings-rate')?.actualValue).toEqual({
      kind: 'percentage',
      amount: 0.76,
    });
    expect(findRow(groups, 'savings-rate')?.plannedValue).toEqual({
      kind: 'percentage',
      amount: 0.7375,
    });
    expect(findRow(groups, 'savings-rate')?.benchmark).toBe(
      'Strong: 20%+ of after-tax income.',
    );
    expect(findRow(groups, 'investment-rate')?.plannedValue).toEqual({
      kind: 'percentage',
      amount: 0.05625,
    });
    expect(findRow(groups, 'investment-rate')?.actualValue).toEqual({
      kind: 'percentage',
      amount: 0.05125,
    });
    expect(findRow(groups, 'total-monthly-expenses')?.plannedValue).toEqual({
      kind: 'currency',
      amount: 3500,
    });
    expect(findRow(groups, 'total-monthly-expenses')?.actualValue).toEqual({
      kind: 'currency',
      amount: 3200,
    });
    expect(findRow(groups, 'savings-efficiency')?.plannedValue).toEqual({
      kind: 'percentage',
      amount: 0.68125,
    });
    expect(findRow(groups, 'savings-efficiency')?.actualValue).toEqual({
      kind: 'percentage',
      amount: 0.70875,
    });
    expect(findRow(groups, 'expense-ratio')?.plannedValue).toEqual({
      kind: 'percentage',
      amount: 0.2625,
    });
    expect(findRow(groups, 'expense-ratio')?.actualValue).toEqual({
      kind: 'percentage',
      amount: 0.24,
    });
    expect(findRow(groups, 'expense-growth-rate')?.actualValue).toEqual({
      kind: 'percentage',
      amount: 0.14285714285714285,
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
    expect(
      findRow(groups, 'tax-advantaged-contributions')?.actualValue,
    ).toEqual({
      kind: 'currency',
      amount: 36200,
    });
  });

  it('falls back to N/A when a previous-year income comparison is unavailable', () => {
    const groups = buildDashboardKpiGroups({
      currentIncomeTotals: createIncomeTotals(),
      previousIncomeTotals: null,
      currentTaxAdvantagedInvestments: createTaxAdvantagedInvestments(),
      budgetEntries: [createBudgetEntry()],
      previousBudgetEntries: null,
      spendBasis: 'annual_full_year',
      completedMonths: 12,
    });

    expect(findRow(groups, 'income-growth-rate')?.actualValue).toEqual({
      kind: 'text',
      text: 'N/A',
    });
  });

  it('renders still-unsupported KPIs as N/A', () => {
    const groups = buildDashboardKpiGroups({
      currentIncomeTotals: createIncomeTotals(),
      previousIncomeTotals: null,
      currentTaxAdvantagedInvestments: createTaxAdvantagedInvestments(),
      budgetEntries: [createBudgetEntry()],
      previousBudgetEntries: null,
      spendBasis: 'annual_full_year',
      completedMonths: 12,
    });

    expect(findRow(groups, 'expense-growth-rate')?.actualValue).toEqual({
      kind: 'text',
      text: 'N/A',
    });
  });

  it('renumbers the remaining KPI groups after removing net worth growth', () => {
    const groups = buildDashboardKpiGroups({
      currentIncomeTotals: createIncomeTotals(),
      previousIncomeTotals: null,
      currentTaxAdvantagedInvestments: createTaxAdvantagedInvestments(),
      budgetEntries: [createBudgetEntry()],
      previousBudgetEntries: null,
      spendBasis: 'annual_full_year',
      completedMonths: 12,
    });

    expect(groups.map((group) => group.title)).toEqual([
      '1. Investment and Savings Efficiency',
      '2. Income Efficiency',
      '3. Expense Structure',
      '4. Liquidity and Safety',
      '5. Tax Efficiency',
    ]);
  });

  it('matches tax-advantaged budget labels for 529, HSA, and Roth', () => {
    expect(matchesBudgetLabel('529A', '529')).toBe(true);
    expect(matchesBudgetLabel('Health HSA Contribution', 'HSA')).toBe(true);
    expect(matchesBudgetLabel('Backdoor Roth IRA', 'Roth')).toBe(true);
    expect(matchesBudgetLabel('Brokerage', 'Roth')).toBe(false);
  });

  it('scales savings metrics to the selected spend basis', () => {
    const groups = buildDashboardKpiGroups({
      currentIncomeTotals: createIncomeTotals(),
      previousIncomeTotals: null,
      currentTaxAdvantagedInvestments: createTaxAdvantagedInvestments(),
      previousBudgetEntries: [
        createBudgetEntry({ spent: 8000 }),
        createBudgetEntry({
          id: 'PREV-0002',
          expenseType: 'FUNSIES',
          expenseCategory: 'DINING',
          expenseLabel: 'Restaurants',
          budgeted: 400,
          spent: 1000,
          remaining: 0,
          percentage: 1,
        }),
      ],
      budgetEntries: [
        createBudgetEntry({ spent: 9000 }),
        createBudgetEntry({
          id: 'BUD-0002',
          expenseType: 'FUNSIES',
          expenseCategory: 'DINING',
          expenseLabel: 'Restaurants',
          budgeted: 400,
          spent: 1200,
          remaining: 0,
          percentage: 1,
        }),
        createBudgetEntry({
          id: 'BUD-0003',
          expenseCategory: 'INVESTMENTS',
          expenseLabel: '529A',
          budgeted: 500,
          spent: 1500,
        }),
      ],
      spendBasis: 'monthly_avg_elapsed',
      completedMonths: 3,
    });

    expect(findRow(groups, 'annual-living-expenses')?.plannedValue).toEqual({
      kind: 'currency',
      amount: 10200,
    });
    expect(findRow(groups, 'annual-living-expenses')?.actualValue).toEqual({
      kind: 'currency',
      amount: 10200,
    });
    expect(
      findRow(groups, 'annual-investment-contributions')?.plannedValue,
    ).toEqual({
      kind: 'currency',
      amount: 1500,
    });
    expect(
      findRow(groups, 'annual-investment-contributions')?.actualValue,
    ).toEqual({
      kind: 'currency',
      amount: 1500,
    });
    expect(findRow(groups, 'annual-savings-amount')?.plannedValue).toEqual({
      kind: 'currency',
      amount: 28300,
    });
    expect(findRow(groups, 'annual-savings-amount')?.actualValue).toEqual({
      kind: 'currency',
      amount: 28300,
    });
    expect(findRow(groups, 'savings-rate')?.actualValue).toEqual({
      kind: 'percentage',
      amount: 0.745,
    });
    expect(findRow(groups, 'investment-rate')?.actualValue).toEqual({
      kind: 'percentage',
      amount: 0.0375,
    });
    expect(findRow(groups, 'savings-efficiency')?.actualValue).toEqual({
      kind: 'percentage',
      amount: 0.7075,
    });
    expect(findRow(groups, 'expense-ratio')?.actualValue).toEqual({
      kind: 'percentage',
      amount: 0.255,
    });
    expect(findRow(groups, 'expense-growth-rate')?.actualValue).toEqual({
      kind: 'percentage',
      amount: 0.13333333333333333,
    });
  });

  it('builds money-flow totals with wealth contributions separated from funsies', () => {
    const summary = buildDashboardMoneyFlowSummary({
      currentIncomeTotals: createIncomeTotals(),
      currentTaxAdvantagedInvestments: createTaxAdvantagedInvestments(),
      budgetEntries: [
        createBudgetEntry({ spent: 33000 }),
        createBudgetEntry({
          id: 'BUD-0002',
          expenseType: 'FUNSIES',
          expenseCategory: 'DINING',
          expenseLabel: 'Restaurants',
          budgeted: 400,
          spent: 4200,
          remaining: 0,
          percentage: 1,
        }),
        createBudgetEntry({
          id: 'BUD-0003',
          expenseType: 'FUNSIES',
          expenseCategory: 'INVESTMENTS',
          expenseLabel: 'Brokerage',
          budgeted: 500,
          spent: 5400,
          remaining: 0,
          percentage: 1,
        }),
      ],
      spendBasis: 'annual_full_year',
      completedMonths: 12,
    });

    expect(summary.netIncome).toBe(160000);
    expect(summary.essentialSpending).toBe(33000);
    expect(summary.investmentAmount).toBe(5400);
    expect(summary.preTax401kContribution).toBe(22000);
    expect(summary.savingsAmount).toBe(117400);
    expect(summary.netIncomeWealthContribution).toBe(122800);
    expect(summary.wealthContribution).toBe(144800);
    expect(summary.funsiesSpending).toBe(4200);
  });

  it('builds planned money-flow totals from annual budget allocations', () => {
    const summary = buildPlannedDashboardMoneyFlowSummary({
      currentIncomeTotals: createIncomeTotals(),
      currentTaxAdvantagedInvestments: createTaxAdvantagedInvestments(),
      budgetEntries: [
        createBudgetEntry({ budgeted: 3000, spent: 33000 }),
        createBudgetEntry({
          id: 'BUD-0002',
          expenseType: 'FUNSIES',
          expenseCategory: 'DINING',
          expenseLabel: 'Restaurants',
          budgeted: 400,
          spent: 4200,
          remaining: 0,
          percentage: 1,
        }),
        createBudgetEntry({
          id: 'BUD-0003',
          expenseType: 'FUNSIES',
          expenseCategory: 'INVESTMENTS',
          expenseLabel: 'Brokerage',
          budgeted: 500,
          spent: 5400,
          remaining: 0,
          percentage: 1,
        }),
      ],
    });

    expect(summary.netIncome).toBe(160000);
    expect(summary.essentialSpending).toBe(36000);
    expect(summary.funsiesSpending).toBe(4800);
    expect(summary.investmentAmount).toBe(6000);
    expect(summary.savingsAmount).toBe(113200);
    expect(summary.netIncomeWealthContribution).toBe(119200);
    expect(summary.preTax401kContribution).toBe(22000);
    expect(summary.wealthContribution).toBe(141200);
  });

  it('uses the explicit investment flag instead of relying on expense category names', () => {
    const summary = buildDashboardMoneyFlowSummary({
      currentIncomeTotals: createIncomeTotals(),
      currentTaxAdvantagedInvestments: createTaxAdvantagedInvestments(),
      budgetEntries: [
        createBudgetEntry({ spent: 33000 }),
        createBudgetEntry({
          id: 'BUD-0002',
          expenseType: 'FUNSIES',
          expenseCategory: 'DINING',
          expenseLabel: 'Brokerage',
          budgeted: 500,
          spent: 5400,
          remaining: 0,
          percentage: 1,
          isInvestment: true,
        }),
        createBudgetEntry({
          id: 'BUD-0003',
          expenseType: 'FUNSIES',
          expenseCategory: 'INVESTMENTS',
          expenseLabel: 'Legacy Category',
          budgeted: 250,
          spent: 0,
          remaining: 250,
          percentage: 0,
          isInvestment: false,
        }),
      ],
      spendBasis: 'annual_full_year',
      completedMonths: 12,
    });

    expect(summary.investmentAmount).toBe(5400);
    expect(summary.funsiesSpending).toBe(0);
  });
});

describe('buildEmergencyRunwaySummary', () => {
  it('builds loss-of-income scenarios from report inputs and ignores non-standard income', () => {
    const summary = buildEmergencyRunwaySummary({
      projection: createProjection(),
      budgetEntries: [
        createBudgetEntry({ budgeted: 4000 }),
        createBudgetEntry({
          id: 'BUD-0002',
          expenseType: 'FUNSIES',
          expenseCategory: 'DINING',
          expenseLabel: 'Restaurants',
          budgeted: 1200,
        }),
      ],
    });

    expect(summary.emergencyFundBalance).toBe(12000);
    expect(summary.monthlyEssentialExpenses).toBe(4000);
    expect(summary.baselineMonths).toBe(3);
    expect(summary.scenarios).toEqual([
      {
        key: 'striker',
        label: 'If Striker disappears',
        sourceName: 'Striker',
        lostMonthlyIncome: 3000,
        remainingMonthlyIncome: 2000,
        monthlyShortfall: 2000,
        runwayMonths: 6,
      },
      {
        key: 'serious',
        label: 'If Serious disappears',
        sourceName: 'Serious',
        lostMonthlyIncome: 2000,
        remainingMonthlyIncome: 3000,
        monthlyShortfall: 1000,
        runwayMonths: 12,
      },
    ]);
  });
});
