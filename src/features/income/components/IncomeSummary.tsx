/**
 * Component for income summary section
 * Displays summary cards and period/type toggles with animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

import { ToggleButtonGroup } from '@/shared/components/ToggleButtonGroup';
import { formatCurrency } from '@/shared/utils/currency';

import type {
  IncomePeriod,
  IncomeCategory,
  IncomeTotals,
} from '../types/incomeView';

interface IncomeSummaryProps {
  period: IncomePeriod;
  onPeriodChange: (period: IncomePeriod) => void;
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
  totals,
}) => {
  const getPeriodValues = (income: IncomeCategory) => {
    if (period === 'annual') {
      return {
        gross: income.annualGross,
        net: income.annualNet,
      };
    }

    return {
      gross: income.monthlyGross,
      net: income.monthlyNet,
    };
  };

  const IncomeBreakdown = ({
    label,
    income,
  }: {
    label: string;
    income: IncomeCategory;
  }) => {
    const { gross, net } = getPeriodValues(income);

    return (
      <div>
        <p className="mb-6 text-sm font-semibold uppercase tracking-wider text-gray-700">
          {label}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Gross
            </p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(gross, '$')}
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Net
            </p>
            <p className="text-lg font-bold text-emerald-700">
              {formatCurrency(net, '$')}
            </p>
          </div>
        </div>
      </div>
    );
  };

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
          <IncomeBreakdown
            label="Regular Income"
            income={totals.regularIncome}
          />
        </motion.div>

        <motion.div
          variants={getCardVariants(1)}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
        >
          <IncomeBreakdown label="Bonus Income" income={totals.bonusIncome} />
        </motion.div>
      </div>
    </div>
  );
};
