import React, { useEffect, useRef, useState } from 'react';

import { budgetSummaryTheme } from '@/shared/theme';

export type IncomeAllocationBucketId =
  | 'essential'
  | 'funsies'
  | 'investments'
  | 'wealth'
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
  valueDisplayPeriod?: 'monthly' | 'annual';
  chartAriaLabel?: string;
  totalBarAriaLabel?: string;
  showOverAllocatedWarning?: boolean;
  onStepSelect?: (bucketId: IncomeAllocationBucketId) => void;
  onTotalSelect?: () => void;
  totalActionLabel?: string;
}

const TOTAL_BAR_CLASS = budgetSummaryTheme.allocationBlue;
const TRACK_CLASS_NAME = 'border border-slate-200/80 bg-slate-100';
const VALUE_PILL_CLASS_NAME =
  'inline-flex items-baseline gap-1 whitespace-nowrap rounded-lg bg-white/95 px-2.5 py-1 shadow-md ring-1 ring-slate-200/80';
const INSIDE_LABEL_MIN_WIDTH_PERCENT = 8;
const OUTSIDE_LABEL_GAP_PX = 8;
const MONTHLY_LABEL_MIN_WIDTH_PX = 148;
const ANNUAL_LABEL_MIN_WIDTH_PX = 176;

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
    return '0%';
  }

  return `${Math.round((amount / totalIncome) * 100)}%`;
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

function getLabelPlacement({
  leftPercent,
  widthPercent,
  trackWidth,
  valueDisplayPeriod,
}: {
  leftPercent: number;
  widthPercent: number;
  trackWidth: number | null;
  valueDisplayPeriod: 'monthly' | 'annual';
}): 'inside' | 'outside-left' | 'outside-right' {
  if (trackWidth == null || trackWidth <= 0) {
    return widthPercent >= INSIDE_LABEL_MIN_WIDTH_PERCENT
      ? 'inside'
      : leftPercent + widthPercent > 82
        ? 'outside-left'
        : 'outside-right';
  }

  const minimumLabelWidth =
    valueDisplayPeriod === 'annual'
      ? ANNUAL_LABEL_MIN_WIDTH_PX
      : MONTHLY_LABEL_MIN_WIDTH_PX;
  const segmentWidth = (trackWidth * widthPercent) / 100;
  const leftSpace = (trackWidth * leftPercent) / 100;
  const rightSpace = trackWidth - leftSpace - segmentWidth;
  const outsideRoomRequired = minimumLabelWidth + OUTSIDE_LABEL_GAP_PX;

  if (segmentWidth >= minimumLabelWidth) {
    return 'inside';
  }

  if (leftSpace >= outsideRoomRequired) {
    return 'outside-left';
  }

  if (rightSpace >= outsideRoomRequired) {
    return 'outside-left';
  }

  return segmentWidth >= minimumLabelWidth * 0.8 ? 'inside' : 'outside-left';
}

function renderBarValueContent(
  amount: number,
  valueDisplayPeriod: 'monthly' | 'annual',
  placement: 'inside' | 'outside-left' | 'outside-right' = 'inside',
): React.ReactNode {
  const formattedAmount =
    valueDisplayPeriod === 'annual'
      ? formatAnnualAmount(amount)
      : formatWholeCurrency(amount);
  const periodLabel = valueDisplayPeriod === 'annual' ? 'ANNUAL' : 'MONTHLY';
  const isInside = placement === 'inside';
  const containerClassName = isInside
    ? 'pointer-events-none absolute inset-y-0.5 flex items-center px-3'
    : 'pointer-events-none absolute inset-y-1/2 z-10 flex -translate-y-1/2 items-center';
  const labelClassName = VALUE_PILL_CLASS_NAME;
  const amountClassName = 'text-[11px] font-semibold text-slate-900';
  const periodClassName = isInside
    ? 'text-[10px] font-semibold text-slate-600'
    : 'text-[10px] font-semibold text-slate-500';
  const placementStyle =
    placement === 'outside-right'
      ? { left: `calc(100% + ${OUTSIDE_LABEL_GAP_PX}px)` }
      : placement === 'outside-left'
        ? { right: `calc(100% + ${OUTSIDE_LABEL_GAP_PX}px)` }
        : undefined;

  return (
    <div
      className={containerClassName}
      style={placementStyle}
      data-label-placement={placement}
    >
      <span className={labelClassName}>
        <span className={amountClassName}>
          {formattedAmount}
        </span>
        <span className={periodClassName}>
          {periodLabel}
        </span>
      </span>
    </div>
  );
}

