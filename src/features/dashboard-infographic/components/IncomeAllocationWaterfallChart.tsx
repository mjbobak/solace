import React from 'react';

import { budgetSummaryTheme } from '@/shared/theme';

interface IncomeAllocationWaterfallChartProps {
  totalIncome: number;
  essentialAmount: number;
  funsiesAmount: number;
  investmentAmount: number;
  savingsAmount: number;
}

interface WaterfallStep {
  key: string;
  label: string;
  amount: number;
  offset: number;
  fillClassName: string;
}

const TOTAL_BAR_CLASS = 'bg-[#cddafd]';
const INVESTMENT_BAR_CLASS = 'bg-[#edafb8]';

function sanitizeAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return amount;
}

function formatAnnualAmount(amount: number): string {
  return formatWholeCurrency(amount * 12);
}

function formatWholeCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatIncomePercent(amount: number, totalIncome: number): string {
  if (totalIncome <= 0) {
    return '0.0%';
  }

  return `${((amount / totalIncome) * 100).toFixed(1)}%`;
}

function buildSteps({
  essentialAmount,
  funsiesAmount,
  investmentAmount,
  savingsAmount,
}: Omit<IncomeAllocationWaterfallChartProps, 'totalIncome'>): WaterfallStep[] {
  let runningOffset = 0;

  return [
    {
      key: 'essential',
      label: 'Essential',
      amount: sanitizeAmount(essentialAmount),
      fillClassName: budgetSummaryTheme.allocationBlue,
    },
    {
      key: 'funsies',
      label: 'Funsies',
      amount: sanitizeAmount(funsiesAmount),
      fillClassName: budgetSummaryTheme.allocationPurple,
    },
    {
      key: 'investment',
      label: 'Investments',
      amount: sanitizeAmount(investmentAmount),
      fillClassName: INVESTMENT_BAR_CLASS,
    },
    {
      key: 'savings',
      label: 'Savings',
      amount: sanitizeAmount(savingsAmount),
      fillClassName: budgetSummaryTheme.allocationGreen,
    },
  ].map((step) => {
    const nextStep = {
      ...step,
      offset: runningOffset,
    };

    runningOffset += step.amount;
    return nextStep;
  });
}

export const IncomeAllocationWaterfallChart: React.FC<
  IncomeAllocationWaterfallChartProps
> = ({
  totalIncome,
  essentialAmount,
  funsiesAmount,
  investmentAmount,
  savingsAmount,
}) => {
  const safeTotalIncome = sanitizeAmount(totalIncome);
  const steps = buildSteps({
    essentialAmount,
    funsiesAmount,
    investmentAmount,
    savingsAmount,
  });
  const stackedAllocation = steps.reduce((sum, step) => sum + step.amount, 0);
  const scaleMax = Math.max(safeTotalIncome, stackedAllocation, 1);
  const overAllocatedAmount = Math.max(stackedAllocation - safeTotalIncome, 0);

  if (safeTotalIncome === 0 && stackedAllocation === 0) {
    return (
      <div className="chart-empty-state h-64">
        <p className="text-sm text-muted">
          Add income and budget data to render the allocation waterfall.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="space-y-3"
        role="img"
        aria-label="Income allocation waterfall chart"
      >
        {steps.map((step) => {
          const leftPercent = (step.offset / scaleMax) * 100;
          const widthPercent = (step.amount / scaleMax) * 100;

          return (
            <div
              key={step.key}
              className="grid gap-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_minmax(0,7rem)] sm:items-center sm:gap-4"
            >
              <div className="flex items-baseline justify-between gap-3 sm:block">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  {step.label}
                </p>
                <p className="text-xs text-muted sm:mt-1">
                  {formatWholeCurrency(step.amount)} / mo
                </p>
              </div>

              <div className="relative h-12 overflow-hidden rounded-2xl border border-white/70 bg-slate-100/90">
                <div
                  aria-label={`${step.label} waterfall segment`}
                  className={`absolute inset-y-1 rounded-xl shadow-sm ${step.fillClassName}`}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                />
              </div>

              <div className="flex items-baseline justify-between gap-3 sm:block sm:text-right">
                <p className="text-sm font-semibold text-app">
                  {formatAnnualAmount(step.amount)}
                </p>
                <p className="text-xs text-muted sm:mt-1">
                  {formatIncomePercent(step.amount, safeTotalIncome)}
                </p>
              </div>
            </div>
          );
        })}

        <div className="grid gap-3 pt-2 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_minmax(0,7rem)] sm:items-center sm:gap-4">
          <div className="flex items-baseline justify-between gap-3 sm:block">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app">
              Total Income
            </p>
            <p className="text-xs text-muted sm:mt-1">
              {formatWholeCurrency(safeTotalIncome)} / mo
            </p>
          </div>

          <div className="relative h-12 overflow-hidden rounded-2xl border border-white/70 bg-slate-100/90">
            <div
              aria-label="Total income waterfall segment"
              className={`absolute inset-y-1 left-0 rounded-xl shadow-sm ${TOTAL_BAR_CLASS}`}
              style={{
                width: `${(safeTotalIncome / scaleMax) * 100}%`,
              }}
            />
          </div>

          <div className="flex items-baseline justify-between gap-3 sm:block sm:text-right">
            <p className="text-sm font-semibold text-app">
              {formatAnnualAmount(safeTotalIncome)}
            </p>
            <p className="text-xs text-muted sm:mt-1">100.0%</p>
          </div>
        </div>
      </div>

      {overAllocatedAmount > 0 ? (
        <p className="text-xs text-danger">
          {`Planned allocation exceeds income by ${formatAnnualAmount(
            overAllocatedAmount,
          )} annually.`}
        </p>
      ) : null}
    </div>
  );
};
