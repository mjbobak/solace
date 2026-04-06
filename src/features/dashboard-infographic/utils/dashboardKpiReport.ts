import type {
  BudgetEntry,
  SpendBasis,
} from '@/features/budget/types/budgetView';
import { isInvestmentBudgetEntry } from '@/features/budget/utils/investmentCategories';
import { DEFAULT_EMERGENCY_FUND_BALANCE } from '@/features/income/constants/yearSettings';
import type {
  IncomeProjectionTotals,
  IncomeYearProjection,
  ProjectedIncomeSource,
  TaxAdvantagedInvestments,
} from '@/features/income/types/income';
import {
  getComparisonBudgetForSpendBasis,
  scaleAnnualAmountForSpendBasis,
} from '@/shared/utils/spendBasis';

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

export interface DashboardMoneyFlowSummary {
  netIncome: number | null;
  essentialSpending: number | null;
  funsiesSpending: number | null;
  savingsAmount: number | null;
  investmentAmount: number | null;
  preTax401kContribution: number | null;
  netIncomeWealthContribution: number | null;
  wealthContribution: number | null;
}

export interface EmergencyRunwayScenario {
  key: 'primary' | 'secondary';
  label: string;
  sourceId: number | null;
  sourceName: string | null;
  lostMonthlyIncome: number | null;
  remainingMonthlyIncome: number | null;
  monthlyShortfall: number | null;
  runwayMonths: number | null;
}

export interface EmergencyRunwaySummary {
  emergencyFundBalance: number | null;
  monthlyEssentialExpenses: number | null;
  baselineMonths: number | null;
  scenarios: EmergencyRunwayScenario[];
}

interface RunwayScenarioDefinition {
  key: EmergencyRunwayScenario['key'];
  fallbackLabel: string;
}

interface BuildDashboardKpiGroupsParams {
  currentIncomeTotals: IncomeProjectionTotals | null;
  previousIncomeTotals: IncomeProjectionTotals | null;
  currentTaxAdvantagedInvestments: TaxAdvantagedInvestments | null;
  budgetEntries: BudgetEntry[] | null;
  previousBudgetEntries: BudgetEntry[] | null;
  spendBasis: SpendBasis;
  completedMonths: number;
  emergencyFundBalance?: number | null;
}

interface BuildDashboardMoneyFlowSummaryParams {
  currentIncomeTotals: IncomeProjectionTotals | null;
  currentTaxAdvantagedInvestments: TaxAdvantagedInvestments | null;
  budgetEntries: BudgetEntry[] | null;
  spendBasis: SpendBasis;
  completedMonths: number;
}

interface BuildPlannedDashboardMoneyFlowSummaryParams {
  currentIncomeTotals: IncomeProjectionTotals | null;
  currentTaxAdvantagedInvestments: TaxAdvantagedInvestments | null;
  budgetEntries: BudgetEntry[] | null;
}

interface CreateDashboardMoneyFlowSummaryParams {
  netIncome: number | null;
  essentialSpending: number | null;
  funsiesSpending: number | null;
  savingsAmount: number | null;
  investmentAmount: number | null;
  preTax401kContribution: number | null;
}

const NOT_AVAILABLE_VALUE: DashboardKpiValue = {
  kind: 'text',
  text: 'N/A',
};

const TAX_ADVANTAGED_LABEL_MATCHERS = {
  contributions529: '529',
  roth: 'ROTH',
} as const;

const RUNWAY_SCENARIO_DEFINITIONS: ReadonlyArray<RunwayScenarioDefinition> = [
  { key: 'primary', fallbackLabel: 'Primary income loss' },
  { key: 'secondary', fallbackLabel: 'Secondary income loss' },
];

