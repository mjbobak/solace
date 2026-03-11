/**
 * Spending Pulse Section
 * Shows monthly variance from budget with expandable detail table
 */

import React from 'react';

import { spendingData } from '@/features/home/services/mockDashboardData';
import { statusPalette } from '@/shared/theme';

import type { Period } from '../types/infographic';

import { ScrollAnimatedSection } from './ScrollAnimatedSection';
import { SectionNarrative } from './SectionNarrative';

interface SpendingPulseSectionProps {
  period: Period;
}

export const SpendingPulseSection: React.FC<SpendingPulseSectionProps> = () => {
  const narrative = `Track how your monthly spending compares to budget. Green indicates you stayed under budget, red means you spent more than planned.`;

  return (
    <ScrollAnimatedSection className="space-y-8 border-t section-divider px-6 py-12">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-app">Spending Pulse</h2>
        <SectionNarrative text={narrative} highlight={true} />
      </div>

      <div className="surface-card">
        {spendingData.length > 0 ? (
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
        ) : (
          <p className="py-12 text-center text-muted">No data available</p>
        )}
      </div>
    </ScrollAnimatedSection>
  );
};
