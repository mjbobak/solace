import React from 'react';

import { Tooltip } from '@/shared/components/Tooltip';

import {
  amountPillClassName,
  compactCardContentHeight,
  formatWholeCurrency,
  getBarTooltipContent,
  paletteBlue,
  paletteBlueStrong,
  pillLabelTextClass,
  pillValueTextClass,
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
  spentForChart,
  remainingBudgetForChart,
  remainingTotal,
  amountContextLabel,
}) => {
  const remainingWidth = Math.max(100 - spentWidth, 0);
  const remainingSummary = formatWholeCurrency(remainingBudgetForChart);
  const isOverBudget = remainingTotal < 0;
  const overBudgetSummary = formatWholeCurrency(Math.abs(remainingTotal));
  const spentFillWidth =
    spentWidth > 0 ? `max(0px, calc(${spentWidth}% - 4px))` : '0%';
  const remainingOverlay = isOverBudget ? (
    <span className="truncate text-[13px] font-semibold uppercase tracking-[0.14em] text-red-600">
      {`${overBudgetSummary} over`}
    </span>
  ) : (
    <span className={`${amountPillClassName} flex min-w-0 max-w-full truncate`}>
      <span
        className={`truncate text-[13px] font-semibold tracking-[0.02em] ${pillValueTextClass}`}
      >
        {remainingSummary}
      </span>
      <span
        className={`truncate text-xs font-medium uppercase tracking-[0.12em] ${pillLabelTextClass}`}
      >
        Remaining
      </span>
    </span>
  );

  return (
    <div
      className={`flex flex-1 flex-col justify-start pt-0 ${compactCardContentHeight}`}
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
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

      <div className="mt-2">
        <div className="relative h-10 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100">
          <div className={`absolute inset-0 overflow-hidden rounded-2xl ${paletteBlue}`} />
          <div
            className={`absolute inset-y-0.5 left-0.5 overflow-hidden rounded-xl shadow-md ${paletteBlueStrong}`}
            style={{ width: spentFillWidth }}
          >
            <div className="pointer-events-none flex h-full items-center pl-3">
              <span
                className={`${amountPillClassName} flex min-w-0 max-w-full truncate`}
              >
                <span
                  className={`truncate text-[13px] font-semibold tracking-[0.02em] ${pillValueTextClass}`}
                >
                  {spentSummary}
                </span>
                <span
                  className={`truncate text-xs font-medium uppercase tracking-[0.12em] ${pillLabelTextClass}`}
                >
                  Spent
                </span>
              </span>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-end pr-3">
            {remainingOverlay}
          </div>

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
                className="absolute inset-y-0.5 left-0 cursor-pointer rounded-xl"
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
                className="absolute inset-y-0.5 cursor-pointer rounded-xl"
                style={{ left: `${spentWidth}%`, width: `${remainingWidth}%` }}
                aria-label="Remaining budget portion"
              />
            </Tooltip>
          ) : null}
        </div>
      </div>
    </div>
  );
};
