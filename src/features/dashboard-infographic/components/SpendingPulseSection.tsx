/**
 * Spending Pulse Section
 * Shows monthly variance from budget with expandable detail table
 */

import React from 'react';

import { spendingData } from '@/features/home/services/mockDashboardData';

import type { Period } from '../types/infographic';

import { ScrollAnimatedSection } from './ScrollAnimatedSection';
import { SectionNarrative } from './SectionNarrative';

interface SpendingPulseSectionProps {
  period: Period;
}

export const SpendingPulseSection: React.FC<SpendingPulseSectionProps> = () => {
  const narrative = `Track how your monthly spending compares to budget. Green indicates you stayed under budget, red means you spent more than planned.`;

  return (
    <ScrollAnimatedSection className="py-12 px-6 space-y-8 border-t border-gray-200">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Spending Pulse
        </h2>
        <SectionNarrative text={narrative} highlight={true} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {spendingData.length > 0 ? (
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
        ) : (
          <p className="text-gray-500 text-center py-12">No data available</p>
        )}
      </div>
    </ScrollAnimatedSection>
  );
};
