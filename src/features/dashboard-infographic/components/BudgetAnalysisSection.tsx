/**
 * Budget Analysis Section
 * Shows budget vs actual spending and budget breakdown
 */

import React from 'react';

import { mockBudgetData } from '@/features/budget/services/mockBudgetData';
import { spendingData } from '@/features/home/services/mockDashboardData';
import { DonutChart } from '@/shared/components/charts';

import type { Period } from '../types/infographic';

import { ScrollAnimatedSection } from './ScrollAnimatedSection';
import { SectionNarrative } from './SectionNarrative';

interface BudgetAnalysisSectionProps {
  period: Period;
}

export const BudgetAnalysisSection: React.FC<
  BudgetAnalysisSectionProps
> = () => {
  // Aggregate budget by expense type
  const essentialTotal = mockBudgetData
    .filter((item) => item.expenseType === 'ESSENTIAL')
    .reduce((sum, item) => sum + item.budgeted, 0);

  const funsiesTotal = mockBudgetData
    .filter((item) => item.expenseType === 'FUNSIES')
    .reduce((sum, item) => sum + item.budgeted, 0);

  const budgetBreakdown = [
    { name: 'Essential', value: essentialTotal },
    { name: 'Funsies', value: funsiesTotal },
  ];

  const totalBudget = essentialTotal + funsiesTotal;
  const totalSpent = spendingData.reduce((sum, item) => sum + item.Actual, 0);
  const percentageUsed = ((totalSpent / totalBudget) * 100).toFixed(1);

  const narrative = `You budgeted $${totalBudget.toLocaleString()} and spent $${totalSpent.toLocaleString()}, using ${percentageUsed}% of your budget.`;

  return (
    <ScrollAnimatedSection className="py-12 px-6 space-y-8 border-t border-gray-200">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Budget Analysis
        </h2>
        <SectionNarrative text={narrative} highlight={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Monthly Budget vs Actual
          </h3>
          {spendingData.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex flex-col gap-6">
                <div className="flex justify-center gap-8 pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm text-gray-600">Under Budget</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm text-gray-600">Over Budget</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 justify-center">
                  {spendingData.map((row) => {
                    const diff = row.Budget - row.Actual;
                    const isUnderBudget = diff >= 0;
                    const maxDiff = Math.max(
                      ...spendingData.map((d) => Math.abs(d.Budget - d.Actual)),
                    );
                    const barHeight = (Math.abs(diff) / maxDiff) * 100;

                    return (
                      <div
                        key={row.month}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="h-40 w-12 bg-gray-100 rounded-lg overflow-hidden flex flex-col-reverse relative">
                          <div
                            className={`w-full transition-all duration-300 flex items-end justify-center pb-2 ${
                              isUnderBudget ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                            style={{ height: `${barHeight}%` }}
                          >
                            {barHeight > 20 && (
                              <span className="text-xs font-bold text-white text-center">
                                ${Math.abs(diff).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {row.month}
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            isUnderBudget ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {isUnderBudget ? '+' : '-'} $
                          {Math.abs(diff).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Budget Breakdown
          </h3>
          {budgetBreakdown.length > 0 ? (
            <DonutChart
              data={budgetBreakdown}
              dataKey="value"
              nameKey="name"
              height={300}
            />
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">No budget data available</p>
            </div>
          )}
        </div>
      </div>
    </ScrollAnimatedSection>
  );
};
