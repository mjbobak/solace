import type { BudgetEntry } from '@/features/budget/types/budgetView';
import { DEFAULT_EMERGENCY_FUND_BALANCE } from '@/features/income/constants/yearSettings';
import { isInvestmentCategory } from '@/features/budget/utils/investmentCategories';
import type {
  IncomeProjectionTotals,
  TaxAdvantagedInvestments,
} from '@/features/income/types/income';

export type DashboardKpiValue =
  | { kind: 'currency'; amount: number }
  | { kind: 'percentage'; amount: number }
  | { kind: 'text'; text: string };

export interface DashboardKpiRow {
  key: string;
  label: string;
  actualValue: DashboardKpiValue;
  plannedValue?: DashboardKpiValue;
  benchmark: string;
}

export interface DashboardKpiGroup {
  title: string;
  rows: DashboardKpiRow[];
}

interface BuildDashboardKpiGroupsParams {
  currentIncomeTotals: IncomeProjectionTotals | null;
  previousIncomeTotals: IncomeProjectionTotals | null;
  currentTaxAdvantagedInvestments: TaxAdvantagedInvestments | null;
  monthlyBudgetEntries: BudgetEntry[] | null;
  annualBudgetEntries: BudgetEntry[] | null;
  emergencyFundBalance?: number | null;
}

const NOT_AVAILABLE_VALUE: DashboardKpiValue = {
  kind: 'text',
  text: 'N/A',
};

const TAX_ADVANTAGED_LABEL_MATCHERS = {
  contributions529: '529',
  roth: 'ROTH',
  hsa: 'HSA',
} as const;

const KPI_BENCHMARKS: Record<string, string> = {
  'net-worth': 'Strong: trending upward year over year.',
  'net-worth-growth-rate': 'Strong: outpaces inflation and stays positive.',
  'net-worth-growth-vs-income-growth':
    'Strong: net worth grows at least as fast as income.',
  'savings-rate': 'Strong: 20%+ of after-tax income.',
  'annual-savings-amount': 'Strong: consistently positive and rising over time.',
  'annual-investment-contributions':
    'Strong: steady annual contributions with room to increase.',
  'gross-income': 'Strong: stable or growing year over year.',
  'after-tax-income': 'Strong: enough to cover spending and still save 20%+.',
  'income-growth-rate': 'Strong: positive growth each year.',
  'savings-efficiency': 'Strong: 15%+ of after-tax income remains as cash savings.',
  'total-monthly-expenses': 'Strong: low enough to leave healthy room for saving.',
  'annual-living-expenses':
    'Strong: controlled relative to take-home income.',
  'expense-growth-rate':
    'Strong: grows slower than income over time.',
  'essential-spending':
    'Strong: essentials stay well below after-tax income.',
  'funsies-spending': 'Strong: intentional and comfortably within your plan.',
  'expense-ratio': 'Strong: under 60% of after-tax income.',
  'emergency-fund-balance': 'Strong: enough cash to cover 3-6 months of essentials.',
  'emergency-fund-months': 'Strong: 3-6 months minimum, 6+ very solid.',
  'cash-reserves': 'Strong: covers near-term needs plus a buffer.',
  'tax-advantaged-contributions':
    'Strong: consistent annual contributions, ideally near account limits.',
  'tax-advantaged-savings-ratio':
    'Strong: 10%+ of after-tax income.',
  '401k-contributions':
    'Strong: enough to get the full match, ideally trending toward maxing.',
  'roth-ira-contributions':
    'Strong: consistent annual funding, ideally near the yearly limit.',
  'hsa-contributions':
    'Strong: consistent funding, ideally near the yearly limit when eligible.',
  '529-contributions':
    'Strong: consistent contributions aligned with education goals.',
  'retirement-funding-ratio':
    'Strong: on track with your long-term retirement target.',
};

function isLivingExpense(entry: BudgetEntry): boolean {
  return !isInvestmentCategory(entry.expenseCategory);
}

