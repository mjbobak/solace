import React from 'react';
import { motion } from 'framer-motion';
import { LuPiggyBank } from 'react-icons/lu';

import {
  cardIconClass,
  getCardVariants,
  type SummaryView,
} from './constants';
import { WealthContributionsChart } from './WealthContributionsChart';
import { SavingsInvestingNumbers } from './SavingsInvestingNumbers';
import { SummaryCardHeader } from './SummaryCardChrome';

interface WealthContributionsCardProps {
  view: SummaryView;
  onToggle: () => void;
  annualIncomeSummary: string;
  annualSavingsSummary: string;
  annualInvestmentsSummary: string;
  wealthIncomePercent: number;
  savingsWealthWidth: number;
  investmentWealthWidth: number;
  plannedSavings: number;
  investments: number;
  savingsIncomePercent: number;
  investmentIncomePercent: number;
  totalWealth: number;
  wealthRate: number;
}

export const WealthContributionsCard: React.FC<
  WealthContributionsCardProps
> = ({
  view,
  onToggle,
  annualIncomeSummary,
  annualSavingsSummary,
  annualInvestmentsSummary,
  wealthIncomePercent,
  savingsWealthWidth,
  investmentWealthWidth,
  plannedSavings,
  investments,
  savingsIncomePercent,
  investmentIncomePercent,
  totalWealth,
  wealthRate,
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={getCardVariants(2)}
    role="region"
    aria-label="Wealth Contributions"
    className="h-full rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-lg"
  >
    <SummaryCardHeader
      icon={<LuPiggyBank className={cardIconClass} />}
      title="Wealth Contributions"
      currentView={view}
      onToggle={onToggle}
    />

    <div className="space-y-3">
      <p className="-mt-2 text-sm leading-relaxed text-gray-500">
        See how much of your income is going toward wealth generation through
        savings and investments.
      </p>
      {view === 'chart' ? (
        <WealthContributionsChart
          annualIncomeSummary={annualIncomeSummary}
          annualSavingsSummary={annualSavingsSummary}
          annualInvestmentsSummary={annualInvestmentsSummary}
          wealthIncomePercent={wealthIncomePercent}
          savingsWealthWidth={savingsWealthWidth}
          investmentWealthWidth={investmentWealthWidth}
          plannedSavings={plannedSavings}
          investments={investments}
          savingsIncomePercent={savingsIncomePercent}
          investmentIncomePercent={investmentIncomePercent}
        />
      ) : (
        <SavingsInvestingNumbers
          plannedSavings={plannedSavings}
          investments={investments}
          totalWealth={totalWealth}
          wealthRate={wealthRate}
        />
      )}
    </div>
  </motion.div>
);
