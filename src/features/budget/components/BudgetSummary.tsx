import React, { useEffect, useState } from 'react';

import { BudgetInsightsCard } from '@/features/budget/components/budgetSummary/BudgetInsightsCard';
import { BudgetUtilizationCard } from '@/features/budget/components/budgetSummary/BudgetUtilizationCard';
import { formatWholeCurrency } from '@/features/budget/components/budgetSummary/constants';
import type { BudgetTotals } from '@/features/budget/hooks/useBudgetCalculations';
import type { BudgetEntry, SpendBasis } from '@/features/budget/types/budgetView';
import { IncomeAllocationCard } from '@/features/dashboard-infographic/components/IncomeAllocationCard';
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

const BUDGET_OVERVIEW_COLLAPSED_KEY = 'budget-overview-collapsed';

function getStoredCollapsed(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  // Default to collapsed until the user explicitly opens it.
  return window.localStorage.getItem(BUDGET_OVERVIEW_COLLAPSED_KEY) !== 'false';
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

  // Persisted so the overview keeps its open/closed state as the user navigates
  // between pages (the view unmounts on navigation) and across reloads.
  const [isInsightsCollapsed, setIsInsightsCollapsed] =
    useState(getStoredCollapsed);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(
      BUDGET_OVERVIEW_COLLAPSED_KEY,
      String(isInsightsCollapsed),
    );
  }, [isInsightsCollapsed]);

  const completedMonths = getCompletedMonthsForYear(planningYear);
  const comparisonIncome = scaleAnnualAmountForSpendBasis({
    annualAmount: income * 12,
    spendBasis,
    completedMonths,
  });
  const budgetedForChart =
    budgetUtilizationTotals.spent + budgetUtilizationTotals.remaining;
  const spentForChart = budgetUtilizationTotals.spent;
  const usedPercent =
    budgetedForChart > 0 ? (budgetUtilizationTotals.spent / budgetedForChart) * 100 : 0;
  const spendBasisLabel = getSpendBasisLabel(spendBasis);
  const remainingBudgetForChart = Math.max(budgetedForChart - spentForChart, 0);

  return (
    <BudgetInsightsCard
      isCollapsed={isInsightsCollapsed}
      onToggleCollapsed={() => setIsInsightsCollapsed(!isInsightsCollapsed)}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <IncomeAllocationCard
          embedded
          monthlyIncome={income}
          budgetEntries={budgetEntries}
        />

        <div className="section-divider border-t pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <BudgetUtilizationCard
          embedded
          showFilteredBadge={isBudgetFiltered}
          spendBasisLabel={spendBasisLabel}
          incomeSummary={formatWholeCurrency(comparisonIncome)}
          budgetedSummary={formatWholeCurrency(budgetedForChart)}
          spentSummary={formatWholeCurrency(spentForChart)}
          usedPercent={usedPercent}
          remainingBudgetForChart={remainingBudgetForChart}
          remainingTotal={budgetUtilizationTotals.remaining}
        />
        </div>
      </div>
    </BudgetInsightsCard>
  );
};
