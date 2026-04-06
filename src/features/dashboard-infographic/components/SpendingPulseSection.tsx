/**
 * Spending Pulse Section
 * Shows monthly variance from budget with expandable detail table
 */

import React, { useEffect, useMemo, useState } from 'react';

import { Tooltip } from '@/shared/components/Tooltip';

import {
  useSpendingPulseData,
  type SpendingPulseLabelDetail,
  type SpendingPulseRow,
} from '../hooks/useSpendingPulseData';

import { ScrollAnimatedSection } from './ScrollAnimatedSection';
import { SectionNarrative } from './SectionNarrative';

interface SpendingPulseSectionProps {
  year: number;
}

const SPENDING_PULSE_COLORS = {
  underBudgetFill:
    'color-mix(in srgb, var(--color-success) 45%, white 55%)',
  underBudgetText:
    'color-mix(in srgb, var(--color-success) 76%, black 24%)',
  overBudgetFill:
    'color-mix(in srgb, var(--color-danger) 38%, white 62%)',
  overBudgetText:
    'color-mix(in srgb, var(--color-danger) 72%, black 28%)',
  inactiveFill:
    'color-mix(in srgb, var(--color-text-muted) 18%, white 82%)',
  inactiveText: 'var(--color-text-muted)',
  inactiveBorder:
    'color-mix(in srgb, var(--color-border) 72%, white 28%)',
  selectedBorder:
    'color-mix(in srgb, var(--color-brand) 45%, white 55%)',
  selectedShadow:
    '0 12px 30px -20px color-mix(in srgb, var(--color-brand) 42%, transparent)',
  drilldownBar:
    'linear-gradient(90deg, color-mix(in srgb, var(--color-danger) 42%, white 58%), color-mix(in srgb, var(--color-danger) 56%, white 44%))',
} as const;

function getAbsoluteVariance(amount: number): number {
  return Math.abs(amount);
}

function getBudgetUtilizationHeight(params: {
  actual: number;
  budget: number;
  isRelevant: boolean;
}): number {
  const { actual, budget, isRelevant } = params;

  if (!isRelevant) {
    return 18;
  }

  if (budget <= 0) {
    return actual > 0 ? 100 : 0;
  }

  return Math.min((actual / budget) * 100, 100);
}

function formatWholeCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

function formatWholeNumber(amount: number): string {
  return Math.round(amount).toLocaleString('en-US');
}

function getMaxVariance(rows: SpendingPulseLabelDetail[] | { variance: number }[]): number {
  return Math.max(...rows.map((row) => getAbsoluteVariance(row.variance)), 1);
}

function getMonthBarFillColor(
  row: Pick<SpendingPulseRow, 'isRelevant' | 'variance'>,
): string {
  if (!row.isRelevant) {
    return SPENDING_PULSE_COLORS.inactiveFill;
  }

  return row.variance >= 0
    ? SPENDING_PULSE_COLORS.underBudgetFill
    : SPENDING_PULSE_COLORS.overBudgetFill;
}

function getMonthBarTextColor(
  row: Pick<SpendingPulseRow, 'isRelevant' | 'variance'>,
): string {
  if (!row.isRelevant) {
    return SPENDING_PULSE_COLORS.inactiveText;
  }

  return row.variance >= 0
    ? SPENDING_PULSE_COLORS.underBudgetText
    : SPENDING_PULSE_COLORS.overBudgetText;
}

function getMonthButtonClassName(
  row: Pick<SpendingPulseRow, 'isRelevant'>,
  isSelected: boolean,
): string {
  if (!row.isRelevant) {
    return 'surface-subtle relative flex h-40 w-14 flex-col-reverse overflow-hidden rounded-lg border border-transparent opacity-80 transition-all duration-200 cursor-default';
  }

  if (isSelected) {
    return 'surface-subtle relative flex h-40 w-14 flex-col-reverse overflow-hidden rounded-lg border transition-all duration-200';
  }

  return 'surface-subtle relative flex h-40 w-14 flex-col-reverse overflow-hidden rounded-lg border border-transparent transition-all duration-200 hover:border-black/10 hover:-translate-y-1';
}