const KPI_BENCHMARKS: Record<string, string> = {
  'savings-rate': 'Strong: 20%+ of after-tax income.',
  'investment-rate': 'Strong: 15%+ of after-tax income invested consistently.',
  'annual-savings-amount':
    'Strong: consistently positive and rising over time.',
  'annual-investment-contributions':
    'Strong: steady annual contributions with room to increase.',
  'gross-income': 'Strong: stable or growing year over year.',
  'after-tax-income': 'Strong: enough to cover spending and still save 20%+.',
  'income-growth-rate': 'Strong: positive growth each year.',
  'savings-efficiency':
    'Strong: 15%+ of after-tax income remains as cash savings.',
  'total-monthly-expenses':
    'Strong: low enough to leave healthy room for saving.',
  'annual-living-expenses': 'Strong: controlled relative to take-home income.',
  'expense-growth-rate': 'Strong: grows slower than income over time.',
  'essential-spending': 'Strong: essentials stay well below after-tax income.',
  'funsies-spending': 'Strong: intentional and comfortably within your plan.',
  'expense-ratio': 'Strong: under 60% of after-tax income.',
  'emergency-fund-balance':
    'Strong: enough cash to cover 3-6 months of essentials.',
  'emergency-fund-months': 'Strong: 3-6 months minimum, 6+ very solid.',
  'cash-reserves': 'Strong: covers near-term needs plus a buffer.',
  'tax-advantaged-contributions':
    'Strong: consistent annual contributions, ideally near account limits.',
  'tax-advantaged-savings-ratio': 'Strong: 10%+ of after-tax income.',
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
  return !isInvestmentBudgetEntry(entry);
}

function isEssentialLivingExpense(entry: BudgetEntry): boolean {
  return entry.expenseType === 'ESSENTIAL' && isLivingExpense(entry);
}

function isFunsiesLivingExpense(entry: BudgetEntry): boolean {
  return entry.expenseType === 'FUNSIES' && isLivingExpense(entry);
}

function normalizeRunwaySourceName(name: string | null | undefined): string {
  return (name ?? '').trim().toUpperCase();
}

function isIgnoredRunwaySource(source: ProjectedIncomeSource): boolean {
  const normalizedName = normalizeRunwaySourceName(source.name);
  return (
    normalizedName.includes('NON STANDARD') ||
    normalizedName.includes('NON-STANDARD')
  );
}

function getRelevantRunwaySources(
  projection: IncomeYearProjection | null,
): ProjectedIncomeSource[] {
  return (projection?.sources ?? []).filter(
    (source) => !isIgnoredRunwaySource(source),
  );
}

function compareRunwaySourcePriority(
  left: ProjectedIncomeSource,
  right: ProjectedIncomeSource,
): number {
  const monthlyNetDifference =
    getSourceMonthlyCashNet(right) - getSourceMonthlyCashNet(left);
  if (monthlyNetDifference !== 0) {
    return monthlyNetDifference;
  }

  const sortOrderDifference = left.sortOrder - right.sortOrder;
  if (sortOrderDifference !== 0) {
    return sortOrderDifference;
  }

  const nameDifference = left.name.localeCompare(right.name);
  if (nameDifference !== 0) {
    return nameDifference;
  }

  return left.id - right.id;
}

function resolveRunwayScenarioSources(
  projection: IncomeYearProjection | null,
): Record<EmergencyRunwayScenario['key'], ProjectedIncomeSource | null> {
  const relevantSources = getRelevantRunwaySources(projection);
  const sourcesById = new Map(
    relevantSources.map((source) => [source.id, source] as const),
  );
  const fallbackSources = [...relevantSources].sort(compareRunwaySourcePriority);
  const configuredSourceIds = [
    projection?.primaryRunwaySourceId ?? null,
    projection?.secondaryRunwaySourceId ?? null,
  ];
  const usedSourceIds = new Set<number>();
  const resolvedSources = {} as Record<
    EmergencyRunwayScenario['key'],
    ProjectedIncomeSource | null
  >;

  RUNWAY_SCENARIO_DEFINITIONS.forEach((scenario, index) => {
    const configuredSourceId = configuredSourceIds[index];

    if (
      configuredSourceId !== null &&
      sourcesById.has(configuredSourceId) &&
      !usedSourceIds.has(configuredSourceId)
    ) {
      usedSourceIds.add(configuredSourceId);
      resolvedSources[scenario.key] = sourcesById.get(configuredSourceId) ?? null;
      return;
    }

    const fallbackSource =
      fallbackSources.find((source) => !usedSourceIds.has(source.id)) ?? null;
    if (fallbackSource) {
      usedSourceIds.add(fallbackSource.id);
    }

    resolvedSources[scenario.key] = fallbackSource;
  });

  return resolvedSources;
}