function isEssentialLivingExpense(entry: BudgetEntry): boolean {
  return entry.expenseType === 'ESSENTIAL' && isLivingExpense(entry);
}

function isFunsiesLivingExpense(entry: BudgetEntry): boolean {
  return entry.expenseType === 'FUNSIES' && isLivingExpense(entry);
}

function createCurrencyValue(amount: number): DashboardKpiValue {
  return {
    kind: 'currency',
    amount,
  };
}

function createPercentageValue(amount: number): DashboardKpiValue {
  return {
    kind: 'percentage',
    amount,
  };
}

function createNotAvailableValue(): DashboardKpiValue {
  return NOT_AVAILABLE_VALUE;
}

function createTextValue(text: string): DashboardKpiValue {
  return {
    kind: 'text',
    text,
  };
}

function formatAnnualBudgetAmount(monthlyAmount: number): number {
  return monthlyAmount * 12;
}

function sumBudgetEntries(
  budgetEntries: BudgetEntry[],
  predicate: (entry: BudgetEntry) => boolean,
  getAmount: (entry: BudgetEntry) => number,
): number {
  return budgetEntries
    .filter(predicate)
    .reduce((sum, entry) => sum + getAmount(entry), 0);
}

function getAnnualBudgetAmount(
  budgetEntries: BudgetEntry[],
  predicate: (entry: BudgetEntry) => boolean,
): number {
  return sumBudgetEntries(
    budgetEntries,
    predicate,
    (entry) => formatAnnualBudgetAmount(entry.budgeted),
  );
}

function getSpentAmount(
  budgetEntries: BudgetEntry[],
  predicate: (entry: BudgetEntry) => boolean,
): number {
  return sumBudgetEntries(budgetEntries, predicate, (entry) => entry.spent);
}

function getBudgetedAmount(
  budgetEntries: BudgetEntry[],
  predicate: (entry: BudgetEntry) => boolean,
): number {
  return sumBudgetEntries(budgetEntries, predicate, (entry) => entry.budgeted);
}

export function matchesBudgetLabel(
  label: string | null | undefined,
  token: string,
): boolean {
  return (label ?? '').trim().toUpperCase().includes(token.toUpperCase());
}

function getMatchedAnnualContribution(
  budgetEntries: BudgetEntry[] | null,
  token: string,
): { amount: number; hasMatch: boolean } | null {
  if (!budgetEntries) {
    return null;
  }

  const matchingEntries = budgetEntries.filter((entry) =>
    matchesBudgetLabel(entry.expenseLabel, token),
  );

  return {
    amount: matchingEntries.reduce(
      (sum, entry) => sum + formatAnnualBudgetAmount(entry.budgeted),
      0,
    ),
    hasMatch: matchingEntries.length > 0,
  };
}

function createNumericDisplayValue(
  amount: number | null,
  createValue: (value: number) => DashboardKpiValue,
): DashboardKpiValue {
  if (amount === null) {
    return createNotAvailableValue();
  }

  return createValue(amount);
}

function createPlannedValue(
  amount: number | null | undefined,
  createValue: (value: number) => DashboardKpiValue,
): DashboardKpiValue | undefined {
  if (amount === undefined) {
    return undefined;
  }

  return createNumericDisplayValue(amount, createValue);
}

function createCurrencyRow(
  key: string,
  label: string,
  actualAmount: number | null,
  plannedAmount?: number | null,
): DashboardKpiRow {
  return {
    key,
    label,
    benchmark: KPI_BENCHMARKS[key] ?? 'Strong: trending in a healthy direction.',
    actualValue: createNumericDisplayValue(actualAmount, createCurrencyValue),
    plannedValue: createPlannedValue(plannedAmount, createCurrencyValue),
  };
}

