import React, { useId, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  LuAlignLeft,
  LuChartColumn,
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
  essentialBudget: number;
  funsiesBudget: number;
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
  essentialBudget,
  funsiesBudget,
  isBudgetFiltered,
  planningYear,
  spendBasis,
}) => {
  const [incomeUtilizationView, setIncomeUtilizationView] = useState<
    'chart' | 'numbers'
  >('chart');
  const [budgetUtilizationView, setBudgetUtilizationView] = useState<
    'chart' | 'numbers'
  >('chart');
  const [savingsInvestingView, setSavingsInvestingView] = useState<
    'chart' | 'numbers'
  >('chart');
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
  const savingsForAllocation = totalWealthContribution(
    plannedSavings,
    investments,
  );
  const totalWealth = plannedSavings + investments;
  const wealthRate = income > 0 ? (totalWealth / income) * 100 : 0;
  const essentialIncomePercent =
    income > 0 ? (essentialBudget / income) * 100 : 0;
  const funsiesIncomePercent = income > 0 ? (funsiesBudget / income) * 100 : 0;
  const investmentIncomePercent = income > 0 ? (investments / income) * 100 : 0;
  const savingsIncomePercent =
    income > 0 ? (savingsForAllocation / income) * 100 : 0;
  const essentialWidth = Math.min(essentialIncomePercent, 100);
  const funsiesWidth = Math.min(
    funsiesIncomePercent,
    Math.max(100 - essentialWidth, 0),
  );
  const savingsWidth = Math.min(
    savingsIncomePercent,
    Math.max(100 - essentialWidth - funsiesWidth, 0),
  );
  const wealthIncomePercent = income > 0 ? (totalWealth / income) * 100 : 0;
  const savingsWealthWidth = Math.min(savingsIncomePercent, 100);
  const investmentWealthWidth = Math.min(
    investmentIncomePercent,
    Math.max(100 - savingsWealthWidth, 0),
  );
  const annualIncomeSummary = formatWholeCurrency(income * 12);
  const annualBudgetedSummary = formatWholeCurrency(budgetedForChart * 12);
  const annualSpentSummary = formatWholeCurrency(spentForChart * 12);
  const annualEssentialSummary = formatWholeCurrency(essentialBudget * 12);
  const annualFunsiesSummary = formatWholeCurrency(funsiesBudget * 12);
  const annualWealthSummary = formatWholeCurrency(totalWealth * 12);
  const annualSavingsSummary = formatWholeCurrency(plannedSavings * 12);
  const annualInvestmentsSummary = formatWholeCurrency(investments * 12);
  const nextIncomeUtilizationViewLabel =
    incomeUtilizationView === 'chart' ? 'Show numbers view' : 'Show chart view';
  const nextBudgetUtilizationViewLabel =
    budgetUtilizationView === 'chart' ? 'Show numbers view' : 'Show chart view';
  const nextSavingsInvestingViewLabel =
    savingsInvestingView === 'chart' ? 'Show numbers view' : 'Show chart view';
  const paletteBlue = 'bg-[#7BB6EB]';
  const paletteGreen = 'bg-[#97DDAA]';
  const palettePurple = 'bg-[#A890E6]';
  const palettePurpleText = 'text-[#7B63C8]';
  const palettePurpleTextMuted = 'text-[#7B63C8]/75';

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

  const renderViewToggle = (
    nextLabel: string,
    currentView: 'chart' | 'numbers',
    onToggle: () => void,
  ) => (
    <button
      type="button"
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200"
      onClick={onToggle}
      aria-label={nextLabel}
      title={nextLabel}
    >
      {currentView === 'chart' ? (
        <LuAlignLeft className="h-4 w-4" />
      ) : (
        <LuChartColumn className="h-4 w-4" />
      )}
    </button>
  );

  const renderCardHeader = ({
    icon,
    title,
    toggle,
    showFilteredBadge = false,
  }: {
    icon: React.ReactNode;
    title: string;
    toggle?: React.ReactNode;
    showFilteredBadge?: boolean;
  }) => (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className={cardIconContainerClass}>{icon}</div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          {showFilteredBadge ? (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-violet-600 shadow-sm backdrop-blur">
              <LuFilter className="h-3 w-3 text-sky-400" />
              Filtered Totals
            </div>
          ) : null}
        </div>
      </div>
      {toggle}
    </div>
  );

  function formatWholeCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }

  function totalWealthContribution(
    savingsAmount: number,
    investmentAmount: number,
  ) {
    return savingsAmount + investmentAmount;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={getCardVariants(0)}
          role="region"
          aria-label="Income Utilization"
          className="h-full rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-lg"
        >
          {renderCardHeader({
            icon: <LuWallet className={cardIconClass} />,
            title: 'Income Utilization',
            toggle: renderViewToggle(
              nextIncomeUtilizationViewLabel,
              incomeUtilizationView,
              () =>
                setIncomeUtilizationView((current) =>
                  current === 'chart' ? 'numbers' : 'chart',
                ),
            ),
          })}

          {incomeUtilizationView === 'chart' ? (
            <div className="mb-1 flex flex-1 flex-col justify-end pt-2">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  Income Allocation
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
                  <span>
                    {annualIncomeSummary} income / {annualEssentialSummary}{' '}
                    essential / {annualFunsiesSummary} funsies /{' '}
                    {annualWealthSummary} wealth
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="relative h-8 overflow-hidden rounded-full bg-slate-100">
                  <div className="absolute inset-y-0 left-0 w-full rounded-full bg-slate-200" />
                  <div
                    className={`absolute inset-y-0 left-0 ${paletteBlue}`}
                    style={{ width: `${essentialWidth}%` }}
                  />
                  <div
                    className={`absolute inset-y-0 ${paletteGreen}`}
                    style={{
                      left: `${essentialWidth}%`,
                      width: `${funsiesWidth}%`,
                    }}
                  />
                  <div
                    className={`absolute inset-y-0 ${palettePurple}`}
                    style={{
                      left: `${essentialWidth + funsiesWidth}%`,
                      width: `${savingsWidth}%`,
                    }}
                  />

                  {essentialWidth > 0 ? (
                    <Tooltip
                      content={getBarTooltipContent(
                        'Essential',
                        essentialBudget,
                        essentialIncomePercent,
                      )}
                      stacked
                      followCursor
                    >
                      <div
                        className="absolute inset-y-0 left-0 cursor-pointer"
                        style={{ width: `${essentialWidth}%` }}
                        aria-label="Essential portion"
                      />
                    </Tooltip>
                  ) : null}

                  {funsiesWidth > 0 ? (
                    <Tooltip
                      content={getBarTooltipContent(
                        'Funsies',
                        funsiesBudget,
                        funsiesIncomePercent,
                      )}
                      stacked
                      followCursor
                    >
                      <div
                        className="absolute inset-y-0 cursor-pointer"
                        style={{
                          left: `${essentialWidth}%`,
                          width: `${funsiesWidth}%`,
                        }}
                        aria-label="Funsies portion"
                      />
                    </Tooltip>
                  ) : null}

                  {savingsWidth > 0 ? (
                    <Tooltip
                      content={getBarTooltipContent(
                        'Savings',
                        savingsForAllocation,
                        savingsIncomePercent,
                      )}
                      stacked
                      followCursor
                    >
                      <div
                        className="absolute inset-y-0 cursor-pointer"
                        style={{
                          left: `${essentialWidth + funsiesWidth}%`,
                          width: `${savingsWidth}%`,
                        }}
                        aria-label="Savings portion"
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
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${paletteBlue}`}
                    />
                    <span>Essential</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${paletteGreen}`}
                    />
                    <span>Funsies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${palettePurple}`}
                    />
                    <span>Wealth</span>
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
                  <p className="mb-1 text-xs text-gray-500">Essential</p>
                  <CurrencyStack monthlyAmount={essentialBudget} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="mb-1 text-xs text-gray-500">Funsies</p>
                  <CurrencyStack monthlyAmount={funsiesBudget} />
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-500">Savings</p>
                  <CurrencyStack monthlyAmount={savingsForAllocation} />
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-500">Wealth Rate</p>
                  <p className="text-lg font-bold text-gray-900">
                    {wealthRate.toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500">of income</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={getCardVariants(1)}
          role="region"
          aria-label="Budget Utilization"
          className="h-full rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-lg"
        >
          {renderCardHeader({
            icon: <LuWallet className={cardIconClass} />,
            title: 'Budget Utilization',
            toggle: renderViewToggle(
              nextBudgetUtilizationViewLabel,
              budgetUtilizationView,
              () =>
                setBudgetUtilizationView((current) =>
                  current === 'chart' ? 'numbers' : 'chart',
                ),
            ),
            showFilteredBadge: isBudgetFiltered,
          })}

          {budgetUtilizationView === 'chart' ? (
            <div className="mb-1 flex flex-1 flex-col justify-end pt-2">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  Income Capacity
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
                  <span>
                    {annualIncomeSummary} income / {annualBudgetedSummary}{' '}
                    budget / {annualSpentSummary} spent
                  </span>
                  <span>{usedPercent.toFixed(0)}% used</span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="relative h-8 overflow-hidden rounded-full bg-slate-100">
                  <div className="absolute inset-y-0 left-0 w-full rounded-full bg-slate-200" />
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full ${paletteBlue}`}
                    style={{
                      width: `${Math.min(budgetedIncomePercent, 100)}%`,
                    }}
                  />
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full ${paletteGreen}`}
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
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${paletteBlue}`}
                    />
                    <span>Budgeted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${paletteGreen}`}
                    />
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
          variants={getCardVariants(2)}
          role="region"
          aria-label="Savings & Investing"
          className="h-full rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-lg"
        >
          {renderCardHeader({
            icon: <LuPiggyBank className={cardIconClass} />,
            title: 'Savings & Investing',
            toggle: renderViewToggle(
              nextSavingsInvestingViewLabel,
              savingsInvestingView,
              () =>
                setSavingsInvestingView((current) =>
                  current === 'chart' ? 'numbers' : 'chart',
                ),
            ),
          })}

          <div className="space-y-3">
            {savingsInvestingView === 'chart' ? (
              <div className="mb-1 flex flex-1 flex-col justify-end pt-2">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                    Wealth Building
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
                    <span>
                      {annualIncomeSummary} income / {annualSavingsSummary}{' '}
                      savings / {annualInvestmentsSummary} investments
                    </span>
                    <span>{wealthIncomePercent.toFixed(0)}% to wealth</span>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="relative h-8 overflow-hidden rounded-full bg-slate-100">
                    <div className="absolute inset-y-0 left-0 w-full rounded-full bg-slate-200" />
                    <div
                      className={`absolute inset-y-0 left-0 ${paletteGreen}`}
                      style={{ width: `${savingsWealthWidth}%` }}
                    />
                    <div
                      className={`absolute inset-y-0 ${palettePurple}`}
                      style={{
                        left: `${savingsWealthWidth}%`,
                        width: `${investmentWealthWidth}%`,
                      }}
                    />

                    {savingsWealthWidth > 0 ? (
                      <Tooltip
                        content={getBarTooltipContent(
                          'Savings',
                          plannedSavings,
                          savingsIncomePercent,
                        )}
                        stacked
                        followCursor
                      >
                        <div
                          className="absolute inset-y-0 left-0 cursor-pointer"
                          style={{ width: `${savingsWealthWidth}%` }}
                          aria-label="Savings portion"
                        />
                      </Tooltip>
                    ) : null}

                    {investmentWealthWidth > 0 ? (
                      <Tooltip
                        content={getBarTooltipContent(
                          'Budgeted investments',
                          investments,
                          investmentIncomePercent,
                        )}
                        stacked
                        followCursor
                      >
                        <div
                          className="absolute inset-y-0 cursor-pointer"
                          style={{
                            left: `${savingsWealthWidth}%`,
                            width: `${investmentWealthWidth}%`,
                          }}
                          aria-label="Budgeted investments portion"
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
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${paletteGreen}`}
                      />
                      <span>Savings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${palettePurple}`}
                      />
                      <span>Budgeted Investments</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap items-start gap-x-4 gap-y-2 text-xs text-gray-500 xl:flex-nowrap">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Savings
                    </p>
                    <div className="mt-2">
                      <CurrencyStack monthlyAmount={plannedSavings} />
                    </div>
                  </div>

                  <div className="pt-7 text-slate-400" aria-hidden="true">
                    <LuPlus className="h-3.5 w-3.5" />
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Budgeted Investments
                    </p>
                    <div className="mt-2">
                      <CurrencyStack monthlyAmount={investments} />
                    </div>
                  </div>

                  <div className="pt-7 text-slate-400" aria-hidden="true">
                    <LuEqual className="h-3.5 w-3.5" />
                  </div>

                  <div className="min-w-[10rem]">
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${palettePurpleText}`}
                    >
                      Total Going to Wealth
                    </p>
                    <div className="mt-2">
                      <CurrencyStack
                        monthlyAmount={totalWealth}
                        annualClassName={`text-lg font-bold ${palettePurpleText}`}
                        monthlyClassName={`text-xs ${palettePurpleTextMuted}`}
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
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
