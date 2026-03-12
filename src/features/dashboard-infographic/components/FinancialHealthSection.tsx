/**
 * Financial Health Section
 * Displays 5 key metrics: Total Income (with breakdown), Total Spending, Total Savings, Total Invested, Total Net Wealth
 */

import React, { useEffect, useState } from 'react';
import { LuTrendingDown, LuPiggyBank, LuDollarSign } from 'react-icons/lu';

import { useBudgetData } from '@/features/budget/hooks/useBudgetData';
import { useBudgetCalculations } from '@/features/budget/hooks/useBudgetCalculations';
import { isInvestmentCategory } from '@/features/budget/utils/investmentCategories';
import { spendingService } from '@/features/spending/services/spendingService';
import { formatCurrency } from '@/shared/utils/currency';

import { useIncomeAnalysis } from '../hooks/useIncomeAnalysis';

import { ScrollAnimatedSection } from './ScrollAnimatedSection';
import { SectionNarrative } from './SectionNarrative';

const PLANNED_VALUE_STACK_CLASSES = {
  annualClassName: 'text-indigo-700',
  monthlyClassName: 'text-indigo-700/75',
};

const CurrencyStack = ({
  monthlyAmount,
  annualClassName = 'text-app',
  monthlyClassName = 'text-muted',
}: {
  monthlyAmount: number;
  annualClassName?: string;
  monthlyClassName?: string;
}) => (
  <div className="flex flex-col leading-tight">
    <span className={`text-sm font-bold ${annualClassName}`}>
      {formatCurrency(monthlyAmount * 12, '$')}
    </span>
    <span className={`text-xs ${monthlyClassName}`}>
      {formatCurrency(monthlyAmount, '$')}
    </span>
  </div>
);

interface FinancialHealthSectionProps {
  year: number;
}

export const FinancialHealthSection: React.FC<FinancialHealthSectionProps> = ({
  year,
}) => {
  const [annualSpending, setAnnualSpending] = useState(0);

  const incomeAnalysis = useIncomeAnalysis(year);
  const annualNetIncome = incomeAnalysis.totalIncome;
  const monthlyIncome = annualNetIncome / 12;

  // Match budget page calculations so savings/investing stays in sync.
  const { budgetEntries } = useBudgetData(
    year,
    'monthly_current_month',
    false,
  );
  const budgetCalculations = useBudgetCalculations(budgetEntries);
  const monthlyTotalBudgeted = budgetCalculations.budgeted;

  // Investment calculation (from budget data)
  const monthlyInvestments = budgetEntries
    .filter((entry) => isInvestmentCategory(entry.expenseCategory))
    .reduce((sum, entry) => sum + entry.budgeted, 0);

  const monthlySavings = monthlyIncome - monthlyTotalBudgeted;
  const plannedSavings = Math.abs(monthlySavings);
  const monthlySpending = annualSpending / 12;
  const monthlyWealthContribution =
    plannedSavings + monthlyInvestments;

  useEffect(() => {
    let isCancelled = false;

    const loadAnnualSpending = async () => {
      try {
        const transactions = await spendingService.getTransactionsByDateRange(
          `${year}-01-01`,
          `${year}-12-31`,
        );
        if (isCancelled) {
          return;
        }

        const nextAnnualSpending = transactions.reduce(
          (sum, transaction) => sum + transaction.amount,
          0,
        );
        setAnnualSpending(nextAnnualSpending);
      } catch (error) {
        console.error('Failed to load annual spending for dashboard:', error);
        if (!isCancelled) {
          setAnnualSpending(0);
        }
      }
    };

    void loadAnnualSpending();

    return () => {
      isCancelled = true;
    };
  }, [year]);

  const getPercentage = (value: number) =>
    monthlyIncome > 0 ? ((value / monthlyIncome) * 100).toFixed(1) : '0.0';

  const incomeTypeAmounts = incomeAnalysis.typeBreakdown.reduce(
    (amounts, entry) => {
      amounts[entry.type] = entry.amount;
      return amounts;
    },
    {} as Record<string, number>,
  );
  const salaryAmount = incomeTypeAmounts.base_pay ?? 0;
  const bonusAmount = incomeTypeAmounts.bonus ?? 0;

  return (
    <ScrollAnimatedSection className="py-12 px-6 space-y-8">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-app">
          Financial Health Overview
        </h2>
        <SectionNarrative
          text="Your complete financial picture showing income, spending, savings, and wealth generation. All percentages are relative to total income."
          highlight={true}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="surface-card surface-card-hover p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="icon-tile icon-tile-success p-2">
              <LuDollarSign className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Income
            </h3>
          </div>

          <div className="h-6" />

          <div className="mb-3">
            <CurrencyStack monthlyAmount={monthlyIncome} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-4 section-divider">
            <div>
              <p className="mb-1 text-xs text-muted">Salary</p>
              <p className="text-xs font-bold text-app">
                {formatCurrency(salaryAmount, '$')}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted">Bonus</p>
              <p className="text-xs font-bold text-app">
                {formatCurrency(bonusAmount, '$')}
              </p>
            </div>
          </div>
        </div>

        <div className="surface-card surface-card-hover p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="icon-tile icon-tile-danger p-2">
              <LuTrendingDown className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Spending
            </h3>
          </div>

          <div className="h-6" />

          <div>
            <CurrencyStack monthlyAmount={monthlySpending} />
            <p className="text-xs text-muted">
              {getPercentage(monthlySpending)}% of income
            </p>
          </div>
        </div>

        <div className="surface-card p-5 lg:col-span-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="icon-tile icon-tile-brand p-2">
              <LuPiggyBank className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Savings & Investing
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Planned Savings
              </p>
              <div className="mb-1">
                <CurrencyStack
                  monthlyAmount={plannedSavings}
                  {...PLANNED_VALUE_STACK_CLASSES}
                />
              </div>
              <p className="text-xs text-muted">
                {getPercentage(plannedSavings)}%
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Planned Investments
              </p>
              <div className="mb-1">
                <CurrencyStack
                  monthlyAmount={monthlyInvestments}
                  {...PLANNED_VALUE_STACK_CLASSES}
                />
              </div>
              <p className="text-xs text-muted">
                {getPercentage(monthlyInvestments)}%
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Total Going to Wealth
              </p>
              <div className="mb-1">
                <CurrencyStack
                  monthlyAmount={monthlyWealthContribution}
                  {...PLANNED_VALUE_STACK_CLASSES}
                />
              </div>
              <p className="text-xs text-muted">
                {getPercentage(monthlyWealthContribution)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </ScrollAnimatedSection>
  );
};
