import React from 'react';
import { motion } from 'framer-motion';

import { budgetSummaryTheme } from '@/shared/theme';

import { BudgetUtilizationChart } from './BudgetUtilizationChart';
import { getCardVariants } from './constants';
import { SummaryCardHeader } from './SummaryCardChrome';

interface BudgetUtilizationCardProps {
  showFilteredBadge: boolean;
  spendBasisLabel: string;
  incomeSummary: string;
  budgetedSummary: string;
  spentSummary: string;
  usedPercent: number;
  remainingBudgetForChart: number;
  remainingTotal: number;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
  /** Renders as a bare section (no card chrome) for embedding in another card. */
  embedded?: boolean;
}

export const BudgetUtilizationCard: React.FC<BudgetUtilizationCardProps> = ({
  showFilteredBadge,
  spendBasisLabel,
  incomeSummary,
  budgetedSummary,
  spentSummary,
  usedPercent,
  remainingBudgetForChart,
  remainingTotal,
  isCollapsed = false,
  onToggleCollapsed,
  embedded = false,
}) => {
  const body = (
    <>
      <SummaryCardHeader
        title="Budget Utilization"
        showFilteredBadge={showFilteredBadge}
        isCollapsed={isCollapsed}
        onToggleCollapsed={onToggleCollapsed}
      />

      {isCollapsed ? null : (
        <BudgetUtilizationChart
          spendBasisLabel={spendBasisLabel}
          incomeSummary={incomeSummary}
          budgetedSummary={budgetedSummary}
          spentSummary={spentSummary}
          usedPercent={usedPercent}
          remainingBudgetForChart={remainingBudgetForChart}
          remainingTotal={remainingTotal}
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
