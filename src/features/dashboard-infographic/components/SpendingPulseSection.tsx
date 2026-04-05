/**
 * Spending Pulse Section
 * Shows monthly variance from budget with expandable detail table
 */

import React, { useMemo, useState } from 'react';

import { Tooltip } from '@/shared/components/Tooltip';
import { statusPalette } from '@/shared/theme';
import { formatCurrency } from '@/shared/utils/currency';

import {
  useSpendingPulseData,
  type SpendingPulseLabelDetail,
} from '../hooks/useSpendingPulseData';

import { ScrollAnimatedSection } from './ScrollAnimatedSection';
import { SectionNarrative } from './SectionNarrative';

interface SpendingPulseSectionProps {
  year: number;
}

function getAbsoluteVariance(amount: number): number {
  return Math.abs(amount);
}

function getMaxVariance(rows: SpendingPulseLabelDetail[] | { variance: number }[]): number {
  return Math.max(...rows.map((row) => getAbsoluteVariance(row.variance)), 1);
}

export const SpendingPulseSection: React.FC<SpendingPulseSectionProps> = ({
  year,
}) => {
  const narrative = `Track how your monthly spending compares to budget. Green indicates you stayed under budget, red means you spent more than planned.`;
  const { rows, coverageLabel, isLoading, error } = useSpendingPulseData(year);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(
    null,
  );
  const maxVariance = getMaxVariance(rows);
  const selectedRow = useMemo(
    () =>
      rows.find((row) => row.monthIndex === selectedMonthIndex) ?? null,
    [rows, selectedMonthIndex],
  );

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
        {coverageLabel ? (
          <p className="px-6 pt-6 text-sm text-muted">{coverageLabel}</p>
        ) : null}
        <SpendingPulseLegend />
        <div className="flex flex-wrap gap-4 justify-center">
          {rows.map((row) => {
            const isSelected = row.monthIndex === selectedMonthIndex;

            return (
              <MonthVarianceBar
                key={row.monthIndex}
                barHeight={(getAbsoluteVariance(row.variance) / maxVariance) * 100}
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
        ) : (
          <div className="mx-6 rounded-2xl border border-dashed border-black/10 bg-black/[0.02] px-5 py-4 text-sm text-muted">
            Select a month to inspect which expense labels ran over budget.
          </div>
        )}
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
          style={{ backgroundColor: statusPalette.income }}
        />
        <span className="text-sm text-muted">Under Budget</span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: statusPalette.spending }}
        />
        <span className="text-sm text-muted">Over Budget</span>
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
  row: {
    month: string;
    monthIndex: number;
    variance: number;
  };
  barHeight: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isUnderBudget = row.variance >= 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <Tooltip content={`Click to inspect ${row.month} label overages`}>
        <button
          type="button"
          className={`surface-subtle relative flex h-40 w-12 flex-col-reverse overflow-hidden rounded-lg border transition-all duration-200 ${
            isSelected
              ? 'border-[color:var(--color-accent)] shadow-[0_12px_30px_-20px_var(--color-accent)]'
              : 'border-transparent hover:border-black/10 hover:-translate-y-1'
          }`}
          aria-pressed={isSelected}
          aria-label={`Show ${row.month} over-budget expense labels`}
          onClick={onClick}
        >
          <div
            className="flex w-full items-end justify-center pb-2 transition-all duration-300"
            style={{
              height: `${barHeight}%`,
              backgroundColor: isUnderBudget
                ? statusPalette.income
                : statusPalette.spending,
            }}
          >
            {barHeight > 20 ? (
              <span className="text-center text-xs font-bold text-[color:var(--color-inverse)]">
                ${getAbsoluteVariance(row.variance).toLocaleString()}
              </span>
            ) : null}
          </div>
        </button>
      </Tooltip>
      <span className="text-sm font-medium text-app">{row.month}</span>
      <span
        className="text-xs font-semibold"
        style={{
          color: isUnderBudget
            ? statusPalette.income
            : statusPalette.spending,
        }}
      >
        {isUnderBudget ? '+' : '-'} ${getAbsoluteVariance(row.variance).toLocaleString()}
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
    <div className="mx-6 rounded-[1.75rem] border border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,242,239,0.94))] p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            {row.month} Drill Down
          </p>
          <h3 className="mt-2 text-lg font-semibold text-app">
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
        <div className="mt-6 space-y-4">
          {row.overBudgetLabels.map((detail) => {
            const width = (Math.abs(detail.variance) / maxOverage) * 100;

            return (
              <article key={detail.label} className="space-y-2">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.08em] text-app">
                      {detail.label}
                    </p>
                    <p className="text-xs text-muted">
                      Budget {formatCurrency(detail.budget)} vs actual{' '}
                      {formatCurrency(detail.actual)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-danger">
                    {formatCurrency(Math.abs(detail.variance))} over
                  </p>
                </div>
                <div className="relative h-10 overflow-hidden rounded-full bg-black/[0.06]">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${Math.max(width, 10)}%`,
                      background:
                        'linear-gradient(90deg, color-mix(in srgb, var(--color-danger) 86%, white 14%), color-mix(in srgb, var(--color-danger) 70%, black 30%))',
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between gap-3 px-4">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-inverse)]">
                      Over by
                    </span>
                    <span className="text-sm font-semibold text-app">
                      {formatCurrency(Math.abs(detail.variance))}
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
