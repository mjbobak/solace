import React from 'react';
import { motion } from 'framer-motion';
import { LuChartColumn, LuChevronDown, LuChevronRight } from 'react-icons/lu';

import { budgetSummaryTheme } from '@/shared/theme';

import {
  cardIconClass,
  cardIconContainerClass,
  getCardVariants,
} from './constants';

// Uses `surface-card` (not `budget-summary-card`) so it sits at its natural
// height in the viewport-locked page instead of stretching via `h-full`.

interface BudgetInsightsCardProps {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  children: React.ReactNode;
}

export const BudgetInsightsCard: React.FC<BudgetInsightsCardProps> = ({
  isCollapsed,
  onToggleCollapsed,
  children,
}) => {
  const collapseLabel = isCollapsed
    ? 'Show budget overview'
    : 'Hide budget overview';

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={getCardVariants(0)}
      role="region"
      aria-label="Budget Overview"
      className="surface-card shrink-0"
    >
      <div
        className={`flex items-center justify-between gap-3 ${
          isCollapsed ? '' : 'mb-4'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className={cardIconContainerClass}>
            <LuChartColumn className={cardIconClass} />
          </div>
          <h3 className={`text-lg font-bold ${budgetSummaryTheme.summaryTitle}`}>
            Budget Overview
          </h3>
        </div>

        <button
          type="button"
          className={budgetSummaryTheme.controlButton}
          onClick={onToggleCollapsed}
          aria-expanded={!isCollapsed}
          aria-label={collapseLabel}
          title={collapseLabel}
        >
          {isCollapsed ? (
            <LuChevronRight className="h-4 w-4" />
          ) : (
            <LuChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {isCollapsed ? null : <div className="space-y-6">{children}</div>}
    </motion.div>
  );
};
