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
  componentOptions: Array<{
    id: string;
    label: string;
  }>;
  selectedComponentIds: string[];
  onSelectedComponentIdsChange: (ids: string[]) => void;
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
  componentOptions,
  selectedComponentIds,
  onSelectedComponentIdsChange,
}) => {
  const allSelected =
    componentOptions.length > 0 &&
    selectedComponentIds.length === componentOptions.length;

  const handleComponentToggle = (componentId: string) => {
    if (selectedComponentIds.includes(componentId)) {
      onSelectedComponentIdsChange(
        selectedComponentIds.filter((id) => id !== componentId),
      );
      return;
    }

    onSelectedComponentIdsChange([...selectedComponentIds, componentId]);
  };

  const handleSelectAllToggle = () => {
    onSelectedComponentIdsChange(
      allSelected ? [] : componentOptions.map((option) => option.id),
    );
  };

  return (
    <div className="mb-1 pt-2">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:items-start">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Components
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Choose budget lines to model.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAllToggle}
                className="checkbox-input"
                aria-label="Select all budget components"
              />
              All
            </label>
          </div>

          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {componentOptions.map((component) => {
              const isSelected = selectedComponentIds.includes(component.id);

              return (
                <label
                  key={component.id}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-white"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleComponentToggle(component.id)}
                    className="checkbox-input"
                    aria-label={`Include ${component.label} in budget utilization`}
                  />
                  <span className="truncate">{component.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className={`flex flex-1 flex-col justify-end ${compactCardContentHeight}`}>
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

          {selectedComponentIds.length === 0 ? (
            <div className="mt-4 flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-500">
              Select at least one component to preview budget utilization.
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};