function getMonthButtonStyle(
  row: Pick<SpendingPulseRow, 'isRelevant'>,
  isSelected: boolean,
): React.CSSProperties | undefined {
  if (!row.isRelevant) {
    return {
      borderColor: SPENDING_PULSE_COLORS.inactiveBorder,
    };
  }

  if (!isSelected) {
    return undefined;
  }

  return {
    borderColor: SPENDING_PULSE_COLORS.selectedBorder,
    boxShadow: SPENDING_PULSE_COLORS.selectedShadow,
  };
}

function getMonthButtonLabel(row: Pick<SpendingPulseRow, 'isRelevant' | 'month'>): string {
  if (!row.isRelevant) {
    return `${row.month} is outside the current analysis window`;
  }

  return `Show ${row.month} over-budget expense labels`;
}

function formatMonthVarianceLabel(
  row: Pick<SpendingPulseRow, 'isRelevant' | 'variance'>,
): string {
  if (!row.isRelevant) {
    return 'N/A';
  }

  const amount = formatWholeNumber(getAbsoluteVariance(row.variance));
  const prefix = row.variance >= 0 ? '+' : '-';

  return `${prefix} $${amount}`;
}

export const SpendingPulseSection: React.FC<SpendingPulseSectionProps> = ({
  year,
}) => {
  const narrative = `Track how your monthly spending compares to budget. Green indicates you stayed under budget, red means you spent more than planned. Select a month to inspect which expense labels ran over budget.`;
  const { rows, isLoading, error } = useSpendingPulseData(year);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(
    null,
  );
  const selectedRow = useMemo(
    () =>
      rows.find(
        (row) => row.monthIndex === selectedMonthIndex && row.isRelevant,
      ) ?? null,
    [rows, selectedMonthIndex],
  );
  const hasRelevantMonths = rows.some((row) => row.isRelevant);

  useEffect(() => {
    setSelectedMonthIndex(null);
  }, [year]);

  let content: React.ReactNode;

  if (error) {
    content = (
      <p className="px-6 py-8 text-sm text-danger">
        Unable to load spending pulse: {error}
      </p>
    );
  } else if (isLoading) {
    content = (
      <p className="py-12 text-center text-muted">Loading spending pulse...</p>
    );
  } else if (rows.length === 0) {
    content = <p className="py-12 text-center text-muted">No data available</p>;
  } else {
    content = (
      <div className="flex flex-col gap-6">
        <SpendingPulseLegend />
        <div className="grid grid-cols-4 gap-4 px-4 sm:grid-cols-6 lg:grid-cols-12">
          {rows.map((row) => {
            const isSelected = row.monthIndex === selectedMonthIndex;

            return (
              <MonthVarianceBar
                key={row.monthIndex}
                barHeight={getBudgetUtilizationHeight({
                  actual: row.actual,
                  budget: row.budget,
                  isRelevant: row.isRelevant,
                })}
                isSelected={isSelected}
                row={row}
                onClick={() =>
                  setSelectedMonthIndex((current) =>
                    current === row.monthIndex ? null : row.monthIndex,
                  )
                }
              />
            );
          })}
        </div>
        {selectedRow ? (
          <MonthlyOverBudgetBreakdown row={selectedRow} />
        ) : !hasRelevantMonths ? (
          <div className="mx-6 rounded-2xl border border-dashed border-black/10 bg-black/[0.02] px-5 py-4 text-sm text-muted">
            No completed months are in scope for this year yet.
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <ScrollAnimatedSection className="space-y-8 border-t section-divider px-6 py-12">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-app">Spending Pulse</h2>
        <SectionNarrative text={narrative} highlight={true} />
      </div>

      <div className="surface-card">{content}</div>
    </ScrollAnimatedSection>
  );
};

function SpendingPulseLegend() {
  return (
    <div className="flex justify-center gap-8 border-b pb-6 section-divider">
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: SPENDING_PULSE_COLORS.underBudgetFill }}
        />
        <span className="text-sm text-muted">Under Budget</span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: SPENDING_PULSE_COLORS.overBudgetFill }}
        />
        <span className="text-sm text-muted">Over Budget</span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: SPENDING_PULSE_COLORS.inactiveFill }}
        />
        <span className="text-sm text-muted">Not In Scope</span>
      </div>
    </div>
  );
}

