/**
 * Spending Analysis Section
 * Shows real spending by category with per-chart type filters.
 */

import React, { useState } from 'react';
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { ExpenseTypeFilter } from '@/features/budget/types/budgetView';
import { ToggleButtonGroup } from '@/shared/components/ToggleButtonGroup';
import { statusPalette, chartTheme } from '@/shared/theme';
import { formatCurrency } from '@/shared/utils/currency';

import { useDashboardSpendingAnalysis } from '../hooks/useDashboardSpendingAnalysis';
import type { SpendingCategoryDatum } from '../utils/spendingAnalysis';

import { ScrollAnimatedSection } from './ScrollAnimatedSection';
import { SectionNarrative } from './SectionNarrative';

interface SpendingAnalysisSectionProps {
  year: number;
}

const FILTER_OPTIONS: { value: ExpenseTypeFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ESSENTIAL', label: 'Essential' },
  { value: 'FUNSIES', label: 'Funsies' },
];

const FILTER_LABELS: Record<ExpenseTypeFilter, string> = {
  ALL: 'all spending',
  ESSENTIAL: 'essential spending',
  FUNSIES: 'funsies spending',
};

const CATEGORY_ROW_HEIGHT = 64;
const VISIBLE_CATEGORY_ROWS = 5;

interface CategoryMixBarDatum extends SpendingCategoryDatum {
  label: string;
}

const AXIS_MAX_PADDING = 1.08;

function buildCategoryMixData(
  categories: SpendingCategoryDatum[],
  totalSpending: number,
): CategoryMixBarDatum[] {
  return categories.map((category) => {
      const share = totalSpending > 0 ? (category.value / totalSpending) * 100 : 0;
      return {
        ...category,
        label: `${share.toFixed(1)}%  ${formatCurrency(category.value)}`,
      };
    });
}

export const SpendingAnalysisSection: React.FC<SpendingAnalysisSectionProps> = ({
  year,
}) => {
  const [activeFilter, setActiveFilter] = useState<ExpenseTypeFilter>('ALL');
  const { analysis, isLoading, error } = useDashboardSpendingAnalysis(year);

  const categories = analysis.categoriesByFilter[activeFilter];
  const totalSpending = analysis.totalsByFilter[activeFilter];
  const topCategory = categories[0];
  const categoryMixData = buildCategoryMixData(categories, totalSpending);
  const visibleChartHeight = CATEGORY_ROW_HEIGHT * VISIBLE_CATEGORY_ROWS + 32;
  const chartHeight = Math.max(
    categoryMixData.length * CATEGORY_ROW_HEIGHT,
    visibleChartHeight,
  );
  const axisMax = Math.max(
    ...categoryMixData.map((category) => category.value),
    0,
  );
  const axisDomainMax = Math.max(Math.ceil(axisMax * AXIS_MAX_PADDING), 1);
  const narrative = topCategory
    ? `Your largest ${
        FILTER_LABELS[activeFilter]
      } category is ${topCategory.name} at ${formatCurrency(
        topCategory.value,
      )}, which is ${((topCategory.value / totalSpending) * 100).toFixed(
        1,
      )}% of that view.`
    : `No ${FILTER_LABELS[activeFilter]} has been categorized for ${year} yet.`;

  return (
    <ScrollAnimatedSection className="space-y-8 border-t section-divider px-6 py-12">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="mb-4 text-2xl font-bold text-app">
              Spending Analysis
            </h2>
            <SectionNarrative text={narrative} highlight={true} />
          </div>
          <div className="w-full lg:w-auto">
            <ToggleButtonGroup
              value={activeFilter}
              options={FILTER_OPTIONS}
              onChange={setActiveFilter}
              className="w-full lg:w-auto"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="page-section-title">Category Mix</h3>
          <p className="text-sm text-muted">
            {formatCurrency(totalSpending)} total across all visible categories.
            Scroll to see the full list when there are more than five.
          </p>
        </div>
        {categoryMixData.length > 0 || isLoading || error ? (
          <div className="surface-card overflow-hidden">
            {isLoading ? (
              <div className="chart-empty-state h-96">
                <div className="chart-loading-text">
                  <div className="animate-pulse">Loading chart...</div>
                </div>
              </div>
            ) : error ? (
              <div className="chart-empty-state h-96">
                <div className="text-danger text-sm">{error}</div>
              </div>
            ) : (
              <>
                <div
                  className="overflow-y-auto px-2 py-4 sm:px-3"
                  style={{ maxHeight: `${visibleChartHeight}px` }}
                >
                  <div style={{ height: `${chartHeight}px` }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={categoryMixData}
                        layout="vertical"
                        margin={{ top: 8, right: 112, left: 0, bottom: 0 }}
                        barCategoryGap={14}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={chartTheme.grid}
                        />
                        <XAxis
                          type="number"
                          hide={true}
                          domain={[0, axisDomainMax]}
                          allowDataOverflow={true}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={148}
                          stroke={chartTheme.axis}
                          style={{ fontSize: chartTheme.fontSize }}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            formatCurrency(value),
                            'Spending',
                          ]}
                          contentStyle={{
                            backgroundColor: chartTheme.tooltipBackground,
                            border: `1px solid ${chartTheme.tooltipBorder}`,
                            borderRadius: chartTheme.tooltipBorderRadius,
                            color: chartTheme.tooltipText,
                            fontSize: chartTheme.fontSize,
                          }}
                        />
                        <Bar
                          dataKey="value"
                          fill={statusPalette.budget}
                          radius={[0, 4, 4, 0]}
                        >
                          <LabelList
                            dataKey="label"
                            position="right"
                            style={{
                              fill: chartTheme.tooltipText,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          />
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="border-t section-divider px-2 pb-4 pt-2 sm:px-3">
                  <div className="h-14">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={[{ name: '', value: axisMax }]}
                        layout="vertical"
                        margin={{ top: 0, right: 112, left: 0, bottom: 0 }}
                      >
                        <XAxis
                          type="number"
                          domain={[0, axisDomainMax]}
                          allowDataOverflow={true}
                          stroke={chartTheme.axis}
                          style={{ fontSize: chartTheme.fontSize }}
                          tickFormatter={(value: number) =>
                            new Intl.NumberFormat('en-US', {
                              notation: 'compact',
                              maximumFractionDigits: 1,
                            }).format(value)
                          }
                        />
                        <YAxis type="category" dataKey="name" hide={true} />
                        <Bar dataKey="value" fill="transparent" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="chart-empty-state h-96">
            <p className="text-muted">No data available</p>
          </div>
        )}
      </div>
    </ScrollAnimatedSection>
  );
};
