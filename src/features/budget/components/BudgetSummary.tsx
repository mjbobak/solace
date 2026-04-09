import React, { useState } from 'react';

import { BudgetUtilizationCard } from '@/features/budget/components/budgetSummary/BudgetUtilizationCard';
import { formatWholeCurrency, type SummaryView } from '@/features/budget/components/budgetSummary/constants';
import { IncomeAllocationCard } from '@/features/dashboard-infographic/components/IncomeAllocationCard';
import type { BudgetTotals } from '@/features/budget/hooks/useBudgetCalculations';
import type { BudgetEntry, SpendBasis } from '@/features/budget/types/budgetView';
import {
  getCompletedMonthsForYear,
  getSpendBasisLabel,
  scaleAnnualAmountForSpendBasis,
} from '@/shared/utils/spendBasis';

interface BudgetSummaryProps {
  budgetEntries: BudgetEntry[];
  totals: BudgetTotals;
  budgetUtilizationTotals?: BudgetTotals;
  income: number;
  isBudgetFiltered: boolean;
  planningYear: number;
  spendBasis: SpendBasis;
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = (props) => {
  const {
    budgetEntries,
    totals,
    budgetUtilizationTotals = totals,
    income,
    isBudgetFiltered,
    planningYear,
    spendBasis,
  } = props;

  const [budgetUtilizationView, setBudgetUtilizationView] =
    useState<SummaryView>('chart');

  const completedMonths = getCompletedMonthsForYear(planningYear);
  const comparisonIncome = scaleAnnualAmountForSpendBasis({
    annualAmount: income * 12,
    spendBasis,
    completedMonths,
  });
  const budgetedForChart =
    budgetUtilizationTotals.spent + budgetUtilizationTotals.remaining;
  const spentForChart = budgetUtilizationTotals.spent;
  const remainingForChart = budgetUtilizationTotals.remaining;
  const usedPercent =
    budgetedForChart > 0 ? (budgetUtilizationTotals.spent / budgetedForChart) * 100 : 0;
  const spendBasisLabel = getSpendBasisLabel(spendBasis);
  const remainingBudgetForChart = Math.max(budgetedForChart - spentForChart, 0);
  const spentWidth = Math.min(usedPercent, 100);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        <IncomeAllocationCard
          className="h-full lg:col-span-2"
          monthlyIncome={income}
          budgetEntries={budgetEntries}
        />
      </div>

      <BudgetUtilizationCard
        view={budgetUtilizationView}
        onToggle={() =>
          setBudgetUtilizationView((current) =>
            current === 'chart' ? 'numbers' : 'chart',
          )
        }
        showFilteredBadge={isBudgetFiltered}
        spendBasisLabel={spendBasisLabel}
        incomeSummary={formatWholeCurrency(comparisonIncome)}
        budgetedSummary={formatWholeCurrency(budgetedForChart)}
        spentSummary={formatWholeCurrency(spentForChart)}
        usedPercent={usedPercent}
        spentWidth={spentWidth}
        spentForChart={spentForChart}
        remainingBudgetForChart={remainingBudgetForChart}
        amountContextLabel={spendBasisLabel}
        income={comparisonIncome}
        budgetedForChart={budgetedForChart}
        remainingForChart={remainingForChart}
        remainingTotal={budgetUtilizationTotals.remaining}
      />
    </div>
  );
};