function createPercentageRow(
  key: string,
  label: string,
  actualAmount: number | null,
  plannedAmount?: number | null,
): DashboardKpiRow {
  return {
    key,
    label,
    benchmark: KPI_BENCHMARKS[key] ?? 'Strong: trending in a healthy direction.',
    actualValue: createNumericDisplayValue(actualAmount, createPercentageValue),
    plannedValue: createPlannedValue(plannedAmount, createPercentageValue),
  };
}

function createUnsupportedRow(key: string, label: string): DashboardKpiRow {
  return {
    key,
    label,
    benchmark: KPI_BENCHMARKS[key] ?? 'Strong: trending in a healthy direction.',
    actualValue: createNotAvailableValue(),
  };
}

function calculateRatio(
  numerator: number | null,
  denominator: number | null,
): number | null {
  if (numerator === null || denominator === null || denominator === 0) {
    return null;
  }

  return numerator / denominator;
}

function calculateGrowthRate(
  currentValue: number | null,
  previousValue: number | null,
): number | null {
  if (
    currentValue === null ||
    previousValue === null ||
    previousValue === 0
  ) {
    return null;
  }

  return (currentValue - previousValue) / previousValue;
}

export function formatDashboardKpiValue(value: DashboardKpiValue): string {
  switch (value.kind) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value.amount);
    case 'percentage':
      return `${(value.amount * 100).toFixed(1)}%`;
    default:
      return value.text;
  }
}

