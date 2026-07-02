import React from 'react';
import { motion } from 'framer-motion';
import { LuWallet } from 'react-icons/lu';

import { budgetSummaryTheme } from '@/shared/theme';

import { BudgetUtilizationChart } from './BudgetUtilizationChart';
import { BudgetUtilizationNumbers } from './BudgetUtilizationNumbers';
import { cardIconClass, getCardVariants, type SummaryView } from './constants';
import { SummaryCardHeader } from './SummaryCardChrome';

interface BudgetUtilizationCardProps {
  view: SummaryView;
  onToggle: () => void;
  showFilteredBadge: boolean;
  spendBasisLabel: string;
  incomeSummary: string;
  budgetedSummary: string;
  spentSummary: string;
  usedPercent: number;
  spentWidth: number;
  spentForChart: number;
  remainingBudgetForChart: number;
  amountContextLabel: string;
  income: number;
  budgetedForChart: number;
  remainingForChart: number;
  remainingTotal: number;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
  /** Renders as a bare section (no card chrome) for embedding in another card. */
  embedded?: boolean;
}

export const BudgetUtilizationCard: React.FC<BudgetUtilizationCardProps> = ({
  view,
  onToggle,
  showFilteredBadge,
  spendBasisLabel,
  incomeSummary,
  budgetedSummary,
  spentSummary,
  usedPercent,
  spentWidth,
  spentForChart,
  remainingBudgetForChart,
  amountContextLabel,
  income,
  budgetedForChart,
  remainingForChart,
  remainingTotal,
  isCollapsed = false,
  onToggleCollapsed,
  embedded = false,
}) => {
  const body = (
    <>
      <SummaryCardHeader
        icon={<LuWallet className={cardIconClass} />}
        title="Budget Utilization"
        currentView={view}
        onToggle={onToggle}
        showFilteredBadge={showFilteredBadge}
        isCollapsed={isCollapsed}
        onToggleCollapsed={onToggleCollapsed}
      />

      {isCollapsed ? null : view === 'chart' ? (
        <BudgetUtilizationChart
          spendBasisLabel={spendBasisLabel}
          incomeSummary={incomeSummary}
          budgetedSummary={budgetedSummary}
          spentSummary={spentSummary}
          usedPercent={usedPercent}
          spentWidth={spentWidth}
          spentForChart={spentForChart}
          remainingBudgetForChart={remainingBudgetForChart}
          remainingTotal={remainingTotal}
          amountContextLabel={amountContextLabel}
        />
      ) : (
        <BudgetUtilizationNumbers
          income={income}
          budgetedForChart={budgetedForChart}
          spentForChart={spentForChart}
          remainingForChart={remainingForChart}
          remainingTotal={remainingTotal}
          usedPercent={usedPercent}
          amountContextLabel={amountContextLabel}
        />
      )}
    </>
  );

  if (embedded) {
    return <div>{body}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={getCardVariants(1)}
      role="region"
      aria-label="Budget Utilization"
      className={budgetSummaryTheme.summaryCard}
    >
      {body}
    </motion.div>
  );
};
