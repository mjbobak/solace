import React from 'react';

import { Tooltip } from '@/shared/components/Tooltip';

import {
  compactCardContentHeight,
  getBarTooltipContent,
  paletteBlue,
  paletteGreen,
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
  amountContextLabel: string;
}

export const BudgetUtilizationChart: React.FC<BudgetUtilizationChartProps> = ({
  spendBasisLabel,
  incomeSummary,
  budgetedSummary,
  spentSummary,
  usedPercent,
  spentWidth,
  spentForChart,
  remainingBudgetForChart,
  amountContextLabel,
}) => (
  <div
    className={`mb-1 flex flex-1 flex-col justify-end pt-2 ${compactCardContentHeight}`}
  >
    <div className="space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
        <span>
          <span className="text-gray-500">{spendBasisLabel}:</span>{' '}
          <span className="text-gray-600">{incomeSummary}</span> income /{' '}
          <span className="text-gray-600">{budgetedSummary}</span> budget /{' '}
          <span className="text-gray-600">{spentSummary}</span> spent
        </span>
        <span>
          <span className="text-gray-600">{usedPercent.toFixed(0)}%</span> used
        </span>
      </div>
    </div>

    <div className="mt-4 space-y-3">
      <div className="relative h-8 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`absolute inset-0 rounded-full ${paletteBlue}`}
          aria-label="Budgeted portion"
        />
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${paletteGreen}`}
          style={{ width: `${spentWidth}%` }}
        />

        {spentWidth > 0 ? (
          <Tooltip
            content={getBarTooltipContent(
              'Spent',
              spentForChart,
              amountContextLabel,
              usedPercent,
            )}
            stacked
            followCursor
          >
            <div
              className="absolute inset-y-0 left-0 cursor-pointer rounded-full"
              style={{ width: `${spentWidth}%` }}
              aria-label="Spent portion"
            />
          </Tooltip>
        ) : null}

        {remainingBudgetForChart > 0 ? (
          <Tooltip
            content={getBarTooltipContent(
              'Budgeted but not spent',
              remainingBudgetForChart,
              amountContextLabel,
              Math.max(100 - usedPercent, 0),
            )}
            stacked
            followCursor
          >
            <div
              className="absolute inset-y-0 cursor-pointer"
              style={{ left: `${spentWidth}%`, width: `${Math.max(100 - spentWidth, 0)}%` }}
              aria-label="Remaining budget portion"
            />
          </Tooltip>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${paletteBlue}`} />
          <span>Budgeted</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${paletteGreen}`} />
          <span>Spent</span>
        </div>
      </div>
    </div>
  </div>
);
