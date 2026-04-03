import React from 'react';
import { motion } from 'framer-motion';
import { LuWallet } from 'react-icons/lu';

import { BudgetUtilizationChart } from './BudgetUtilizationChart';
import { BudgetUtilizationNumbers } from './BudgetUtilizationNumbers';
import { cardIconClass, getCardVariants, type SummaryView } from './constants';
import { SummaryCardHeader } from './SummaryCardChrome';

interface BudgetUtilizationCardProps {
  view: SummaryView;
  onToggle: () => void;
  showFilteredBadge: boolean;
  annualIncomeSummary: string;
  annualBudgetedSummary: string;
  annualSpentSummary: string;
  usedPercent: number;
  budgetedIncomePercent: number;
  spentIncomePercent: number;
  spentWidth: number;
  remainingBudgetWidth: number;
  unbudgetedIncomeWidth: number;
  spentForChart: number;
  remainingBudgetForChart: number;
  unbudgetedIncomeForChart: number;
  componentOptions: Array<{
    id: string;
    label: string;
  }>;
  selectedComponentIds: string[];
  onSelectedComponentIdsChange: (ids: string[]) => void;
  income: number;
  budgetedForChart: number;
  remainingForChart: number;
  remainingTotal: number;
}

export const BudgetUtilizationCard: React.FC<BudgetUtilizationCardProps> = ({
  view,
  onToggle,
  showFilteredBadge,
  annualIncomeSummary,
  annualBudgetedSummary,
  annualSpentSummary,
  usedPercent,
  budgetedIncomePercent,
  spentIncomePercent,
  spentWidth,
  remainingBudgetWidth,
  unbudgetedIncomeWidth,
  spentForChart,
  remainingBudgetForChart,
  unbudgetedIncomeForChart,
  componentOptions,
  selectedComponentIds,
  onSelectedComponentIdsChange,
  income,
  budgetedForChart,
  remainingForChart,
  remainingTotal,
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={getCardVariants(1)}
    role="region"
    aria-label="Budget Utilization"
    className="h-full rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-lg"
  >
    <SummaryCardHeader
      icon={<LuWallet className={cardIconClass} />}
      title="Budget Utilization"
      currentView={view}
      onToggle={onToggle}
      showFilteredBadge={showFilteredBadge}
    />

    {view === 'chart' ? (
      <BudgetUtilizationChart
        annualIncomeSummary={annualIncomeSummary}
        annualBudgetedSummary={annualBudgetedSummary}
        annualSpentSummary={annualSpentSummary}
        usedPercent={usedPercent}
        budgetedIncomePercent={budgetedIncomePercent}
        spentIncomePercent={spentIncomePercent}
        spentWidth={spentWidth}
        remainingBudgetWidth={remainingBudgetWidth}
        unbudgetedIncomeWidth={unbudgetedIncomeWidth}
        spentForChart={spentForChart}
        remainingBudgetForChart={remainingBudgetForChart}
        unbudgetedIncomeForChart={unbudgetedIncomeForChart}
        componentOptions={componentOptions}
        selectedComponentIds={selectedComponentIds}
        onSelectedComponentIdsChange={onSelectedComponentIdsChange}
      />
    ) : (
      <BudgetUtilizationNumbers
        income={income}
        budgetedForChart={budgetedForChart}
        spentForChart={spentForChart}
        remainingForChart={remainingForChart}
        remainingTotal={remainingTotal}
        usedPercent={usedPercent}
      />
    )}
  </motion.div>
);
