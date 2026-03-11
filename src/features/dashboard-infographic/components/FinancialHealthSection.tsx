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
import { statusPalette } from '@/shared/theme';
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
        <h2 className="mb-4 text-2xl font-bold text-app">
          Financial Health Overview
        </h2>
        <SectionNarrative
          text="Your complete financial picture showing income, spending, savings, and wealth generation. All percentages are relative to total income."
          highlight={true}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="surface-card surface-card-hover p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="icon-tile icon-tile-success p-2">
              <LuDollarSign className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Income
            </h3>
          </div>

          <div className="h-6" />

          <div className="mb-3">
            <p className="mb-1 text-sm font-bold text-app">
              {formatCurrency(income, '$')}
            </p>
            <p className="text-xs text-muted"></p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-4 section-divider">
            <div>
              <p className="mb-1 text-xs text-muted">Salary</p>
              <p className="text-xs font-bold text-app">
                {formatCurrency(salaryAmount, '$')}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted">Bonus</p>
              <p className="text-xs font-bold text-app">
                {formatCurrency(bonusAmount, '$')}
              </p>
            </div>
          </div>
        </div>

        <div className="surface-card surface-card-hover p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="icon-tile icon-tile-danger p-2">
              <LuTrendingDown className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Spending
            </h3>
          </div>

          <div className="h-6" />

          <div>
            <p className="mb-1 text-sm font-bold text-app">
              {formatCurrency(spending, '$')}
            </p>
            <p className="text-xs text-muted">
              {getPercentage(spending)}% of income
            </p>
          </div>
        </div>

        <div className="surface-card p-5 lg:col-span-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="icon-tile icon-tile-brand p-2">
              <LuPiggyBank className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Savings & Investing
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Planned Savings
              </p>
              <p className="mb-1 text-sm font-bold text-app">
                {formatCurrency(Math.abs(savings), '$')}
              </p>
              <p className="text-xs text-muted">
                {getPercentage(Math.abs(savings))}%
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Planned Investments
              </p>
              <p
                className="mb-1 text-sm font-bold"
                style={{ color: statusPalette.budget }}
              >
                {formatCurrency(investments, '$')}
              </p>
              <p className="text-xs text-muted">
                {getPercentage(investments)}%
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Total Going to Wealth
              </p>
              <p
                className="mb-1 text-sm font-bold"
                style={{ color: statusPalette.budget }}
              >
                {formatCurrency(Math.abs(savings) + investments, '$')}
              </p>
              <p className="text-xs text-muted">
                {getPercentage(Math.abs(savings) + investments)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </ScrollAnimatedSection>
  );
};
