/**
 * Financial Health Section
 * Displays a top-level income allocation waterfall for the current plan.
 */

import React, { useState } from 'react';
import { LuWallet } from 'react-icons/lu';

import { useBudgetData } from '@/features/budget/hooks/useBudgetData';
import type { BudgetEntry } from '@/features/budget/types/budgetView';
import { ToggleButtonGroup } from '@/shared/components/ToggleButtonGroup';
import { budgetSummaryTheme } from '@/shared/theme';

import { useIncomeAnalysis } from '../hooks/useIncomeAnalysis';

import {
  IncomeAllocationWaterfallChart,
  type IncomeAllocationBucketId,
  type IncomeAllocationWaterfallStep,
} from './IncomeAllocationWaterfallChart';
import { ScrollAnimatedSection } from './ScrollAnimatedSection';
import { SectionNarrative } from './SectionNarrative';

interface FinancialHealthSectionProps {
  year: number;
}

type DrilldownBucketId = Exclude<IncomeAllocationBucketId, 'savings'>;
type DetailGrouping = 'categories' | 'labels';

const INVESTMENT_BAR_CLASS = 'bg-[#edafb8]';
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
    fillClassName: budgetSummaryTheme.allocationBlue,
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
};

function formatWholeCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function sumBudgeted(entries: BudgetEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.budgeted, 0);
}

function isExplicitInvestmentEntry(entry: BudgetEntry): boolean {
  return entry.isInvestment === true;
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

export const FinancialHealthSection: React.FC<FinancialHealthSectionProps> = ({
  year,
}) => {
  const [selectedBucket, setSelectedBucket] = useState<DrilldownBucketId | null>(
    null,
  );
  const [detailGrouping, setDetailGrouping] =
    useState<DetailGrouping>('categories');
  const incomeAnalysis = useIncomeAnalysis(year);
  const annualNetIncome = incomeAnalysis.plannedNetIncome;
  const monthlyIncome = annualNetIncome / 12;

  const { budgetEntries } = useBudgetData(year, 'monthly_current_month', false);
  const allocationEntries = budgetEntries.reduce(
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
      essential: [] as BudgetEntry[],
      funsies: [] as BudgetEntry[],
      investments: [] as BudgetEntry[],
      totalBudgeted: 0,
    },
  );
  const allocationTotals = {
    essential: sumBudgeted(allocationEntries.essential),
    funsies: sumBudgeted(allocationEntries.funsies),
    investments: sumBudgeted(allocationEntries.investments),
    totalBudgeted: allocationEntries.totalBudgeted,
  };

  const monthlySavings = monthlyIncome - allocationTotals.totalBudgeted;
  const plannedSavings = Math.max(monthlySavings, 0);
  const monthlyWealthContribution = plannedSavings + allocationTotals.investments;

  const getPercentage = (value: number) =>
    monthlyIncome > 0 ? String(Math.round((value / monthlyIncome) * 100)) : '0';

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
      key: 'investments',
      label: BUCKET_CONFIG.investments.label,
      amount: allocationTotals.investments,
      fillClassName: BUCKET_CONFIG.investments.fillClassName,
      bucketId: 'investments',
      isInteractive: allocationTotals.investments > 0,
      actionLabel: 'Show Investments category breakdown',
    },
    {
      key: 'savings',
      label: BUCKET_CONFIG.savings.label,
      amount: plannedSavings,
      fillClassName: BUCKET_CONFIG.savings.fillClassName,
      bucketId: 'savings',
    },
  ];
  const detailSteps =
    selectedBucket == null
      ? []
      : buildGroupedCategorySteps(
          allocationEntries[selectedBucket],
          BUCKET_CONFIG[selectedBucket].fillClassName,
          detailGrouping === 'labels'
            ? (entry) => entry.expenseLabel
            : undefined,
        );
  const isDetailView = selectedBucket != null;
  const selectedBucketLabel = selectedBucket
    ? BUCKET_CONFIG[selectedBucket].label
    : null;

  const openBucketDetail = (bucketId: DrilldownBucketId) => {
    setSelectedBucket(bucketId);
    setDetailGrouping(bucketId === 'investments' ? 'labels' : 'categories');
  };

  return (
    <ScrollAnimatedSection className="py-12 px-6 space-y-8">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-app">
          Financial Health Overview
        </h2>
        <SectionNarrative
          text="Your complete financial picture showing income, spending, savings, and wealth generation. All percentages are relative to total income."
          highlight={true}
        />
      </div>

      <div className="surface-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="icon-tile icon-tile-brand p-2">
            <LuWallet className="h-5 w-5" />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Income Allocation
          </h3>
        </div>

        <div className="space-y-4">
          {isDetailView && selectedBucketLabel ? (
            <div className="flex flex-col gap-4 border-b pb-4 section-divider lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-app">
                  {selectedBucketLabel} Breakdown
                </h4>
                <p className="text-sm text-muted">
                  {detailGrouping === 'labels'
                    ? `Individual ${selectedBucketLabel.toLowerCase()} line items within your current monthly allocation.`
                    : `Category groups within your current monthly ${selectedBucketLabel.toLowerCase()} allocation.`}
                </p>
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
              A waterfall view of how your current monthly plan allocates total
              income across essentials, funsies, investments, and savings.
            </p>
          )}
          <IncomeAllocationWaterfallChart
            steps={isDetailView ? detailSteps : overviewSteps}
            totalLabel={isDetailView && selectedBucketLabel ? `${selectedBucketLabel} Total` : 'Total Income'}
            totalAmount={
              isDetailView && selectedBucket
                ? allocationTotals[selectedBucket]
                : monthlyIncome
            }
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
              if (bucketId !== 'savings') {
                openBucketDetail(bucketId);
              }
            }}
            onTotalSelect={
              isDetailView
                ? () => {
                    setSelectedBucket(null);
                    setDetailGrouping('categories');
                  }
                : undefined
            }
            totalActionLabel={
              isDetailView ? 'Back to allocation' : undefined
            }
          />
          <div className="flex flex-col gap-1 border-t pt-4 section-divider text-xs sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted">
              Wealth capture is {getPercentage(monthlyWealthContribution)}% of
              income.
            </p>
            <p className="font-medium text-app">
              {formatWholeCurrency(monthlyWealthContribution * 12)} annual
            </p>
          </div>
        </div>
      </div>
    </ScrollAnimatedSection>
  );
};
