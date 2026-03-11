import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { LuWallet, LuPiggyBank } from 'react-icons/lu';

import type { BudgetTotals } from '@/features/budget/hooks/useBudgetCalculations';
import { statusPalette } from '@/shared/theme';
import { formatCurrency } from '@/shared/utils/currency';

interface BudgetSummaryProps {
  totals: BudgetTotals;
  investments: number;
  income: number;
  savings: number;
  savingsRate: number;
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({
  totals,
  investments,
  income,
  savings,
  savingsRate,
}) => {
  const usedBudgetBase = totals.spent + totals.remaining;
  const usedPercent = usedBudgetBase > 0 ? (totals.spent / usedBudgetBase) * 100 : 0;

  const CurrencyStack = ({
    monthlyAmount,
    annualClassName = 'text-gray-900',
    monthlyClassName = 'text-gray-500',
  }: {
    monthlyAmount: number;
    annualClassName?: string;
    monthlyClassName?: string;
  }) => (
    <div className="flex flex-col leading-tight">
      <span className={`text-lg font-bold ${annualClassName}`}>
        {formatCurrency(monthlyAmount * 12, '$')}
      </span>
      <span className={`text-xs ${monthlyClassName}`}>
        {formatCurrency(monthlyAmount, '$')}
      </span>
    </div>
  );

  const getSavingsTheme = () => {
    if (savings < 0) {
      return {
        bg: 'from-rose-50 to-red-50',
        text: 'text-rose-700',
      };
    }
    if (savingsRate >= 20) {
      return {
        bg: 'from-emerald-50 to-green-50',
        text: 'text-emerald-700',
      };
    }
    if (savingsRate >= 10) {
      return {
        bg: 'from-indigo-50 to-blue-50',
        text: 'text-indigo-700',
      };
    }
    return {
      bg: 'from-amber-50 to-orange-50',
      text: 'text-amber-700',
    };
  };

  const theme = getSavingsTheme();
  const plannedValueClasses = {
    annualClassName: 'text-indigo-700',
    monthlyClassName: 'text-indigo-700/75',
  };

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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={getCardVariants(0)}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg">
              <LuWallet className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Budget Utilization
            </h3>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Total Budgeted</p>
            <CurrencyStack monthlyAmount={totals.budgeted} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Spent</p>
              <p className="text-sm font-bold text-gray-900">
                {formatCurrency(totals.spent, '$')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Remaining</p>
              <p
                className={`text-sm font-bold ${
                  totals.remaining < 0 ? 'text-red-600' : 'text-gray-900'
                }`}
              >
                {formatCurrency(totals.remaining, '$')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Used</p>
              <p
                className={`text-sm font-bold ${
                  usedPercent > 100 ? 'text-red-600' : 'text-gray-900'
                }`}
              >
                {usedPercent.toFixed(0)}%
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={getCardVariants(1)}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 lg:row-span-1"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className={`p-2 bg-gradient-to-br ${theme.bg} rounded-lg`}>
              <LuPiggyBank className={`w-4 h-4 ${theme.text}`} />
            </div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Savings & Investing
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">
                Planned Savings
              </p>
              <div className="mb-1">
                <CurrencyStack
                  monthlyAmount={Math.abs(savings)}
                  {...plannedValueClasses}
                />
              </div>
              <p className="text-xs text-gray-500">
                {savingsRate > 0
                  ? savingsRate.toFixed(1)
                  : Math.abs(savingsRate).toFixed(1)}
                %
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">
                Planned Investments
              </p>
              <div className="mb-1">
                <CurrencyStack
                  monthlyAmount={investments}
                  {...plannedValueClasses}
                />
              </div>
              <p className="text-xs text-gray-500">
                {income > 0 ? ((investments / income) * 100).toFixed(1) : '0'}%
              </p>
            </div>

            <div>
              <p className="text-xs text-emerald-700 uppercase tracking-wider font-semibold mb-3">
                Total Going to Wealth
              </p>
              <div className="mb-1">
                <CurrencyStack
                  monthlyAmount={Math.abs(savings) + investments}
                  {...plannedValueClasses}
                />
              </div>
              <p
                className="text-xs opacity-75"
                style={{ color: statusPalette.budget }}
              >
                {income > 0
                  ? (
                      ((Math.abs(savings) + investments) / income) *
                      100
                    ).toFixed(1)
                  : '0'}
                % of income
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