function getSourceMonthlyCashNet(source: ProjectedIncomeSource): number {
  return source.totals.plannedCashNet / 12;
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

function getBudgetComparisonAmount(
  budgetEntries: BudgetEntry[],
  predicate: (entry: BudgetEntry) => boolean,
  spendBasis: SpendBasis,
  completedMonths: number,
): number {
  return sumBudgetEntries(budgetEntries, predicate, (entry) =>
    getComparisonBudgetForSpendBasis({
      spendBasis,
      monthlyBudget: entry.budgeted,
      completedMonths,
    }),
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

function getAnnualBudgetedAmount(
  budgetEntries: BudgetEntry[],
  predicate: (entry: BudgetEntry) => boolean,
): number {
  return formatAnnualBudgetAmount(getBudgetedAmount(budgetEntries, predicate));
}

function createDashboardMoneyFlowSummary({
  netIncome,
  essentialSpending,
  funsiesSpending,
  savingsAmount,
  investmentAmount,
  preTax401kContribution,
}: CreateDashboardMoneyFlowSummaryParams): DashboardMoneyFlowSummary {
  const netIncomeWealthContribution =
    savingsAmount === null || investmentAmount === null
      ? null
      : savingsAmount + investmentAmount;
  const wealthContribution =
    netIncomeWealthContribution === null && preTax401kContribution === null
      ? null
      : (netIncomeWealthContribution ?? 0) + (preTax401kContribution ?? 0);

  return {
    netIncome,
    essentialSpending,
    funsiesSpending,
    savingsAmount,
    investmentAmount,
    preTax401kContribution,
    netIncomeWealthContribution,
    wealthContribution,
  };
}

export function buildEmergencyRunwaySummary({
  projection,
  budgetEntries,
  emergencyFundBalance,
}: {
  projection: IncomeYearProjection | null;
  budgetEntries: BudgetEntry[] | null;
  emergencyFundBalance?: number | null;
}): EmergencyRunwaySummary {
  const resolvedEmergencyFundBalance =
    emergencyFundBalance ?? projection?.emergencyFundBalance ?? null;
  const monthlyEssentialExpenses = budgetEntries
    ? getBudgetedAmount(budgetEntries, isEssentialLivingExpense)
    : null;
  const baselineMonths =
    resolvedEmergencyFundBalance === null ||
    monthlyEssentialExpenses === null ||
    monthlyEssentialExpenses === 0
      ? null
      : resolvedEmergencyFundBalance / monthlyEssentialExpenses;
  const relevantSources = getRelevantRunwaySources(projection);
  const totalRelevantMonthlyIncome = relevantSources.reduce(
    (sum, source) => sum + getSourceMonthlyCashNet(source),
    0,
  );
  const scenarioSources = resolveRunwayScenarioSources(projection);
  const scenarios: EmergencyRunwayScenario[] =
    RUNWAY_SCENARIO_DEFINITIONS.map((scenario) => {
      const source = scenarioSources[scenario.key];
    const lostMonthlyIncome = source ? getSourceMonthlyCashNet(source) : null;
    const remainingMonthlyIncome =
      source && projection
        ? Math.max(totalRelevantMonthlyIncome - lostMonthlyIncome, 0)
        : null;
    const monthlyShortfall =
      monthlyEssentialExpenses === null || remainingMonthlyIncome === null
        ? null
        : Math.max(monthlyEssentialExpenses - remainingMonthlyIncome, 0);
    const runwayMonths =
      resolvedEmergencyFundBalance === null ||
      monthlyShortfall === null ||
      monthlyShortfall === 0
        ? null
        : resolvedEmergencyFundBalance / monthlyShortfall;

    return {
      key: scenario.key,
      label: source
        ? `If ${source.name} disappears`
        : scenario.fallbackLabel,
      sourceId: source?.id ?? null,
      sourceName: source?.name ?? null,
      lostMonthlyIncome,
      remainingMonthlyIncome,
      monthlyShortfall,
      runwayMonths,
    };
    });

  return {
    emergencyFundBalance: resolvedEmergencyFundBalance,
    monthlyEssentialExpenses,
    baselineMonths,
    scenarios,
  };
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

function getTaxAdvantagedBucketAmount(
  currentTaxAdvantagedInvestments: TaxAdvantagedInvestments | null,
  bucketType: '401k' | 'hsa' | 'fsa_daycare' | 'fsa_medical',
): number | null {
  if (!currentTaxAdvantagedInvestments) {
    return null;
  }

  return (
    currentTaxAdvantagedInvestments.entries.find(
      (entry) => entry.bucketType === bucketType,
    )?.annualAmount ?? 0
  );
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
    benchmark:
      KPI_BENCHMARKS[key] ?? 'Strong: trending in a healthy direction.',
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
    benchmark:
      KPI_BENCHMARKS[key] ?? 'Strong: trending in a healthy direction.',
    actualValue: createNumericDisplayValue(actualAmount, createPercentageValue),
    plannedValue: createPlannedValue(plannedAmount, createPercentageValue),
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
  if (currentValue === null || previousValue === null || previousValue === 0) {
    return null;
  }

  return (currentValue - previousValue) / previousValue;
}

function getMonthlyAmountForBasis(
  amount: number | null,
  spendBasis: SpendBasis,
  completedMonths: number,
): number | null {
  if (amount === null) {
    return null;
  }

  switch (spendBasis) {
    case 'annual_full_year':
      return amount / 12;
    case 'monthly_avg_elapsed':
      return completedMonths === 0 ? null : amount / completedMonths;
    case 'monthly_current_month':
    case 'monthly_avg_12':
      return amount;
    default:
      return amount;
  }
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

export function buildDashboardMoneyFlowSummary({
  currentIncomeTotals,
  currentTaxAdvantagedInvestments,
  budgetEntries,
  spendBasis,
  completedMonths,
}: BuildDashboardMoneyFlowSummaryParams): DashboardMoneyFlowSummary {
  const netIncome = currentIncomeTotals?.plannedNet ?? null;
  const comparisonNetIncome =
    netIncome === null
      ? null
      : scaleAnnualAmountForSpendBasis({
          annualAmount: netIncome,
          spendBasis,
          completedMonths,
        });
  const livingExpenses = budgetEntries
    ? getSpentAmount(budgetEntries, isLivingExpense)
    : null;
  const essentialSpending = budgetEntries
    ? getSpentAmount(budgetEntries, isEssentialLivingExpense)
    : null;
  const investmentAmount = budgetEntries
    ? getSpentAmount(budgetEntries, (entry) =>
        isInvestmentBudgetEntry(entry),
      )
    : null;
  const preTax401kContribution = getTaxAdvantagedBucketAmount(
    currentTaxAdvantagedInvestments,
    '401k',
  );
  const savingsAmount =
    comparisonNetIncome === null ||
    livingExpenses === null ||
    investmentAmount === null
      ? null
      : comparisonNetIncome - livingExpenses - investmentAmount;
  const funsiesSpending =
    comparisonNetIncome === null ||
    essentialSpending === null ||
    savingsAmount === null ||
    investmentAmount === null
      ? null
      : comparisonNetIncome -
        essentialSpending -
        savingsAmount -
        investmentAmount;

  return createDashboardMoneyFlowSummary({
    netIncome: comparisonNetIncome,
    essentialSpending,
    funsiesSpending,
    savingsAmount,
    investmentAmount,
    preTax401kContribution,
  });
}

export function buildPlannedDashboardMoneyFlowSummary({
  currentIncomeTotals,
  currentTaxAdvantagedInvestments,
  budgetEntries,
}: BuildPlannedDashboardMoneyFlowSummaryParams): DashboardMoneyFlowSummary {
  const netIncome = currentIncomeTotals?.plannedNet ?? null;
  const livingExpenses = budgetEntries
    ? getAnnualBudgetedAmount(budgetEntries, isLivingExpense)
    : null;
  const essentialSpending = budgetEntries
    ? getAnnualBudgetedAmount(budgetEntries, isEssentialLivingExpense)
    : null;
  const investmentAmount = budgetEntries
    ? getAnnualBudgetedAmount(budgetEntries, (entry) =>
        isInvestmentBudgetEntry(entry),
      )
    : null;
  const preTax401kContribution = getTaxAdvantagedBucketAmount(
    currentTaxAdvantagedInvestments,
    '401k',
  );
  const savingsAmount =
    netIncome === null || livingExpenses === null || investmentAmount === null
      ? null
      : netIncome - livingExpenses - investmentAmount;
  const funsiesSpending =
    livingExpenses === null || essentialSpending === null
      ? null
      : livingExpenses - essentialSpending;

  return createDashboardMoneyFlowSummary({
    netIncome,
    essentialSpending,
    funsiesSpending,
    savingsAmount,
    investmentAmount,
    preTax401kContribution,
  });
}

export function buildDashboardKpiGroups({
  currentIncomeTotals,
  previousIncomeTotals,
  currentTaxAdvantagedInvestments,
  budgetEntries,
  previousBudgetEntries,
  spendBasis,
  completedMonths,
  emergencyFundBalance = DEFAULT_EMERGENCY_FUND_BALANCE,
}: BuildDashboardKpiGroupsParams): DashboardKpiGroup[] {
  const currentGrossIncome = currentIncomeTotals?.plannedGross ?? null;
  const currentAfterTaxIncome = currentIncomeTotals?.plannedNet ?? null;
  const previousGrossIncome = previousIncomeTotals?.plannedGross ?? null;
  const plannedLivingExpenses = budgetEntries
    ? getBudgetComparisonAmount(
        budgetEntries,
        isLivingExpense,
        spendBasis,
        completedMonths,
      )
    : null;
  const actualLivingExpenses = budgetEntries
    ? getSpentAmount(budgetEntries, isLivingExpense)
    : null;
  const previousLivingExpenses = previousBudgetEntries
    ? getSpentAmount(previousBudgetEntries, isLivingExpense)
    : null;
  const totalMonthlyExpenses = budgetEntries
    ? getBudgetedAmount(budgetEntries, isLivingExpense)
    : null;
  const actualTotalMonthlyExpenses = getMonthlyAmountForBasis(
    actualLivingExpenses,
    spendBasis,
    completedMonths,
  );
  const emergencyFundMonths = buildEmergencyRunwaySummary({
    projection: null,
    budgetEntries,
    emergencyFundBalance,
  }).baselineMonths;
  const plannedInvestmentContributions = budgetEntries
    ? getBudgetComparisonAmount(
        budgetEntries,
        (entry) => isInvestmentBudgetEntry(entry),
        spendBasis,
        completedMonths,
      )
    : null;
  const actualInvestmentContributions = budgetEntries
    ? getSpentAmount(budgetEntries, (entry) =>
        isInvestmentBudgetEntry(entry),
      )
    : null;
  const plannedEssentialSpending = budgetEntries
    ? getBudgetComparisonAmount(
        budgetEntries,
        isEssentialLivingExpense,
        spendBasis,
        completedMonths,
      )
    : null;
  const plannedFunsiesSpending = budgetEntries
    ? getBudgetComparisonAmount(
        budgetEntries,
        isFunsiesLivingExpense,
        spendBasis,
        completedMonths,
      )
    : null;
  const plannedComparisonAfterTaxIncome =
    currentAfterTaxIncome === null
      ? null
      : scaleAnnualAmountForSpendBasis({
          annualAmount: currentAfterTaxIncome,
          spendBasis,
          completedMonths,
        });
  const actualComparisonAfterTaxIncome =
    currentAfterTaxIncome === null
      ? null
      : scaleAnnualAmountForSpendBasis({
          annualAmount: currentAfterTaxIncome,
          spendBasis,
          completedMonths,
        });
  const moneyFlowSummary = buildDashboardMoneyFlowSummary({
    currentIncomeTotals,
    currentTaxAdvantagedInvestments,
    budgetEntries,
    spendBasis,
    completedMonths,
  });
  const plannedSavingsAmount =
    plannedComparisonAfterTaxIncome === null ||
    plannedLivingExpenses === null ||
    plannedInvestmentContributions === null
      ? null
      : plannedComparisonAfterTaxIncome -
        plannedLivingExpenses -
        plannedInvestmentContributions;
  const actualSavingsAmount =
    actualComparisonAfterTaxIncome === null ||
    actualLivingExpenses === null ||
    actualInvestmentContributions === null
      ? null
      : actualComparisonAfterTaxIncome -
        actualLivingExpenses -
        actualInvestmentContributions;
  const savingsRate = calculateRatio(
    actualSavingsAmount === null || actualInvestmentContributions === null
      ? null
      : actualSavingsAmount + actualInvestmentContributions,
    actualComparisonAfterTaxIncome,
  );
  const plannedSavingsRate = calculateRatio(
    plannedSavingsAmount === null || plannedInvestmentContributions === null
      ? null
      : plannedSavingsAmount + plannedInvestmentContributions,
    plannedComparisonAfterTaxIncome,
  );
  const investmentRate = calculateRatio(
    actualInvestmentContributions,
    actualComparisonAfterTaxIncome,
  );
  const plannedInvestmentRate = calculateRatio(
    plannedInvestmentContributions,
    plannedComparisonAfterTaxIncome,
  );
  const savingsEfficiency = calculateRatio(
    actualSavingsAmount,
    actualComparisonAfterTaxIncome,
  );
  const plannedSavingsEfficiency = calculateRatio(
    plannedSavingsAmount,
    plannedComparisonAfterTaxIncome,
  );
  const expenseRatio = calculateRatio(
    actualLivingExpenses,
    actualComparisonAfterTaxIncome,
  );
  const plannedExpenseRatio = calculateRatio(
    plannedLivingExpenses,
    plannedComparisonAfterTaxIncome,
  );
  const expenseGrowthRate = calculateGrowthRate(
    actualLivingExpenses,
    previousLivingExpenses,
  );
  const incomeGrowthRate = calculateGrowthRate(
    currentGrossIncome,
    previousGrossIncome,
  );
  const contributions401k = getTaxAdvantagedBucketAmount(
    currentTaxAdvantagedInvestments,
    '401k',
  );
  const annualHsaContributions = getTaxAdvantagedBucketAmount(
    currentTaxAdvantagedInvestments,
    'hsa',
  );
  const annual529Contributions = getMatchedAnnualContribution(
    budgetEntries,
    TAX_ADVANTAGED_LABEL_MATCHERS.contributions529,
  );
  const annualRothContributions = getMatchedAnnualContribution(
    budgetEntries,
    TAX_ADVANTAGED_LABEL_MATCHERS.roth,
  );
  const taxAdvantagedContributions =
    currentTaxAdvantagedInvestments === null ||
    annual529Contributions === null ||
    annualRothContributions === null
      ? null
      : currentTaxAdvantagedInvestments.total +
        annual529Contributions.amount +
        annualRothContributions.amount;
  const taxAdvantagedSavingsRatio = calculateRatio(
    taxAdvantagedContributions,
    currentAfterTaxIncome,
  );

  return [
    {
      title: '1. Investment and Savings Efficiency',
      rows: [
        createCurrencyRow(
          'annual-savings-amount',
          'Annual Savings Amount',
          actualSavingsAmount,
          plannedSavingsAmount,
        ),
        createCurrencyRow(
          'annual-investment-contributions',
          'Annual Investment Amount',
          actualInvestmentContributions,
          plannedInvestmentContributions,
        ),
        createPercentageRow(
          'savings-efficiency',
          'Savings Rate (Savings / Income)',
          savingsEfficiency,
          plannedSavingsEfficiency,
        ),
        createPercentageRow(
          'investment-rate',
          'Investment Rate (Investments / Income)',
          investmentRate,
          plannedInvestmentRate,
        ),
        createPercentageRow(
          'savings-rate',
          'Total Savings Rate (Savings + Investments / Income)',
          savingsRate,
          plannedSavingsRate,
        ),
      ],
    },
    {
      title: '2. Income Efficiency',
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
      ],
    },
    {
      title: '3. Expense Structure',
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
          actualLivingExpenses,
          plannedLivingExpenses,
        ),
        createPercentageRow(
          'expense-growth-rate',
          'Expense Growth Rate (Year-over-Year)',
          expenseGrowthRate,
        ),
        createCurrencyRow(
          'essential-spending',
          'Essential',
          moneyFlowSummary.essentialSpending,
          plannedEssentialSpending,
        ),
        createCurrencyRow(
          'funsies-spending',
          'Funsies',
          moneyFlowSummary.funsiesSpending,
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
      title: '4. Liquidity and Safety',
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
      ],
    },
    {
      title: '5. Tax Efficiency',
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
          annualHsaContributions,
        ),
        createCurrencyRow(
          '529-contributions',
          '529 Contributions',
          annual529Contributions?.amount ?? null,
        ),
      ],
    },
  ];
}
