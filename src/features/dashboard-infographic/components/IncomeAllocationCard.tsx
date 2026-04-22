import React, { useState } from 'react';
import { LuCalendar, LuWallet } from 'react-icons/lu';

import type { BudgetEntry } from '@/features/budget/types/budgetView';
import { ToggleButtonGroup } from '@/shared/components/ToggleButtonGroup';
import { budgetSummaryTheme } from '@/shared/theme';

import {
  IncomeAllocationWaterfallChart,
  type IncomeAllocationBucketId,
  type IncomeAllocationWaterfallStep,
} from './IncomeAllocationWaterfallChart';

interface IncomeAllocationCardProps {
  monthlyIncome: number;
  budgetEntries: BudgetEntry[];
  className?: string;
}

type AllocationBucketId = Extract<
  IncomeAllocationBucketId,
  'essential' | 'funsies' | 'investments'
>;
type DrilldownBucketId = Exclude<IncomeAllocationBucketId, 'savings'>;
type DetailGrouping = 'categories' | 'labels';

interface AllocationEntries {
  essential: BudgetEntry[];
  funsies: BudgetEntry[];
  investments: BudgetEntry[];
  totalBudgeted: number;
}

interface AllocationTotals {
  essential: number;
  funsies: number;
  investments: number;
  totalBudgeted: number;
}

const ESSENTIAL_BAR_CLASS = 'bg-[#586FD1]';
const INVESTMENT_BAR_CLASS = 'bg-[#E29AA8]';
const DETAIL_GROUPING_OPTIONS: { value: DetailGrouping; label: string }[] = [
  { value: 'categories', label: 'Categories' },
  { value: 'labels', label: 'Labels' },
];

const BUCKET_CONFIG: Record<
  IncomeAllocationBucketId,
  { label: string; fillClassName: string }
> = {
  essential: {
    label: 'Essential',
    fillClassName: ESSENTIAL_BAR_CLASS,
  },
  funsies: {
    label: 'Funsies',
    fillClassName: budgetSummaryTheme.allocationPurple,
  },
  investments: {
    label: 'Investments',
    fillClassName: INVESTMENT_BAR_CLASS,
  },
  savings: {
    label: 'Savings',
    fillClassName: budgetSummaryTheme.allocationGreen,
  },
  wealth: {
    label: 'Wealth',
    fillClassName: budgetSummaryTheme.allocationGreen,
  },
};

function sumBudgeted(entries: BudgetEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.budgeted, 0);
}

function isExplicitInvestmentEntry(entry: BudgetEntry): boolean {
  return entry.isInvestment === true;
}

function buildAllocationEntries(budgetEntries: BudgetEntry[]): AllocationEntries {
  return budgetEntries.reduce<AllocationEntries>(
    (totals, entry) => {
      totals.totalBudgeted += entry.budgeted;

      if (isExplicitInvestmentEntry(entry)) {
        totals.investments.push(entry);
      } else if (entry.expenseType === 'ESSENTIAL') {
        totals.essential.push(entry);
      } else {
        totals.funsies.push(entry);
      }

      return totals;
    },
    {
      essential: [],
      funsies: [],
      investments: [],
      totalBudgeted: 0,
    },
  );
}

function buildAllocationTotals(
  allocationEntries: AllocationEntries,
): AllocationTotals {
  return {
    essential: sumBudgeted(allocationEntries.essential),
    funsies: sumBudgeted(allocationEntries.funsies),
    investments: sumBudgeted(allocationEntries.investments),
    totalBudgeted: allocationEntries.totalBudgeted,
  };
}

function buildGroupedCategorySteps(
  entries: BudgetEntry[],
  fillClassName: string,
  getGroupLabel: (entry: BudgetEntry) => string = (entry) => entry.expenseCategory,
): IncomeAllocationWaterfallStep[] {
  const groupedAmounts = new Map<string, number>();

  entries.forEach((entry) => {
    const groupLabel = getGroupLabel(entry);
    const nextAmount = (groupedAmounts.get(groupLabel) ?? 0) + entry.budgeted;
    groupedAmounts.set(groupLabel, nextAmount);
  });

  return Array.from(groupedAmounts.entries())
    .map(([label, amount]) => ({
      key: label,
      label,
      amount,
      fillClassName,
    }))
    .filter((step) => step.amount > 0)
    .sort(
      (left, right) =>
        right.amount - left.amount || left.label.localeCompare(right.label),
    );
}

