/**
 * Financial Health Section
 * Displays 5 key metrics: Total Income (with breakdown), Total Spending, Total Savings, Total Invested, Total Net Wealth
 */

import React from 'react';
import { LuTrendingDown, LuPiggyBank, LuDollarSign } from 'react-icons/lu';

import { useBudgetCalculations } from '@/features/budget/hooks/useBudgetCalculations';
import { mockBudgetData } from '@/features/budget/services/mockBudgetData';
import { isInvestmentCategory } from '@/features/budget/utils/investmentCategories';
import { dashboardMetrics } from '@/features/home/services/mockDashboardData';
import { formatCurrency } from '@/shared/utils/currency';

import { useIncomeAnalysis } from '../hooks/useIncomeAnalysis';
import type { Period } from '../types/infographic';

import { ScrollAnimatedSection } from './ScrollAnimatedSection';
import { SectionNarrative } from './SectionNarrative';

interface FinancialHealthSectionProps {
  period: Period;
}

export const FinancialHealthSection: React.FC<FinancialHealthSectionProps> = ({
  period,
}) => {
  // Income calculations (fixed for now, same as BudgetView)
  const ANNUAL_NET_INCOME = 200000;
  const monthlyNetIncome = ANNUAL_NET_INCOME / 12;
  const income = period === 'monthly' ? monthlyNetIncome : ANNUAL_NET_INCOME;

  // Get income breakdown (salary vs bonus)
  const incomeAnalysis = useIncomeAnalysis();

  // Budget calculations
  const budgetCalculations = useBudgetCalculations(mockBudgetData);
  const monthlyTotalBudgeted = budgetCalculations.budgeted;
  const totalBudgeted =
    period === 'annual' ? monthlyTotalBudgeted * 12 : monthlyTotalBudgeted;

  // Investment calculation (from budget data)
  const monthlyInvestments = mockBudgetData
    .filter((entry) => isInvestmentCategory(entry.expenseCategory))
    .reduce((sum, entry) => sum + entry.budgeted, 0);
  const investments =
    period === 'annual' ? monthlyInvestments * 12 : monthlyInvestments;

  // Savings calculation
  const savings = income - totalBudgeted;

  // Spending (adjust for period)
  const spending =
    period === 'annual'
      ? dashboardMetrics.monthlySpending * 12
      : dashboardMetrics.monthlySpending;

  // Helper function for percentage calculation
  const getPercentage = (value: number) =>
    income > 0 ? ((value / income) * 100).toFixed(1) : '0.0';

  // Extract salary and bonus from income analysis
  const salaryAmount =
    incomeAnalysis.streamBreakdown.find((s) => s.stream === 'Salary')?.amount ||
    0;
  const bonusAmount =
    incomeAnalysis.streamBreakdown.find((s) => s.stream === 'Bonus')?.amount ||
    0;

  return (
    <ScrollAnimatedSection className="py-12 px-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Financial Health Overview
        </h2>
        <SectionNarrative
          text="Your complete financial picture showing income, spending, savings, and wealth generation. All percentages are relative to total income."
          highlight={true}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1: Total Income */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-lg">
              <LuDollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Income
            </h3>
          </div>

          <div className="h-6" />

          <div className="mb-3">
            <p className="text-sm font-bold text-gray-900 mb-1">
              {formatCurrency(income, '$')}
            </p>
            <p className="text-xs text-gray-500"></p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 mt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 mb-1">Salary</p>
              <p className="text-xs font-bold text-gray-900">
                {formatCurrency(salaryAmount, '$')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Bonus</p>
              <p className="text-xs font-bold text-gray-900">
                {formatCurrency(bonusAmount, '$')}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Total Spending */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg">
              <LuTrendingDown className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Spending
            </h3>
          </div>

          <div className="h-6" />

          <div>
            <p className="text-sm font-bold text-gray-900 mb-1">
              {formatCurrency(spending, '$')}
            </p>
            <p className="text-xs text-gray-500">
              {getPercentage(spending)}% of income
            </p>
          </div>
        </div>

        {/* Card 3: Savings & Investing */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200 lg:col-span-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg">
              <LuPiggyBank className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Savings & Investing
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
                Planned Savings
              </p>
              <p className="text-sm font-bold text-gray-900 mb-1">
                {formatCurrency(Math.abs(savings), '$')}
              </p>
              <p className="text-xs text-gray-500">
                {getPercentage(Math.abs(savings))}%
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
                Planned Investments
              </p>
              <p className="text-sm font-bold text-gray-900 mb-1">
                {formatCurrency(investments, '$')}
              </p>
              <p className="text-xs text-gray-500">
                {getPercentage(investments)}%
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
                Total Going to Wealth
              </p>
              <p className="text-sm font-bold text-gray-900 mb-1">
                {formatCurrency(Math.abs(savings) + investments, '$')}
              </p>
              <p className="text-xs text-gray-500">
                {getPercentage(Math.abs(savings) + investments)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </ScrollAnimatedSection>
  );
};
