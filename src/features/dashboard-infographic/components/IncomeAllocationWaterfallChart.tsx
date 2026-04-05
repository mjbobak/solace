import React from 'react';

export type IncomeAllocationBucketId =
  | 'essential'
  | 'funsies'
  | 'investments'
  | 'savings';

export interface IncomeAllocationWaterfallStep {
  key: string;
  label: string;
  amount: number;
  fillClassName: string;
  bucketId?: IncomeAllocationBucketId;
  isInteractive?: boolean;
  actionLabel?: string;
}

interface PositionedWaterfallStep extends IncomeAllocationWaterfallStep {
  amount: number;
  offset: number;
}

interface IncomeAllocationWaterfallChartProps {
  steps: IncomeAllocationWaterfallStep[];
  totalLabel: string;
  totalAmount: number;
  chartAriaLabel?: string;
  totalBarAriaLabel?: string;
  showOverAllocatedWarning?: boolean;
  onStepSelect?: (bucketId: IncomeAllocationBucketId) => void;
  onTotalSelect?: () => void;
  totalActionLabel?: string;
}

const TOTAL_BAR_CLASS = 'bg-[#cddafd]';

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

function buildSteps(
  steps: IncomeAllocationWaterfallStep[],
): PositionedWaterfallStep[] {
  let runningOffset = 0;

  return steps.map((step) => {
    const sanitizedAmount = sanitizeAmount(step.amount);
    const nextStep = {
      ...step,
      amount: sanitizedAmount,
      offset: runningOffset,
    };

    runningOffset += sanitizedAmount;
    return nextStep;
  });
}

export const IncomeAllocationWaterfallChart: React.FC<
  IncomeAllocationWaterfallChartProps
> = ({
  steps,
  totalLabel,
  totalAmount,
  chartAriaLabel = 'Income allocation waterfall chart',
  totalBarAriaLabel,
  showOverAllocatedWarning = false,
  onStepSelect,
  onTotalSelect,
  totalActionLabel,
}) => {
  const safeTotalAmount = sanitizeAmount(totalAmount);
  const positionedSteps = buildSteps(steps);
  const stackedAllocation = positionedSteps.reduce(
    (sum, step) => sum + step.amount,
    0,
  );
  const scaleMax = Math.max(safeTotalAmount, stackedAllocation, 1);
  const overAllocatedAmount = Math.max(stackedAllocation - safeTotalAmount, 0);

  if (safeTotalAmount === 0 && stackedAllocation === 0) {
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
      <div className="space-y-3" role="group" aria-label={chartAriaLabel}>
        {positionedSteps.map((step) => {
          const leftPercent = (step.offset / scaleMax) * 100;
          const widthPercent = (step.amount / scaleMax) * 100;
          const isInteractive =
            step.isInteractive === true &&
            step.bucketId != null &&
            step.amount > 0 &&
            onStepSelect != null;

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
                {isInteractive ? (
                  <button
                    type="button"
                    className="absolute inset-y-1 rounded-xl transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 focus-visible:ring-inset"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                    aria-label={
                      step.actionLabel ??
                      `Show ${step.label} category breakdown`
                    }
                    onClick={() => onStepSelect(step.bucketId!)}
                  />
                ) : null}
              </div>

              <div className="flex items-baseline justify-between gap-3 sm:block sm:text-right">
                <p className="text-sm font-semibold text-app">
                  {formatAnnualAmount(step.amount)}
                </p>
                <p className="text-xs text-muted sm:mt-1">
                  {formatIncomePercent(step.amount, safeTotalAmount)}
                </p>
              </div>
            </div>
          );
        })}

        <div className="relative grid gap-3 pt-2 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_minmax(0,7rem)] sm:items-center sm:gap-4">
          <div className="flex items-baseline justify-between gap-3 sm:block">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app">
              {totalLabel}
            </p>
            <p className="text-xs text-muted sm:mt-1">
              {formatWholeCurrency(safeTotalAmount)} / mo
            </p>
          </div>

          <div className="relative h-12 overflow-hidden rounded-2xl border border-white/70 bg-slate-100/90">
            <div
              aria-label={totalBarAriaLabel ?? `${totalLabel} waterfall segment`}
              className={`absolute inset-y-1 left-0 rounded-xl shadow-sm ${TOTAL_BAR_CLASS}`}
              style={{
                width: `${(safeTotalAmount / scaleMax) * 100}%`,
              }}
            />
          </div>

          <div className="flex items-baseline justify-between gap-3 sm:block sm:text-right">
            <p className="text-sm font-semibold text-app">
              {formatAnnualAmount(safeTotalAmount)}
            </p>
            <p className="text-xs text-muted sm:mt-1">100.0%</p>
          </div>

          {onTotalSelect != null ? (
            <button
              type="button"
              className="absolute inset-0 rounded-2xl transition hover:bg-slate-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 focus-visible:ring-inset"
              aria-label={totalActionLabel ?? totalLabel}
              onClick={onTotalSelect}
            />
          ) : null}
        </div>
      </div>

      {showOverAllocatedWarning && overAllocatedAmount > 0 ? (
        <p className="text-xs text-danger">
          {`Planned allocation exceeds income by ${formatAnnualAmount(
            overAllocatedAmount,
          )} annually.`}
        </p>
      ) : null}
    </div>
  );
};