export function buildDashboardKpiGroups({
  currentIncomeTotals,
  previousIncomeTotals,
  currentTaxAdvantagedInvestments,
  monthlyBudgetEntries,
  annualBudgetEntries,
  emergencyFundBalance = DEFAULT_EMERGENCY_FUND_BALANCE,
}: BuildDashboardKpiGroupsParams): DashboardKpiGroup[] {
  const currentGrossIncome = currentIncomeTotals?.plannedGross ?? null;
  const currentAfterTaxIncome = currentIncomeTotals?.plannedNet ?? null;
  const currentCommittedAfterTaxIncome = currentIncomeTotals?.committedNet ?? null;
  const previousGrossIncome = previousIncomeTotals?.plannedGross ?? null;
  const plannedAnnualLivingExpenses = monthlyBudgetEntries
    ? getAnnualBudgetAmount(monthlyBudgetEntries, isLivingExpense)
    : null;
  const actualAnnualLivingExpenses = annualBudgetEntries
    ? getSpentAmount(annualBudgetEntries, isLivingExpense)
    : null;
  const totalMonthlyExpenses =
    plannedAnnualLivingExpenses === null ? null : plannedAnnualLivingExpenses / 12;
  const actualTotalMonthlyExpenses = monthlyBudgetEntries
    ? getSpentAmount(monthlyBudgetEntries, isLivingExpense)
    : null;
  const plannedMonthlyEssentialExpenses = monthlyBudgetEntries
    ? getBudgetedAmount(monthlyBudgetEntries, isEssentialLivingExpense)
    : null;
  const emergencyFundMonths =
    emergencyFundBalance === null ||
    plannedMonthlyEssentialExpenses === null ||
    plannedMonthlyEssentialExpenses === 0
      ? null
      : emergencyFundBalance / plannedMonthlyEssentialExpenses;
  const plannedAnnualInvestmentContributions = monthlyBudgetEntries
    ? getAnnualBudgetAmount(monthlyBudgetEntries, (entry) =>
        isInvestmentCategory(entry.expenseCategory),
      )
    : null;
  const actualAnnualInvestmentContributions = annualBudgetEntries
    ? getSpentAmount(annualBudgetEntries, (entry) =>
        isInvestmentCategory(entry.expenseCategory),
      )
    : null;
  const actualEssentialSpending = monthlyBudgetEntries
    ? getSpentAmount(monthlyBudgetEntries, isEssentialLivingExpense)
    : null;
  const plannedEssentialSpending = monthlyBudgetEntries
    ? getBudgetedAmount(monthlyBudgetEntries, isEssentialLivingExpense)
    : null;
  const actualFunsiesSpending = monthlyBudgetEntries
    ? getSpentAmount(monthlyBudgetEntries, isFunsiesLivingExpense)
    : null;
  const plannedFunsiesSpending = monthlyBudgetEntries
    ? getBudgetedAmount(monthlyBudgetEntries, isFunsiesLivingExpense)
    : null;
  const plannedAnnualSavingsAmount =
    currentAfterTaxIncome === null ||
    plannedAnnualLivingExpenses === null ||
    plannedAnnualInvestmentContributions === null
      ? null
      : currentAfterTaxIncome -
        plannedAnnualLivingExpenses -
        plannedAnnualInvestmentContributions;
  const actualAnnualSavingsAmount =
    currentCommittedAfterTaxIncome === null ||
    actualAnnualLivingExpenses === null ||
    actualAnnualInvestmentContributions === null
      ? null
      : currentCommittedAfterTaxIncome -
        actualAnnualLivingExpenses -
        actualAnnualInvestmentContributions;
  const savingsRate = calculateRatio(
    actualAnnualSavingsAmount === null ||
      actualAnnualInvestmentContributions === null
      ? null
      : actualAnnualSavingsAmount + actualAnnualInvestmentContributions,
    currentCommittedAfterTaxIncome,
  );
  const plannedSavingsRate = calculateRatio(
    plannedAnnualSavingsAmount === null ||
      plannedAnnualInvestmentContributions === null
      ? null
      : plannedAnnualSavingsAmount + plannedAnnualInvestmentContributions,
    currentAfterTaxIncome,
  );
  const savingsEfficiency = calculateRatio(
    actualAnnualSavingsAmount,
    currentCommittedAfterTaxIncome,
  );
  const plannedSavingsEfficiency = calculateRatio(
    plannedAnnualSavingsAmount,
    currentAfterTaxIncome,
  );
  const expenseRatio = calculateRatio(
    actualAnnualLivingExpenses,
    currentCommittedAfterTaxIncome,
  );
  const plannedExpenseRatio = calculateRatio(
    plannedAnnualLivingExpenses,
    currentAfterTaxIncome,
  );
  const incomeGrowthRate = calculateGrowthRate(
    currentGrossIncome,
    previousGrossIncome,
  );
  const contributions401k =
    currentTaxAdvantagedInvestments?.contributions401k ?? null;
  const annual529Contributions = getMatchedAnnualContribution(
    monthlyBudgetEntries,
    TAX_ADVANTAGED_LABEL_MATCHERS.contributions529,
  );
  const annualRothContributions = getMatchedAnnualContribution(
    monthlyBudgetEntries,
    TAX_ADVANTAGED_LABEL_MATCHERS.roth,
  );
  const annualHsaContributions = getMatchedAnnualContribution(
    monthlyBudgetEntries,
    TAX_ADVANTAGED_LABEL_MATCHERS.hsa,
  );
  const taxAdvantagedContributions =
    contributions401k === null || annual529Contributions === null
      ? null
      : contributions401k +
        annual529Contributions.amount +
        (annualRothContributions?.amount ?? 0) +
        (annualHsaContributions?.amount ?? 0);
  const taxAdvantagedSavingsRatio = calculateRatio(
    taxAdvantagedContributions,
    currentAfterTaxIncome,
  );

  return [
    {
      title: '1. Net Worth Growth',
      rows: [
        createUnsupportedRow('net-worth', 'Net Worth'),
        createUnsupportedRow(
          'net-worth-growth-rate',
          'Net Worth Growth Rate (Year-over-Year)',
        ),
        createUnsupportedRow(
          'net-worth-growth-vs-income-growth',
          'Net Worth Growth vs Income Growth',
        ),
      ],
    },
    {
      title: '2. Savings Rate',
      rows: [
        createPercentageRow(
          'savings-rate',
          'Savings Rate',
          savingsRate,
          plannedSavingsRate,
        ),
        createCurrencyRow(
          'annual-savings-amount',
          'Annual Savings Amount',
          actualAnnualSavingsAmount,
          plannedAnnualSavingsAmount,
        ),
        createCurrencyRow(
          'annual-investment-contributions',
          'Annual Investment Contributions',
          actualAnnualInvestmentContributions,
          plannedAnnualInvestmentContributions,
        ),
      ],
    },
    {
      title: '4. Income Efficiency',
      rows: [
        createCurrencyRow('gross-income', 'Gross Income', currentGrossIncome),
        createCurrencyRow(
          'after-tax-income',
          'After-Tax Income',
          currentAfterTaxIncome,
        ),
        createPercentageRow(
          'income-growth-rate',
          'Income Growth Rate',
          incomeGrowthRate,
        ),
        createPercentageRow(
          'savings-efficiency',
          'Savings Efficiency (Savings / After-Tax Income)',
          savingsEfficiency,
          plannedSavingsEfficiency,
        ),
      ],
    },
    {
      title: '5. Expense Structure',
      rows: [
        createCurrencyRow(
          'total-monthly-expenses',
          'Total Monthly Expenses',
          actualTotalMonthlyExpenses,
          totalMonthlyExpenses,
        ),
        createCurrencyRow(
          'annual-living-expenses',
          'Annual Living Expenses',
          actualAnnualLivingExpenses,
          plannedAnnualLivingExpenses,
        ),
        createUnsupportedRow('expense-growth-rate', 'Expense Growth Rate'),
        createCurrencyRow(
          'essential-spending',
          'Essential',
          actualEssentialSpending,
          plannedEssentialSpending,
        ),
        createCurrencyRow(
          'funsies-spending',
          'Funsies',
          actualFunsiesSpending,
          plannedFunsiesSpending,
        ),
        createPercentageRow(
          'expense-ratio',
          'Expense Ratio (Living Expenses / After-Tax Income)',
          expenseRatio,
          plannedExpenseRatio,
        ),
      ],
    },
    {
      title: '7. Liquidity and Safety',
      rows: [
        createCurrencyRow(
          'emergency-fund-balance',
          'Emergency Fund Balance',
          emergencyFundBalance,
        ),
        {
          key: 'emergency-fund-months',
          label: 'Emergency Fund Months (Emergency Fund / Monthly Expenses)',
          benchmark:
            KPI_BENCHMARKS['emergency-fund-months'] ??
            'Strong: trending in a healthy direction.',
          actualValue:
            emergencyFundMonths === null
              ? createNotAvailableValue()
              : createTextValue(`${emergencyFundMonths.toFixed(1)} months`),
        },
        createUnsupportedRow('cash-reserves', 'Cash Reserves'),
      ],
    },
    {
      title: '9. Tax Efficiency',
      rows: [
        createCurrencyRow(
          'tax-advantaged-contributions',
          'Tax-Advantaged Contributions',
          taxAdvantagedContributions,
        ),
        createPercentageRow(
          'tax-advantaged-savings-ratio',
          'Tax-Advantaged Savings Ratio',
          taxAdvantagedSavingsRatio,
        ),
        createCurrencyRow(
          '401k-contributions',
          '401k Contributions',
          contributions401k,
        ),
        createCurrencyRow(
          'roth-ira-contributions',
          'Roth IRA Contributions',
          annualRothContributions?.hasMatch
            ? annualRothContributions.amount
            : null,
        ),
        createCurrencyRow(
          'hsa-contributions',
          'HSA Contributions',
          annualHsaContributions?.hasMatch ? annualHsaContributions.amount : null,
        ),
        createCurrencyRow(
          '529-contributions',
          '529 Contributions',
          annual529Contributions?.amount ?? null,
        ),
        createUnsupportedRow(
          'retirement-funding-ratio',
          'Retirement Funding Ratio',
        ),
      ],
    },
  ];
}
