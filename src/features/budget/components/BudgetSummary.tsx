import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { LuWallet, LuPiggyBank } from 'react-icons/lu';

import type { BudgetTotals } from '@/features/budget/hooks/useBudgetCalculations';
import { formatCurrency } from '@/shared/utils/currency';

interface BudgetSummaryProps {
  totals: BudgetTotals;
  totalBudgeted: number;
  investments: number;
  income: number;
  savings: number;
  savingsRate: number;
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({
  totals,
  totalBudgeted,
  investments,
  income,
  savings,
  savingsRate,
}) => {
  const usedBudgetBase = totals.spent + totals.remaining;
  const usedPercent =
    usedBudgetBase > 0 ? (totals.spent / usedBudgetBase) * 100 : 0;

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
      <span className="flex items-baseline gap-2">
        <span className={`text-lg font-bold ${annualClassName}`}>
          {formatCurrency(monthlyAmount * 12, '$')}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
          annual
        </span>
      </span>
      <span className="flex items-baseline gap-2">
        <span className={`text-xs ${monthlyClassName}`}>
          {formatCurrency(monthlyAmount, '$')}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
          monthly
        </span>
      </span>
    </div>
  );

  const neutralValueClasses = {
    annualClassName: 'text-gray-900',
    monthlyClassName: 'text-gray-500',
  };
  const highlightedValueClasses = {
    annualClassName: 'text-indigo-700',
    monthlyClassName: 'text-indigo-700/75',
  };
  const cardIconContainerClass =
    'p-2 rounded-lg bg-gradient-to-br from-sky-50 to-slate-100';
  const cardIconClass = 'w-4 h-4 text-slate-500';

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={getCardVariants(0)}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 lg:col-span-1"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className={cardIconContainerClass}>
              <LuWallet className={cardIconClass} />
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
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className={cardIconContainerClass}>
              <LuPiggyBank className={cardIconClass} />
            </div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Savings & Investing
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">
                Planned Income
              </p>
              <div className="mb-1">
                <CurrencyStack
                  monthlyAmount={income}
                  {...neutralValueClasses}
                />
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">
                Total Budgeted
              </p>
              <div className="mb-1">
                <CurrencyStack
                  monthlyAmount={totalBudgeted}
                  {...neutralValueClasses}
                />
              </div>
              <p className="text-xs text-gray-500">
                {income > 0 ? ((totalBudgeted / income) * 100).toFixed(1) : '0'}
                % of income
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">
                Planned Savings
              </p>
              <div className="mb-1">
                <CurrencyStack
                  monthlyAmount={Math.abs(savings)}
                  {...neutralValueClasses}
                />
              </div>
              <p className="text-xs text-gray-500">
                {savingsRate > 0
                  ? savingsRate.toFixed(1)
                  : Math.abs(savingsRate).toFixed(1)}
                % of income
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">
                Planned Investments
              </p>
              <div className="mb-1">
                <CurrencyStack
                  monthlyAmount={investments}
                  {...neutralValueClasses}
                />
              </div>
              <p className="text-xs text-gray-500">
                {income > 0 ? ((investments / income) * 100).toFixed(1) : '0'}
                % of income
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">
                Total Going to Wealth
              </p>
              <div className="mb-1">
                <CurrencyStack
                  monthlyAmount={Math.abs(savings) + investments}
                  {...highlightedValueClasses}
                />
              </div>
              <p className="text-xs text-gray-500">
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
