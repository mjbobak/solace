/**
 * Component for income summary section
 * Displays summary cards and period/type toggles with animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

import { SummaryCard } from '@/shared/components/data/SummaryCard';
import { ToggleButtonGroup } from '@/shared/components/ToggleButtonGroup';
import { formatCurrency } from '@/shared/utils/currency';

import type {
  IncomePeriod,
  IncomeDisplayType,
  IncomeTotals,
} from '../types/incomeView';

interface IncomeSummaryProps {
  period: IncomePeriod;
  onPeriodChange: (period: IncomePeriod) => void;
  type: IncomeDisplayType;
  onTypeChange: (type: IncomeDisplayType) => void;
  totals: IncomeTotals;
}

const getCardVariants = (index: number): Variants => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.1,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
});

export const IncomeSummary: React.FC<IncomeSummaryProps> = ({
  period,
  onPeriodChange,
  type,
  onTypeChange,
  totals,
}) => {
  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          {/* Period Toggle */}
          <ToggleButtonGroup
            value={period}
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'annual', label: 'Annual' },
            ]}
            onChange={onPeriodChange}
          />

          {/* Gross/Net Toggle */}
          <ToggleButtonGroup
            value={type}
            options={[
              { value: 'gross', label: 'Gross' },
              { value: 'net', label: 'Net' },
            ]}
            onChange={onTypeChange}
          />
        </div>
      </motion.div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div
          variants={getCardVariants(0)}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
        >
          <SummaryCard
            label="Regular Income"
            value={formatCurrency(
              period === 'annual'
                ? type === 'gross'
                  ? totals.regularIncome.annualGross
                  : totals.regularIncome.annualNet
                : type === 'gross'
                  ? totals.regularIncome.monthlyGross
                  : totals.regularIncome.monthlyNet,
              '$',
            )}
          />
        </motion.div>

        <motion.div
          variants={getCardVariants(1)}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
        >
          <SummaryCard
            label="Bonus Income"
            value={formatCurrency(
              period === 'annual'
                ? type === 'gross'
                  ? totals.bonusIncome.annualGross
                  : totals.bonusIncome.annualNet
                : type === 'gross'
                  ? totals.bonusIncome.monthlyGross
                  : totals.bonusIncome.monthlyNet,
              '$',
            )}
          />
        </motion.div>
      </div>
    </div>
  );
};
