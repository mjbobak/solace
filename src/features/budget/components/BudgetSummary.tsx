import React, { useId, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  LuAlignLeft,
  LuChartColumn,
  LuChevronDown,
  LuChevronRight,
  LuEqual,
  LuFilter,
  LuPiggyBank,
  LuPlus,
  LuWallet,
} from 'react-icons/lu';

import type { BudgetTotals } from '@/features/budget/hooks/useBudgetCalculations';
import type { SpendBasis } from '@/features/budget/types/budgetView';
import { Tooltip } from '@/shared/components/Tooltip';
import { getCompletedMonthsForYear } from '@/shared/utils/spendBasis';

interface BudgetSummaryProps {
  totals: BudgetTotals;
  totalBudgeted: number;
  investments: number;
  income: number;
  savings: number;
  isBudgetFiltered: boolean;
  planningYear: number;
  spendBasis: SpendBasis;
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({
  totals,
  totalBudgeted,
  investments,
  income,
  savings,
  isBudgetFiltered,
  planningYear,
  spendBasis,
}) => {
  const [isSavingsBreakdownExpanded, setIsSavingsBreakdownExpanded] =
    useState(false);
  const [budgetUtilizationView, setBudgetUtilizationView] = useState<
    'chart' | 'numbers'
  >('chart');
  const savingsBreakdownId = useId();
  const completedMonths = getCompletedMonthsForYear(planningYear);
  const usedBudgetBase = totals.spent + totals.remaining;
  const usedPercent =
    usedBudgetBase > 0 ? (totals.spent / usedBudgetBase) * 100 : 0;
  const normalizeToMonthlyComparison = (amount: number) => {
    switch (spendBasis) {
      case 'annual_full_year':
        return amount / 12;
      case 'monthly_avg_elapsed':
        return completedMonths > 0 ? amount / completedMonths : 0;
      case 'monthly_current_month':
      case 'monthly_avg_12':
      default:
        return amount;
    }
  };
  const budgetedForChart = totals.budgeted;
  const spentForChart = normalizeToMonthlyComparison(totals.spent);
  const remainingForChart = normalizeToMonthlyComparison(totals.remaining);
  const budgetedIncomePercent =
    income > 0 ? (budgetedForChart / income) * 100 : 0;
  const spentIncomePercent = income > 0 ? (spentForChart / income) * 100 : 0;
  const remainingBudgetForChart = Math.max(budgetedForChart - spentForChart, 0);
  const unbudgetedIncomeForChart = Math.max(income - budgetedForChart, 0);
  const spentWidth = Math.min(spentIncomePercent, 100);
  const remainingBudgetWidth = Math.max(
    Math.min(budgetedIncomePercent, 100) - spentWidth,
    0,
  );
  const unbudgetedIncomeWidth = Math.max(
    100 - Math.min(budgetedIncomePercent, 100),
    0,
  );
  const plannedSavings = Math.abs(savings);
  const totalWealth = plannedSavings + investments;
  const wealthRate = income > 0 ? (totalWealth / income) * 100 : 0;
  const annualIncomeSummary = formatWholeCurrency(income * 12);
  const annualBudgetedSummary = formatWholeCurrency(budgetedForChart * 12);
  const annualSpentSummary = formatWholeCurrency(spentForChart * 12);
  const nextBudgetUtilizationViewLabel =
    budgetUtilizationView === 'chart' ? 'Show numbers view' : 'Show chart view';

  const CurrencyStack = ({
    monthlyAmount,
    annualClassName = 'text-gray-900',
    monthlyClassName = 'text-gray-500',
    annualOperator,
  }: {
    monthlyAmount: number;
    annualClassName?: string;
    monthlyClassName?: string;
    annualOperator?: React.ReactNode;
  }) => (
    <div className="flex flex-col leading-tight">
      <span className="flex items-baseline gap-2">
        <span className={`text-lg font-bold ${annualClassName}`}>
          {formatWholeCurrency(monthlyAmount * 12)}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
          annual
        </span>
        {annualOperator ? (
          <span className="ml-auto hidden h-5 w-5 items-center justify-center rounded-full bg-sky-50 text-slate-400 sm:inline-flex">
            {annualOperator}
          </span>
        ) : null}
      </span>
      <span className="flex items-baseline gap-2">
        <span className={`text-xs ${monthlyClassName}`}>
          {formatWholeCurrency(monthlyAmount)}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
          monthly
        </span>
      </span>
    </div>
  );

  const cardIconContainerClass =
    'p-2 rounded-lg bg-gradient-to-br from-sky-50 to-slate-100';
  const cardIconClass = 'w-4 h-4 text-slate-500';

  const getCardVariants = (index: number): Variants => ({
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  });

  const getBarTooltipContent = (
    label: string,
    amount: number,
    percentOfIncome: number,
  ) =>
    `${label}\n${formatWholeCurrency(amount * 12)} annual\n${formatWholeCurrency(
      amount,
    )} monthly\n${percentOfIncome.toFixed(1)}% of income`;

  function formatWholeCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={getCardVariants(0)}
          className="h-full rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-lg lg:col-span-1"
        >
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className={cardIconContainerClass}>
                <LuWallet className={cardIconClass} />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Budget Utilization
                </h3>
                {isBudgetFiltered ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-violet-600 shadow-sm backdrop-blur">
                    <LuFilter className="h-3 w-3 text-sky-400" />
                    Filtered Totals
                  </div>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200"
              onClick={() =>
                setBudgetUtilizationView((current) =>
                  current === 'chart' ? 'numbers' : 'chart',
                )
              }
              aria-label={nextBudgetUtilizationViewLabel}
              title={nextBudgetUtilizationViewLabel}
            >
              {budgetUtilizationView === 'chart' ? (
                <LuAlignLeft className="h-4 w-4" />
              ) : (
                <LuChartColumn className="h-4 w-4" />
              )}
            </button>
          </div>

          {budgetUtilizationView === 'chart' ? (
            <div className="mb-1 flex flex-1 flex-col justify-end pt-2">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  Income Capacity
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
                  <span>
                    {annualIncomeSummary} income / {annualBudgetedSummary} budget
                    / {annualSpentSummary} spent
                  </span>
                  <span>{usedPercent.toFixed(0)}% used</span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="relative h-8 overflow-hidden rounded-full bg-slate-100">
                  <div className="absolute inset-y-0 left-0 w-full rounded-full bg-slate-200" />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-sky-200"
                    style={{
                      width: `${Math.min(budgetedIncomePercent, 100)}%`,
                    }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-sky-600"
                    style={{ width: `${Math.min(spentIncomePercent, 100)}%` }}
                  />

                  {spentWidth > 0 ? (
                    <Tooltip
                      content={getBarTooltipContent(
                        'Spent',
                        spentForChart,
                        spentIncomePercent,
                      )}
                      stacked
                      followCursor
                    >
                      <div
                        className="absolute inset-y-0 left-0 cursor-pointer rounded-full"
                        style={{ width: `${spentWidth}%` }}
                        aria-label="Spent portion"
                      />
                    </Tooltip>
                  ) : null}

                  {remainingBudgetWidth > 0 ? (
                    <Tooltip
                      content={getBarTooltipContent(
                        'Budgeted but not spent',
                        remainingBudgetForChart,
                        budgetedIncomePercent - spentIncomePercent,
                      )}
                      stacked
                      followCursor
                    >
                      <div
                        className="absolute inset-y-0 cursor-pointer"
                        style={{
                          left: `${spentWidth}%`,
                          width: `${remainingBudgetWidth}%`,
                        }}
                        aria-label="Remaining budget portion"
                      />
                    </Tooltip>
                  ) : null}

                  {unbudgetedIncomeWidth > 0 ? (
                    <Tooltip
                      content={getBarTooltipContent(
                        'Income not budgeted',
                        unbudgetedIncomeForChart,
                        100 - budgetedIncomePercent,
                      )}
                      stacked
                      followCursor
                    >
                      <div
                        className="absolute inset-y-0 cursor-pointer rounded-full"
                        style={{
                          left: `${Math.min(budgetedIncomePercent, 100)}%`,
                          width: `${unbudgetedIncomeWidth}%`,
                        }}
                        aria-label="Unbudgeted income portion"
                      />
                    </Tooltip>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                    <span>Income</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-200" />
                    <span>Budgeted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-600" />
                    <span>Spent</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs text-gray-500">Income</p>
                  <CurrencyStack monthlyAmount={income} />
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-500">Budgeted</p>
                  <CurrencyStack monthlyAmount={budgetedForChart} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="mb-1 text-xs text-gray-500">Spent</p>
                  <CurrencyStack monthlyAmount={spentForChart} />
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-500">Remaining</p>
                  <CurrencyStack
                    monthlyAmount={remainingForChart}
                    annualClassName={
                      totals.remaining < 0 ? 'text-red-600' : 'text-gray-900'
                    }
                    monthlyClassName={
                      totals.remaining < 0 ? 'text-red-600/75' : 'text-gray-500'
                    }
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-500">Percent Used</p>
                  <p
                    className={`text-lg font-bold ${
                      usedPercent > 100 ? 'text-red-600' : 'text-gray-900'
                    }`}
                  >
                    {usedPercent.toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500">of budgeted amount</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={getCardVariants(1)}
          className="h-full rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-lg lg:col-span-2"
        >
          <div className="mb-5 flex items-center gap-2">
            <div className={cardIconContainerClass}>
              <LuPiggyBank className={cardIconClass} />
            </div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Savings & Investing
            </h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-start gap-x-5 gap-y-2 text-sm text-gray-500">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Savings
                  </p>
                  <div className="mt-2">
                    <CurrencyStack monthlyAmount={plannedSavings} />
                  </div>
                </div>

                <div className="pt-8 text-slate-400" aria-hidden="true">
                  <LuPlus className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Budgeted Investments
                  </p>
                  <div className="mt-2">
                    <CurrencyStack monthlyAmount={investments} />
                  </div>
                </div>

                <div className="pt-8 text-slate-400" aria-hidden="true">
                  <LuEqual className="h-4 w-4" />
                </div>

                <div className="min-w-[12rem]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700">
                    Total Going to Wealth
                  </p>
                  <div className="mt-2">
                    <CurrencyStack
                      monthlyAmount={totalWealth}
                      annualClassName="text-lg font-bold text-indigo-700"
                      monthlyClassName="text-xs text-indigo-700/75"
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500">
                  {wealthRate.toFixed(1)}% of income
                </p>
              </div>
            </div>

            {isSavingsBreakdownExpanded ? (
              <div
                id={savingsBreakdownId}
                className="border-t border-slate-200 pt-3"
              >
                <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Planned Income
                    </p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                      {formatWholeCurrency(income)}
                      <span className="ml-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                        monthly
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatWholeCurrency(income * 12)} annual
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Total Budgeted
                    </p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                      {formatWholeCurrency(totalBudgeted)}
                      <span className="ml-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                        monthly
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatWholeCurrency(totalBudgeted * 12)} annual
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Planned Savings
                    </p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                      {formatWholeCurrency(plannedSavings)}
                      <span className="ml-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                        monthly
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatWholeCurrency(plannedSavings * 12)} annual
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Planned Investments
                    </p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                      {formatWholeCurrency(investments)}
                      <span className="ml-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                        monthly
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatWholeCurrency(investments * 12)} annual
                    </p>
                  </div>

                  <div className="sm:col-span-2 xl:col-span-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700">
                      Total Going to Wealth
                    </p>
                    <p className="mt-2 text-lg font-semibold text-indigo-700">
                      {formatWholeCurrency(totalWealth)}
                      <span className="ml-2 text-xs font-medium uppercase tracking-wide text-indigo-500/70">
                        monthly
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-indigo-700/80">
                      {formatWholeCurrency(totalWealth * 12)} annual
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex justify-start pt-1">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200"
                onClick={() =>
                  setIsSavingsBreakdownExpanded((previous) => !previous)
                }
                aria-expanded={isSavingsBreakdownExpanded}
                aria-controls={savingsBreakdownId}
              >
                {isSavingsBreakdownExpanded ? (
                  <LuChevronDown className="h-4 w-4" />
                ) : (
                  <LuChevronRight className="h-4 w-4" />
                )}
                {isSavingsBreakdownExpanded
                  ? 'Hide breakdown'
                  : 'Show breakdown'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
