import React from 'react';

import { budgetSummaryTheme } from '@/shared/theme';

import { compactCardContentHeight, formatWholeCurrency } from './constants';

interface BudgetUtilizationChartProps {
  spendBasisLabel: string;
  incomeSummary: string;
  budgetedSummary: string;
  spentSummary: string;
  usedPercent: number;
  remainingBudgetForChart: number;
  remainingTotal: number;
}

const GAUGE_RADIUS = 80;
const GAUGE_CENTER_X = 100;
const GAUGE_CENTER_Y = 100;
const GAUGE_STROKE = 18;

function gaugePoint(fraction: number): { x: number; y: number } {
  const angle = Math.PI * (1 - fraction);
  return {
    x: GAUGE_CENTER_X + GAUGE_RADIUS * Math.cos(angle),
    y: GAUGE_CENTER_Y - GAUGE_RADIUS * Math.sin(angle),
  };
}

function gaugeArc(fraction: number): string {
  const start = gaugePoint(0);
  const end = gaugePoint(Math.min(Math.max(fraction, 0), 1));
  return `M ${start.x} ${start.y} A ${GAUGE_RADIUS} ${GAUGE_RADIUS} 0 0 1 ${end.x} ${end.y}`;
}

export const BudgetUtilizationChart: React.FC<BudgetUtilizationChartProps> = ({
  spendBasisLabel,
  incomeSummary,
  budgetedSummary,
  spentSummary,
  usedPercent,
  remainingBudgetForChart,
  remainingTotal,
}) => {
  const isOverBudget = remainingTotal < 0;
  const spentFraction = Math.min(Math.max(usedPercent, 0) / 100, 1);
  const usedPercentLabel = `${usedPercent.toFixed(0)}%`;
  const remainingSummary = formatWholeCurrency(Math.abs(remainingBudgetForChart));
  const spentColor = isOverBudget
    ? 'var(--color-danger)'
    : 'var(--color-allocation-blue-strong)';

  const values = [
    { label: 'Income', value: incomeSummary },
    { label: 'Budgeted', value: budgetedSummary },
    { label: 'Spent', value: spentSummary },
    {
      label: isOverBudget ? 'Over budget' : 'Remaining',
      value: remainingSummary,
      danger: isOverBudget,
    },
  ];

  return (
    <div
      className={`flex flex-1 flex-col gap-4 pt-1 sm:flex-row sm:items-center ${compactCardContentHeight}`}
    >
      <div className="flex shrink-0 flex-col items-center sm:w-[46%]">
        <div className="relative w-full max-w-[240px]">
          <svg viewBox="0 0 200 116" className="w-full">
            <path
              d={gaugeArc(1)}
              fill="none"
              stroke="var(--color-allocation-blue)"
              strokeWidth={GAUGE_STROKE}
              strokeLinecap="round"
            >
              <title>{`Remaining · ${remainingSummary}`}</title>
            </path>
            {spentFraction > 0 ? (
              <path
                d={gaugeArc(spentFraction)}
                fill="none"
                stroke={spentColor}
                strokeWidth={GAUGE_STROKE}
                strokeLinecap="round"
              >
                <title>{`Spent · ${spentSummary}`}</title>
              </path>
            ) : null}
          </svg>
          <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
            <span
              className={`text-3xl font-bold ${
                isOverBudget
                  ? budgetSummaryTheme.summaryDanger
                  : budgetSummaryTheme.summaryValue
              }`}
            >
              {usedPercentLabel}
            </span>
            <span
              className={`text-[11px] uppercase tracking-[0.14em] ${budgetSummaryTheme.summaryTextMuted}`}
            >
              of budget used
            </span>
          </div>
        </div>
        <span
          className={`mt-1 text-[11px] uppercase tracking-[0.12em] ${budgetSummaryTheme.summaryTextMuted}`}
        >
          {spendBasisLabel}
        </span>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3">
        {values.map(({ label, value, danger }) => (
          <div key={label}>
            <p
              className={`text-[11px] uppercase tracking-[0.12em] ${budgetSummaryTheme.summaryTextMuted}`}
            >
              {label}
            </p>
            <p
              className={`text-lg font-bold ${
                danger
                  ? budgetSummaryTheme.summaryDanger
                  : budgetSummaryTheme.summaryValue
              }`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