function MonthVarianceBar({
  row,
  barHeight,
  isSelected,
  onClick,
}: {
  row: SpendingPulseRow;
  barHeight: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const fillColor = getMonthBarFillColor(row);
  const textColor = getMonthBarTextColor(row);
  const buttonClassName = getMonthButtonClassName(row, isSelected);
  const buttonStyle = getMonthButtonStyle(row, isSelected);
  const button = (
    <button
      type="button"
      className={buttonClassName}
      style={buttonStyle}
      aria-pressed={row.isRelevant ? isSelected : undefined}
      aria-label={getMonthButtonLabel(row)}
      disabled={!row.isRelevant}
      onClick={onClick}
    >
      <div
        className="flex w-full items-end justify-center pb-2 transition-all duration-300"
        style={{
          height: `${barHeight}%`,
          backgroundColor: fillColor,
        }}
      >
        {row.isRelevant && barHeight > 20 ? (
          <span className="text-center text-xs font-bold text-black">
            ${formatWholeNumber(getAbsoluteVariance(row.variance))}
          </span>
        ) : null}
      </div>
    </button>
  );

  return (
    <div className="flex flex-col items-center gap-2">
      {row.isRelevant ? (
        <Tooltip content={`Click to inspect ${row.month} label overages`}>
          {button}
        </Tooltip>
      ) : (
        button
      )}
      <span className="text-sm font-medium text-app">{row.month}</span>
      <span
        className="text-xs font-semibold"
        style={{ color: textColor }}
      >
        {formatMonthVarianceLabel(row)}
      </span>
    </div>
  );
}

function MonthlyOverBudgetBreakdown({
  row,
}: {
  row: {
    month: string;
    overBudgetLabels: SpendingPulseLabelDetail[];
  };
}) {
  const maxOverage = getMaxVariance(row.overBudgetLabels);

  return (
    <div className="mx-6 rounded-[1.5rem] border border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,242,239,0.94))] p-5 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            {row.month} Drill Down
          </p>
          <h3 className="mt-1 text-base font-semibold text-app">
            Expense Labels Over Budget
          </h3>
        </div>
        <p className="text-sm text-muted">
          {row.overBudgetLabels.length > 0
            ? `${row.overBudgetLabels.length} ${
                row.overBudgetLabels.length === 1
                  ? 'label'
                  : 'labels'
              } exceeded plan.`
            : 'No expense labels exceeded plan in this month.'}
        </p>
      </div>

      {row.overBudgetLabels.length > 0 ? (
        <div className="mt-5 space-y-3">
          {row.overBudgetLabels.map((detail) => {
            const width = (Math.abs(detail.variance) / maxOverage) * 100;

            return (
              <article key={detail.label} className="space-y-1.5">
                <div className="flex items-baseline gap-3">
                  <p className="shrink-0 text-sm font-semibold uppercase tracking-[0.08em] text-app">
                    {detail.label}
                  </p>
                  <p className="min-w-0 truncate text-xs text-muted">
                    {formatWholeCurrency(detail.actual)} actual vs{' '}
                    {formatWholeCurrency(detail.budget)} planned
                  </p>
                </div>
                <div className="relative h-5 overflow-hidden rounded-full bg-black/[0.06]">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${Math.max(width, 10)}%`,
                      background: SPENDING_PULSE_COLORS.drilldownBar,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-xs font-semibold text-app">
                      {formatWholeCurrency(Math.abs(detail.variance))} over
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-black/10 bg-black/[0.02] px-5 py-4 text-sm text-muted">
          {row.month} stayed within budget across all tracked expense labels.
        </div>
      )}
    </div>
  );
}
