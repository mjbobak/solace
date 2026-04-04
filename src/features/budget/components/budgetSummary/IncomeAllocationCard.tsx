import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LuWallet } from 'react-icons/lu';

import {
  cardIconClass,
  getCardVariants,
  type SummaryView,
} from './constants';
import { IncomeAllocationChart } from './IncomeAllocationChart';
import { IncomeAllocationNumbers } from './IncomeAllocationNumbers';
import { SummaryCardHeader } from './SummaryCardChrome';

interface IncomeAllocationCardProps {
  className?: string;
  view: SummaryView;
  onToggle: () => void;
  annualIncomeSummary: string;
  annualEssentialSummary: string;
  annualFunsiesSummary: string;
  annualWealthSummary: string;
  essentialWidth: number;
  funsiesWidth: number;
  savingsWidth: number;
  essentialBudget: number;
  funsiesBudget: number;
  savingsForAllocation: number;
  essentialIncomePercent: number;
  funsiesIncomePercent: number;
  wealthIncomePercent: number;
  income: number;
  wealthRate: number;
  plannedSavings: number;
  investments: number;
  savingsIncomePercent: number;
  investmentIncomePercent: number;
}

export const IncomeAllocationCard: React.FC<IncomeAllocationCardProps> = ({
  className = '',
  view,
  onToggle,
  annualIncomeSummary,
  annualEssentialSummary,
  annualFunsiesSummary,
  annualWealthSummary,
  essentialWidth,
  funsiesWidth,
  savingsWidth,
  essentialBudget,
  funsiesBudget,
  savingsForAllocation,
  essentialIncomePercent,
  funsiesIncomePercent,
  wealthIncomePercent,
  income,
  wealthRate,
  plannedSavings,
  investments,
  savingsIncomePercent,
  investmentIncomePercent,
}) => {
  const [isWealthExpanded, setIsWealthExpanded] = useState(false);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={getCardVariants(0)}
      role="region"
      aria-label="Income Allocation"
      className={`h-full rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-lg ${className}`}
    >
      <SummaryCardHeader
        icon={<LuWallet className={cardIconClass} />}
        title="Income Allocation"
        currentView={view}
        onToggle={onToggle}
      />

      <div className="space-y-3">
        <p className="-mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
          See how much of your income is distributed across different spending
          categories.
        </p>

        {view === 'chart' ? (
          <IncomeAllocationChart
            annualIncomeSummary={annualIncomeSummary}
            annualEssentialSummary={annualEssentialSummary}
            annualFunsiesSummary={annualFunsiesSummary}
            annualWealthSummary={annualWealthSummary}
            essentialWidth={essentialWidth}
            funsiesWidth={funsiesWidth}
            savingsWidth={savingsWidth}
            essentialBudget={essentialBudget}
            funsiesBudget={funsiesBudget}
            savingsForAllocation={savingsForAllocation}
            essentialIncomePercent={essentialIncomePercent}
            funsiesIncomePercent={funsiesIncomePercent}
            wealthIncomePercent={wealthIncomePercent}
            isWealthExpanded={isWealthExpanded}
            onWealthToggle={() => setIsWealthExpanded((current) => !current)}
            plannedSavings={plannedSavings}
            investments={investments}
            savingsIncomePercent={savingsIncomePercent}
            investmentIncomePercent={investmentIncomePercent}
          />
        ) : (
          <IncomeAllocationNumbers
            income={income}
            essentialBudget={essentialBudget}
            funsiesBudget={funsiesBudget}
            savingsForAllocation={savingsForAllocation}
            wealthRate={wealthRate}
          />
        )}
      </div>
    </motion.div>
  );
};