export const IncomeAllocationWaterfallChart: React.FC<
  IncomeAllocationWaterfallChartProps
> = ({
  steps,
  totalLabel,
  totalAmount,
  valueDisplayPeriod = 'monthly',
  chartAriaLabel = 'Income allocation waterfall chart',
  totalBarAriaLabel,
  showOverAllocatedWarning = false,
  onStepSelect,
  onTotalSelect,
  totalActionLabel,
}) => {
  const totalTrackRef = useRef<HTMLDivElement | null>(null);
  const [trackWidth, setTrackWidth] = useState<number | null>(null);
  const safeTotalAmount = sanitizeAmount(totalAmount);
  const positionedSteps = buildSteps(steps);
  const stackedAllocation = positionedSteps.reduce(
    (sum, step) => sum + step.amount,
    0,
  );
  const scaleMax = Math.max(safeTotalAmount, stackedAllocation, 1);
  const overAllocatedAmount = Math.max(stackedAllocation - safeTotalAmount, 0);

  useEffect(() => {
    const node = totalTrackRef.current;

    if (node == null) {
      return;
    }

    const updateTrackWidth = () => {
      const nextWidth = node.getBoundingClientRect().width;
      setTrackWidth((currentWidth) =>
        currentWidth === nextWidth ? currentWidth : nextWidth,
      );
    };

    updateTrackWidth();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateTrackWidth();
    });

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);

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
    <div className="space-y-3">
      <div className="space-y-2.5" role="group" aria-label={chartAriaLabel}>
        {positionedSteps.map((step) => {
          const leftPercent = (step.offset / scaleMax) * 100;
          const widthPercent = (step.amount / scaleMax) * 100;
          const labelPlacement = getLabelPlacement({
            leftPercent,
            widthPercent,
            trackWidth,
            valueDisplayPeriod,
          });
          const isInteractive =
            step.isInteractive === true &&
            step.bucketId != null &&
            step.amount > 0 &&
            onStepSelect != null;

          return (
            <div
              key={step.key}
              className="grid gap-2 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:items-center sm:gap-4"
            >
              <div className="sm:pr-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  {step.label}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {formatIncomePercent(step.amount, safeTotalAmount)}
                </p>
              </div>

              <div
                className={`relative h-10 overflow-hidden rounded-2xl ${TRACK_CLASS_NAME}`}
              >
                <div
                  aria-label={`${step.label} waterfall segment`}
                  className={`absolute inset-y-0.5 rounded-xl shadow-md ${step.fillClassName}`}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                >
                  {renderBarValueContent(
                    step.amount,
                    valueDisplayPeriod,
                    labelPlacement,
                  )}
                </div>
                {isInteractive ? (
                  <button
                    type="button"
                    className="absolute inset-y-0.5 rounded-xl transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 focus-visible:ring-inset"
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
            </div>
          );
        })}

        <div className="relative grid gap-2 pt-1 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:items-center sm:gap-4">
          <div className="sm:pr-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app">
              {totalLabel}
            </p>
            <p className="mt-1 text-xs text-muted">100%</p>
          </div>

          <div
            ref={totalTrackRef}
            className={`relative h-10 overflow-hidden rounded-2xl ${TRACK_CLASS_NAME}`}
          >
            <div
              aria-label={totalBarAriaLabel ?? `${totalLabel} waterfall segment`}
              className={`absolute inset-y-0.5 left-0 rounded-xl shadow-md ${TOTAL_BAR_CLASS}`}
              style={{
                width: `${(safeTotalAmount / scaleMax) * 100}%`,
              }}
            >
              {renderBarValueContent(safeTotalAmount, valueDisplayPeriod)}
            </div>
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
