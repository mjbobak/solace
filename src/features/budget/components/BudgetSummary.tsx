import React, { useState } from 'react';

import { BudgetUtilizationCard } from '@/features/budget/components/budgetSummary/BudgetUtilizationCard';
import {
  formatWholeCurrency,
  type SummaryView,
} from '@/features/budget/components/budgetSummary/constants';
import { IncomeAllocationCard } from '@/features/budget/components/budgetSummary/IncomeAllocationCard';
import { WealthContributionsCard } from '@/features/budget/components/budgetSummary/WealthContributionsCard';
import type { BudgetTotals } from '@/features/budget/hooks/useBudgetCalculations';
import type { SpendBasis } from '@/features/budget/types/budgetView';
import {
  getCompletedMonthsForYear,
  getSpendBasisLabel,
  scaleAnnualAmountForSpendBasis,
} from '@/shared/utils/spendBasis';

interface BudgetSummaryProps {
  totals: BudgetTotals;
  totalBudgeted: number;
  budgetUtilizationTotals?: BudgetTotals;
  investments: number;
  income: number;
  savings: number;
  essentialBudget: number;
  funsiesBudget: number;
  isBudgetFiltered: boolean;
  planningYear: number;
  spendBasis: SpendBasis;
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = (props) => {
  const {
    totals,
    budgetUtilizationTotals = totals,
    investments,
    income,
    savings,
    essentialBudget,
    funsiesBudget,
    isBudgetFiltered,
    planningYear,
    spendBasis,
  } = props;

  const [incomeUtilizationView, setIncomeUtilizationView] =
    useState<SummaryView>('chart');
  const [budgetUtilizationView, setBudgetUtilizationView] =
    useState<SummaryView>('chart');
  const [savingsInvestingView, setSavingsInvestingView] =
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
  const budgetedIncomePercent =
    comparisonIncome > 0 ? (budgetedForChart / comparisonIncome) * 100 : 0;
  const spentIncomePercent =
    comparisonIncome > 0 ? (spentForChart / comparisonIncome) * 100 : 0;
  const remainingBudgetForChart = Math.max(budgetedForChart - spentForChart, 0);
  const unbudgetedIncomeForChart = Math.max(
    comparisonIncome - budgetedForChart,
    0,
  );
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
  const savingsForAllocation = plannedSavings + investments;
  const totalWealth = plannedSavings + investments;
  const wealthRate = income > 0 ? (totalWealth / income) * 100 : 0;
  const essentialIncomePercent =
    income > 0 ? (essentialBudget / income) * 100 : 0;
  const funsiesIncomePercent = income > 0 ? (funsiesBudget / income) * 100 : 0;
  const investmentIncomePercent = income > 0 ? (investments / income) * 100 : 0;
  const plannedSavingsIncomePercent =
    income > 0 ? (plannedSavings / income) * 100 : 0;
  const wealthIncomePercent = income > 0 ? (totalWealth / income) * 100 : 0;
  const essentialWidth = Math.min(essentialIncomePercent, 100);
  const funsiesWidth = Math.min(
    funsiesIncomePercent,
    Math.max(100 - essentialWidth, 0),
  );
  const savingsWidth = Math.min(
    wealthIncomePercent,
    Math.max(100 - essentialWidth - funsiesWidth, 0),
  );
  const savingsWealthWidth = Math.min(plannedSavingsIncomePercent, 100);
  const investmentWealthWidth = Math.min(
    investmentIncomePercent,
    Math.max(100 - savingsWealthWidth, 0),
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        <IncomeAllocationCard
          view={incomeUtilizationView}
          onToggle={() =>
            setIncomeUtilizationView((current) =>
              current === 'chart' ? 'numbers' : 'chart',
            )
          }
          annualIncomeSummary={formatWholeCurrency(income * 12)}
          annualEssentialSummary={formatWholeCurrency(essentialBudget * 12)}
          annualFunsiesSummary={formatWholeCurrency(funsiesBudget * 12)}
          annualWealthSummary={formatWholeCurrency(totalWealth * 12)}
          essentialWidth={essentialWidth}
          funsiesWidth={funsiesWidth}
          savingsWidth={savingsWidth}
          essentialBudget={essentialBudget}
          funsiesBudget={funsiesBudget}
          savingsForAllocation={savingsForAllocation}
          essentialIncomePercent={essentialIncomePercent}
          funsiesIncomePercent={funsiesIncomePercent}
          wealthIncomePercent={wealthIncomePercent}
          income={income}
          wealthRate={wealthRate}
        />

        <WealthContributionsCard
          view={savingsInvestingView}
          onToggle={() =>
            setSavingsInvestingView((current) =>
              current === 'chart' ? 'numbers' : 'chart',
            )
          }
          annualIncomeSummary={formatWholeCurrency(income * 12)}
          annualSavingsSummary={formatWholeCurrency(plannedSavings * 12)}
          annualInvestmentsSummary={formatWholeCurrency(investments * 12)}
          wealthIncomePercent={wealthIncomePercent}
          savingsWealthWidth={savingsWealthWidth}
          investmentWealthWidth={investmentWealthWidth}
          plannedSavings={plannedSavings}
          investments={investments}
          savingsIncomePercent={plannedSavingsIncomePercent}
          investmentIncomePercent={investmentIncomePercent}
          totalWealth={totalWealth}
          wealthRate={wealthRate}
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
        budgetedIncomePercent={budgetedIncomePercent}
        spentIncomePercent={spentIncomePercent}
        spentWidth={spentWidth}
        remainingBudgetWidth={remainingBudgetWidth}
        unbudgetedIncomeWidth={unbudgetedIncomeWidth}
        spentForChart={spentForChart}
        remainingBudgetForChart={remainingBudgetForChart}
        unbudgetedIncomeForChart={unbudgetedIncomeForChart}
        amountContextLabel={spendBasisLabel}
        income={comparisonIncome}
        budgetedForChart={budgetedForChart}
        remainingForChart={remainingForChart}
        remainingTotal={budgetUtilizationTotals.remaining}
      />
    </div>
  );
};
