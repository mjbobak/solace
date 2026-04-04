/**
 * Financial Health Section
 * Displays a top-level income allocation waterfall for the current plan.
 */

import React from 'react';
import { LuWallet } from 'react-icons/lu';

import { useBudgetData } from '@/features/budget/hooks/useBudgetData';
import { isInvestmentBudgetEntry } from '@/features/budget/utils/investmentCategories';

import { useIncomeAnalysis } from '../hooks/useIncomeAnalysis';

import { IncomeAllocationWaterfallChart } from './IncomeAllocationWaterfallChart';
import { ScrollAnimatedSection } from './ScrollAnimatedSection';
import { SectionNarrative } from './SectionNarrative';

interface FinancialHealthSectionProps {
  year: number;
}

function formatWholeCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const FinancialHealthSection: React.FC<FinancialHealthSectionProps> = ({
  year,
}) => {
  const incomeAnalysis = useIncomeAnalysis(year);
  const annualNetIncome = incomeAnalysis.plannedNetIncome;
  const monthlyIncome = annualNetIncome / 12;

  const { budgetEntries } = useBudgetData(year, 'monthly_current_month', false);
  const allocationTotals = budgetEntries.reduce(
    (totals, entry) => {
      if (isInvestmentBudgetEntry(entry)) {
        totals.investments += entry.budgeted;
      } else if (entry.expenseType === 'ESSENTIAL') {
        totals.essential += entry.budgeted;
      } else {
        totals.funsies += entry.budgeted;
      }

      totals.totalBudgeted += entry.budgeted;
      return totals;
    },
    {
      essential: 0,
      funsies: 0,
      investments: 0,
      totalBudgeted: 0,
    },
  );

  const monthlySavings = monthlyIncome - allocationTotals.totalBudgeted;
  const plannedSavings = Math.max(monthlySavings, 0);
  const monthlyWealthContribution = plannedSavings + allocationTotals.investments;

  const getPercentage = (value: number) =>
    monthlyIncome > 0 ? ((value / monthlyIncome) * 100).toFixed(1) : '0.0';

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

      <div className="surface-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="icon-tile icon-tile-brand p-2">
            <LuWallet className="h-5 w-5" />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Income Allocation
          </h3>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted">
            A waterfall view of how your current monthly plan allocates total
            income across essentials, funsies, investments, and savings.
          </p>
          <IncomeAllocationWaterfallChart
            totalIncome={monthlyIncome}
            essentialAmount={allocationTotals.essential}
            funsiesAmount={allocationTotals.funsies}
            investmentAmount={allocationTotals.investments}
            savingsAmount={plannedSavings}
          />
          <div className="flex flex-col gap-1 border-t pt-4 section-divider text-xs sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted">
              Wealth capture is {getPercentage(monthlyWealthContribution)}% of
              income.
            </p>
            <p className="font-medium text-app">
              {formatWholeCurrency(monthlyWealthContribution * 12)} annual
            </p>
          </div>
        </div>
      </div>
    </ScrollAnimatedSection>
  );
};
