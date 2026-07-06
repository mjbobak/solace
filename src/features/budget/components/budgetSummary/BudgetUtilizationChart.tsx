import React from 'react';

import { budgetSummaryTheme } from '@/shared/theme';

import {
  compactCardContentHeight,
  formatWholeCurrency,
  paletteBlue,
  paletteBlueStrong,
} from './constants';

interface BudgetUtilizationChartProps {
  spendBasisLabel: string;
  incomeSummary: string;
  budgetedSummary: string;
  spentSummary: string;
  usedPercent: number;
  spentWidth: number;
  spentForChart: number;
  remainingBudgetForChart: number;
  remainingTotal: number;
  amountContextLabel: string;
}

export const BudgetUtilizationChart: React.FC<BudgetUtilizationChartProps> = ({
  spendBasisLabel,
  incomeSummary,
  budgetedSummary,
  spentSummary,
  usedPercent,
  spentWidth,
  remainingBudgetForChart,
  remainingTotal,
}) => {
  const remainingWidth = Math.max(100 - spentWidth, 0);
  const remainingSummary = formatWholeCurrency(remainingBudgetForChart);
  const isOverBudget = remainingTotal < 0;
  const overBudgetSummary = formatWholeCurrency(Math.abs(remainingTotal));
  const usedPercentLabel = `${usedPercent.toFixed(0)}%`;
  const remainingPercentLabel = `${Math.max(100 - usedPercent, 0).toFixed(0)}%`;

  return (
    <div
      className={`flex flex-1 flex-col justify-start pt-0 ${compactCardContentHeight}`}
    >
      <div
        className={`flex min-h-[2.5rem] flex-wrap items-center justify-between gap-2 text-xs font-medium uppercase tracking-[0.14em] ${budgetSummaryTheme.summaryTextMuted}`}
      >
        <span>
          <span>{spendBasisLabel}:</span>{' '}
          <span className={budgetSummaryTheme.summaryText}>{incomeSummary}</span>{' '}
          income /{' '}
          <span className={budgetSummaryTheme.summaryText}>
            {budgetedSummary}
          </span>{' '}
          budget /{' '}
          <span className={budgetSummaryTheme.summaryText}>{spentSummary}</span>{' '}
          spent
        </span>
        <span>
          <span className={budgetSummaryTheme.summaryText}>
            {usedPercentLabel}
          </span>{' '}
          used
        </span>
      </div>

      <div className="mt-2">
        <div
          className={`flex h-14 w-full overflow-hidden rounded-md ${budgetSummaryTheme.waterfallTrack}`}
        >
          {spentWidth > 0 ? (
            <div
              className={`flex h-full flex-col justify-center overflow-hidden px-3 ${paletteBlueStrong}`}
              style={{ width: `${spentWidth}%` }}
              title="Spent"
            >
              <span className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-app">
                Spent
              </span>
              <span className="truncate text-xs text-gray-800">
                {`${spentSummary} · ${usedPercentLabel}`}
              </span>
            </div>
          ) : null}
          {remainingWidth > 0 && !isOverBudget ? (
            <div
              className={`flex h-full flex-col justify-center overflow-hidden px-3 ${paletteBlue}`}
              style={{ width: `${remainingWidth}%` }}
              title="Remaining"
            >
              <span className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-app">
                Remaining
              </span>
              <span className="truncate text-xs text-gray-800">
                {`${remainingSummary} · ${remainingPercentLabel}`}
              </span>
            </div>
          ) : null}
        </div>

        {isOverBudget ? (
          <p className={`mt-2 text-xs ${budgetSummaryTheme.summaryDanger}`}>
            {`${overBudgetSummary} over budget`}
          </p>
        ) : null}
      </div>
    </div>
  );
};
