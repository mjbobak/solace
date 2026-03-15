/**
 * Budget Analysis Section
 * Shows budget vs actual spending and budget breakdown
 */

import React from 'react';

import { mockBudgetData } from '@/features/budget/services/mockBudgetData';
import { spendingData } from '@/features/home/services/mockDashboardData';
import { DonutChart } from '@/shared/components/charts';
import { statusPalette } from '@/shared/theme';

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
    <ScrollAnimatedSection className="space-y-8 border-t section-divider px-6 py-12">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-app">Budget Analysis</h2>
        <SectionNarrative text={narrative} highlight={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="page-section-title">Monthly Budget vs Actual</h3>
          {spendingData.length > 0 ? (
            <div className="surface-card">
              <div className="flex flex-col gap-6">
                <div className="flex justify-center gap-8 border-b pb-6 section-divider">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: statusPalette.income }}
                    />
                    <span className="text-sm text-muted">Under Budget</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: statusPalette.spending }}
                    />
                    <span className="text-sm text-muted">Over Budget</span>
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
                        <div className="surface-subtle relative flex h-40 w-12 flex-col-reverse overflow-hidden rounded-lg">
                          <div
                            className="flex w-full items-end justify-center pb-2 transition-all duration-300"
                            style={{
                              height: `${barHeight}%`,
                              backgroundColor: isUnderBudget
                                ? statusPalette.income
                                : statusPalette.spending,
                            }}
                          >
                            {barHeight > 20 && (
                              <span className="text-center text-xs font-bold text-[color:var(--color-inverse)]">
                                ${Math.abs(diff).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-medium text-app">
                          {row.month}
                        </span>
                        <span
                          className="text-xs font-semibold"
                          style={{
                            color: isUnderBudget
                              ? statusPalette.income
                              : statusPalette.spending,
                          }}
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
            <div className="chart-empty-state h-80">
              <p className="text-muted">No data available</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="page-section-title">Budget Breakdown</h3>
          {budgetBreakdown.length > 0 ? (
            <DonutChart
              data={budgetBreakdown}
              dataKey="value"
              nameKey="name"
              height={300}
            />
          ) : (
            <div className="chart-empty-state h-80">
              <p className="text-muted">No budget data available</p>
            </div>
          )}
        </div>
      </div>
    </ScrollAnimatedSection>
  );
};
