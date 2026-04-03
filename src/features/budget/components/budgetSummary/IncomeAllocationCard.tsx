import React from 'react';
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
  savingsIncomePercent: number;
  income: number;
  wealthRate: number;
}

export const IncomeAllocationCard: React.FC<IncomeAllocationCardProps> = ({
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
  savingsIncomePercent,
  income,
  wealthRate,
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={getCardVariants(0)}
    role="region"
    aria-label="Income Allocation"
    className="h-full rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-lg"
  >
    <SummaryCardHeader
      icon={<LuWallet className={cardIconClass} />}
      title="Income Allocation"
      currentView={view}
      onToggle={onToggle}
    />

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
        savingsIncomePercent={savingsIncomePercent}
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
  </motion.div>
);
