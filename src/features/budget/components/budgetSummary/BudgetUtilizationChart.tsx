import React from 'react';

import { Tooltip } from '@/shared/components/Tooltip';

import {
  compactCardContentHeight,
  getBarTooltipContent,
  paletteBlue,
  paletteGreen,
} from './constants';

interface BudgetUtilizationChartProps {
  annualIncomeSummary: string;
  annualBudgetedSummary: string;
  annualSpentSummary: string;
  usedPercent: number;
  budgetedIncomePercent: number;
  spentIncomePercent: number;
  spentWidth: number;
  remainingBudgetWidth: number;
  unbudgetedIncomeWidth: number;
  spentForChart: number;
  remainingBudgetForChart: number;
  unbudgetedIncomeForChart: number;
}

export const BudgetUtilizationChart: React.FC<BudgetUtilizationChartProps> = ({
  annualIncomeSummary,
  annualBudgetedSummary,
  annualSpentSummary,
  usedPercent,
  budgetedIncomePercent,
  spentIncomePercent,
  spentWidth,
  remainingBudgetWidth,
  unbudgetedIncomeWidth,
  spentForChart,
  remainingBudgetForChart,
  unbudgetedIncomeForChart,
}) => (
  <div
    className={`mb-1 flex flex-1 flex-col justify-end pt-2 ${compactCardContentHeight}`}
  >
    <div className="space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
        <span>
          <span className="text-gray-600">{annualIncomeSummary}</span> income /{' '}
          <span className="text-gray-600">{annualBudgetedSummary}</span> budget /{' '}
          <span className="text-gray-600">{annualSpentSummary}</span> spent
        </span>
        <span>
          <span className="text-gray-600">{usedPercent.toFixed(0)}%</span> used
        </span>
      </div>
    </div>

    <div className="mt-4 space-y-3">
      <div className="relative h-8 overflow-hidden rounded-full bg-slate-100">
        <div className="absolute inset-y-0 left-0 w-full rounded-full bg-slate-200" />
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${paletteBlue}`}
          style={{ width: `${Math.min(budgetedIncomePercent, 100)}%` }}
        />
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${paletteGreen}`}
          style={{ width: `${Math.min(spentIncomePercent, 100)}%` }}
        />

        {spentWidth > 0 ? (
          <Tooltip
            content={getBarTooltipContent('Spent', spentForChart, spentIncomePercent)}
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

        {remainingBudgetWidth > 0 ? (
          <Tooltip
            content={getBarTooltipContent(
              'Budgeted but not spent',
              remainingBudgetForChart,
              budgetedIncomePercent - spentIncomePercent,
            )}
            stacked
            followCursor
          >
            <div
              className="absolute inset-y-0 cursor-pointer"
              style={{ left: `${spentWidth}%`, width: `${remainingBudgetWidth}%` }}
              aria-label="Remaining budget portion"
            />
          </Tooltip>
        ) : null}

        {unbudgetedIncomeWidth > 0 ? (
          <Tooltip
            content={getBarTooltipContent(
              'Income not budgeted',
              unbudgetedIncomeForChart,
              100 - budgetedIncomePercent,
            )}
            stacked
            followCursor
          >
            <div
              className="absolute inset-y-0 cursor-pointer rounded-full"
              style={{
                left: `${Math.min(budgetedIncomePercent, 100)}%`,
                width: `${unbudgetedIncomeWidth}%`,
              }}
              aria-label="Unbudgeted income portion"
            />
          </Tooltip>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
          <span>Income</span>
        </div>
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
