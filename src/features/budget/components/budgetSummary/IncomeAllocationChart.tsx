import React from 'react';

import { Tooltip } from '@/shared/components/Tooltip';

import {
  compactCardContentHeight,
  getBarTooltipContent,
  paletteBlue,
  paletteGreen,
  palettePurple,
} from './constants';

interface IncomeAllocationChartProps {
  annualIncomeSummary: string;
  annualEssentialSummary: string;
  annualFunsiesSummary: string;
  annualWealthSummary: string;
  essentialWidth: number;
  funsiesWidth: number;
  savingsWidth: number;
  essentialBudget: number;
  funsiesBudget: number;
  savingsForAllocation: number;
  essentialIncomePercent: number;
  funsiesIncomePercent: number;
  savingsIncomePercent: number;
}

export const IncomeAllocationChart: React.FC<IncomeAllocationChartProps> = ({
  annualIncomeSummary,
  annualEssentialSummary,
  annualFunsiesSummary,
  annualWealthSummary,
  essentialWidth,
  funsiesWidth,
  savingsWidth,
  essentialBudget,
  funsiesBudget,
  savingsForAllocation,
  essentialIncomePercent,
  funsiesIncomePercent,
  savingsIncomePercent,
}) => (
  <div
    className={`mb-1 flex flex-1 flex-col justify-end pt-2 ${compactCardContentHeight}`}
  >
    <div className="space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
        <span>
          {annualIncomeSummary} income / {annualEssentialSummary} essential /{' '}
          {annualFunsiesSummary} funsies / {annualWealthSummary} wealth
        </span>
      </div>
    </div>
    <div className="mt-4 space-y-3">
      <div className="relative h-8 overflow-hidden rounded-full bg-slate-100">
        <div className="absolute inset-y-0 left-0 w-full rounded-full bg-slate-200" />
        <div
          className={`absolute inset-y-0 left-0 ${paletteBlue}`}
          style={{ width: `${essentialWidth}%` }}
        />
        <div
          className={`absolute inset-y-0 ${palettePurple}`}
          style={{ left: `${essentialWidth}%`, width: `${funsiesWidth}%` }}
        />
        <div
          className={`absolute inset-y-0 ${paletteGreen}`}
          style={{
            left: `${essentialWidth + funsiesWidth}%`,
            width: `${savingsWidth}%`,
          }}
        />
        {essentialWidth > 0 ? (
          <Tooltip
            content={getBarTooltipContent(
              'Essential',
              essentialBudget,
              essentialIncomePercent,
            )}
            stacked
            followCursor
          >
            <div
              className="absolute inset-y-0 left-0 cursor-pointer"
              style={{ width: `${essentialWidth}%` }}
              aria-label="Essential portion"
            />
          </Tooltip>
        ) : null}
        {funsiesWidth > 0 ? (
          <Tooltip
            content={getBarTooltipContent(
              'Funsies',
              funsiesBudget,
              funsiesIncomePercent,
            )}
            stacked
            followCursor
          >
            <div
              className="absolute inset-y-0 cursor-pointer"
              style={{ left: `${essentialWidth}%`, width: `${funsiesWidth}%` }}
              aria-label="Funsies portion"
            />
          </Tooltip>
        ) : null}
        {savingsWidth > 0 ? (
          <Tooltip
            content={getBarTooltipContent(
              'Wealth',
              savingsForAllocation,
              savingsIncomePercent,
            )}
            stacked
            followCursor
          >
            <div
              className="absolute inset-y-0 cursor-pointer"
              style={{
                left: `${essentialWidth + funsiesWidth}%`,
                width: `${savingsWidth}%`,
              }}
              aria-label="Savings portion"
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
          <span>Essential</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${palettePurple}`} />
          <span>Funsies</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${paletteGreen}`} />
          <span>Wealth</span>
        </div>
      </div>
    </div>
  </div>
);
