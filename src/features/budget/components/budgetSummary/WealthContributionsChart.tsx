import React from 'react';

import { Tooltip } from '@/shared/components/Tooltip';

import {
  getBarTooltipContent,
  paletteGreen,
  palettePurple,
} from './constants';

interface WealthContributionsChartProps {
  annualIncomeSummary: string;
  annualSavingsSummary: string;
  annualInvestmentsSummary: string;
  wealthIncomePercent: number;
  savingsWealthWidth: number;
  investmentWealthWidth: number;
  plannedSavings: number;
  investments: number;
  savingsIncomePercent: number;
  investmentIncomePercent: number;
}

export const WealthContributionsChart: React.FC<
  WealthContributionsChartProps
> = ({
  annualIncomeSummary,
  annualSavingsSummary,
  annualInvestmentsSummary,
  wealthIncomePercent,
  savingsWealthWidth,
  investmentWealthWidth,
  plannedSavings,
  investments,
  savingsIncomePercent,
  investmentIncomePercent,
}) => (
  <div className="mb-1 flex flex-1 flex-col justify-end pt-2">
    <div className="space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
        <span>
          <span className="text-gray-600">{annualIncomeSummary}</span> income /{' '}
          <span className="text-gray-600">{annualSavingsSummary}</span> savings /{' '}
          <span className="text-gray-600">{annualInvestmentsSummary}</span>{' '}
          investments
        </span>
        <span>
          <span className="text-gray-600">
            {wealthIncomePercent.toFixed(0)}%
          </span>{' '}
          to wealth
        </span>
      </div>
    </div>

    <div className="mt-4 space-y-3">
      <div className="relative h-8 overflow-hidden rounded-full bg-slate-100">
        <div className="absolute inset-y-0 left-0 w-full rounded-full bg-slate-200" />
        <div
          className={`absolute inset-y-0 left-0 ${paletteGreen}`}
          style={{ width: `${savingsWealthWidth}%` }}
        />
        <div
          className={`absolute inset-y-0 ${palettePurple}`}
          style={{
            left: `${savingsWealthWidth}%`,
            width: `${investmentWealthWidth}%`,
          }}
        />

        {savingsWealthWidth > 0 ? (
          <Tooltip
            content={getBarTooltipContent(
              'Savings',
              plannedSavings,
              savingsIncomePercent,
            )}
            stacked
            followCursor
          >
            <div
              className="absolute inset-y-0 left-0 cursor-pointer"
              style={{ width: `${savingsWealthWidth}%` }}
              aria-label="Savings portion"
            />
          </Tooltip>
        ) : null}

        {investmentWealthWidth > 0 ? (
          <Tooltip
            content={getBarTooltipContent(
              'Budgeted investments',
              investments,
              investmentIncomePercent,
            )}
            stacked
            followCursor
          >
            <div
              className="absolute inset-y-0 cursor-pointer"
              style={{
                left: `${savingsWealthWidth}%`,
                width: `${investmentWealthWidth}%`,
              }}
              aria-label="Budgeted investments portion"
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
          <span className={`h-2.5 w-2.5 rounded-full ${paletteGreen}`} />
          <span>Savings</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${palettePurple}`} />
          <span>Budgeted Investments</span>
        </div>
      </div>
    </div>
  </div>
);