function buildWealthDetailSteps(
  investmentEntries: BudgetEntry[],
  plannedSavings: number,
  detailGrouping: DetailGrouping,
): IncomeAllocationWaterfallStep[] {
  const investmentLabelSteps = buildGroupedCategorySteps(
    investmentEntries,
    BUCKET_CONFIG.investments.fillClassName,
    (entry) => entry.expenseLabel,
  );

  const steps: IncomeAllocationWaterfallStep[] = [];

  if (detailGrouping === 'labels') {
    steps.push(...investmentLabelSteps);
    steps.push({
      key: 'savings',
      label: BUCKET_CONFIG.savings.label,
      amount: plannedSavings,
      fillClassName: BUCKET_CONFIG.savings.fillClassName,
    });
  } else {
    steps.push({
      key: 'investments',
      label: BUCKET_CONFIG.investments.label.toUpperCase(),
      amount: sumBudgeted(investmentEntries),
      fillClassName: BUCKET_CONFIG.investments.fillClassName,
    });
    steps.push({
      key: 'savings',
      label: BUCKET_CONFIG.savings.label.toUpperCase(),
      amount: plannedSavings,
      fillClassName: BUCKET_CONFIG.savings.fillClassName,
    });
  }

  return steps
    .filter((step) => step.amount > 0)
    .sort(
      (left, right) =>
        right.amount - left.amount || left.label.localeCompare(right.label),
    );
}

function getDefaultDetailGrouping(bucketId: DrilldownBucketId): DetailGrouping {
  if (bucketId === 'investments' || bucketId === 'wealth') {
    return 'labels';
  }

  return 'categories';
}

export const IncomeAllocationCard: React.FC<IncomeAllocationCardProps> = ({
  monthlyIncome,
  budgetEntries,
  className = '',
}) => {
  const [selectedBucket, setSelectedBucket] = useState<DrilldownBucketId | null>(
    null,
  );
  const [detailGrouping, setDetailGrouping] =
    useState<DetailGrouping>('categories');
  const [valueDisplayPeriod, setValueDisplayPeriod] = useState<
    'monthly' | 'annual'
  >('monthly');

  const allocationEntries = buildAllocationEntries(budgetEntries);
  const allocationTotals = buildAllocationTotals(allocationEntries);
  const monthlySavings = monthlyIncome - allocationTotals.totalBudgeted;
  const plannedSavings = Math.max(monthlySavings, 0);
  const monthlyWealthContribution =
    plannedSavings + allocationTotals.investments;

  const overviewSteps: IncomeAllocationWaterfallStep[] = [
    {
      key: 'essential',
      label: BUCKET_CONFIG.essential.label,
      amount: allocationTotals.essential,
      fillClassName: BUCKET_CONFIG.essential.fillClassName,
      bucketId: 'essential',
      isInteractive: allocationTotals.essential > 0,
      actionLabel: 'Show Essential category breakdown',
    },
    {
      key: 'funsies',
      label: BUCKET_CONFIG.funsies.label,
      amount: allocationTotals.funsies,
      fillClassName: BUCKET_CONFIG.funsies.fillClassName,
      bucketId: 'funsies',
      isInteractive: allocationTotals.funsies > 0,
      actionLabel: 'Show Funsies category breakdown',
    },
    {
      key: 'wealth',
      label: BUCKET_CONFIG.wealth.label,
      amount: monthlyWealthContribution,
      fillClassName: BUCKET_CONFIG.wealth.fillClassName,
      bucketId: 'wealth',
      isInteractive: monthlyWealthContribution > 0,
      actionLabel: 'Show Wealth category breakdown',
    },
  ];

  let detailSteps: IncomeAllocationWaterfallStep[] = [];
  let selectedBucketTotal: number | null = null;
  let selectedBucketLabel: string | null = null;
  let detailDescription =
    'A waterfall view of how your current monthly plan allocates total income across essentials, funsies, and wealth.';

  if (selectedBucket != null) {
    selectedBucketLabel = BUCKET_CONFIG[selectedBucket].label;

    if (selectedBucket === 'wealth') {
      detailSteps = buildWealthDetailSteps(
        allocationEntries.investments,
        plannedSavings,
        detailGrouping,
      );
      selectedBucketTotal = monthlyWealthContribution;
      if (detailGrouping === 'labels') {
        detailDescription =
          'Individual investment line items plus planned monthly savings within your current wealth allocation.';
      } else {
        detailDescription =
          'Category groups within your current monthly wealth allocation, including investments and savings.';
      }
    } else {
      detailSteps = buildGroupedCategorySteps(
        allocationEntries[selectedBucket as AllocationBucketId],
        BUCKET_CONFIG[selectedBucket].fillClassName,
        detailGrouping === 'labels'
          ? (entry) => entry.expenseLabel
          : undefined,
      );
      selectedBucketTotal = allocationTotals[selectedBucket as AllocationBucketId];
      if (detailGrouping === 'labels') {
        detailDescription = `Individual ${selectedBucketLabel.toLowerCase()} line items within your current monthly allocation.`;
      } else {
        detailDescription = `Category groups within your current monthly ${selectedBucketLabel.toLowerCase()} allocation.`;
      }
    }
  }

  const isDetailView = selectedBucket != null;
  const nextValueDisplayPeriod =
    valueDisplayPeriod === 'monthly' ? 'annual' : 'monthly';
  const valueToggleLabel =
    valueDisplayPeriod === 'monthly'
      ? 'Show yearly values'
      : 'Show monthly values';

  return (
    <div
      role="region"
      aria-label="Income Allocation"
      className={`surface-card p-5 ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="icon-tile icon-tile-brand p-2">
            <LuWallet className="h-5 w-5" />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Income Allocation
          </h3>
        </div>

        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200"
          onClick={() => setValueDisplayPeriod(nextValueDisplayPeriod)}
          aria-label={valueToggleLabel}
          title={valueToggleLabel}
        >
          <LuCalendar className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {isDetailView && selectedBucketLabel ? (
          <div className="flex flex-col gap-4 border-b pb-4 section-divider lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-app">
                {selectedBucketLabel} Breakdown
              </h4>
              <p className="text-sm text-muted">{detailDescription}</p>
            </div>
            <ToggleButtonGroup
              value={detailGrouping}
              options={DETAIL_GROUPING_OPTIONS}
              onChange={setDetailGrouping}
              className="w-full lg:w-auto"
            />
          </div>
        ) : (
          <p className="text-sm text-muted">
            {detailDescription}
          </p>
        )}

        <IncomeAllocationWaterfallChart
          steps={isDetailView ? detailSteps : overviewSteps}
          totalLabel={
            isDetailView && selectedBucketLabel
              ? `${selectedBucketLabel} Total`
              : 'Total Income'
          }
          totalAmount={
            isDetailView && selectedBucketTotal != null
              ? selectedBucketTotal
              : monthlyIncome
          }
          valueDisplayPeriod={valueDisplayPeriod}
          chartAriaLabel={
            isDetailView && selectedBucketLabel
              ? `${selectedBucketLabel} allocation waterfall chart`
              : 'Income allocation waterfall chart'
          }
          totalBarAriaLabel={
            isDetailView && selectedBucketLabel
              ? `${selectedBucketLabel} total waterfall segment`
              : 'Total income waterfall segment'
          }
          showOverAllocatedWarning={!isDetailView}
          onStepSelect={(bucketId) => {
            if (bucketId === 'savings') {
              return;
            }

            setSelectedBucket(bucketId);
            setDetailGrouping(getDefaultDetailGrouping(bucketId));
          }}
          onTotalSelect={
            isDetailView
              ? () => {
                  setSelectedBucket(null);
                  setDetailGrouping('categories');
                }
              : undefined
          }
          totalActionLabel={isDetailView ? 'Back to allocation' : undefined}
        />
      </div>
    </div>
  );
};
