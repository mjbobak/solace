/**
 * Spending Mix Section
 * Donut chart of each category's share of total spending, with the total
 * spend anchored in the center of the ring.
 */

import React from 'react';

import { DonutChart } from '@/shared/components/charts';
import { chartPalette } from '@/shared/theme';

import {
  useSpendingByCategory,
  type SpendingCategorySlice,
} from '../hooks/useSpendingByCategory';

import { ScrollAnimatedSection } from './ScrollAnimatedSection';
import { SectionNarrative } from './SectionNarrative';

interface SpendingMixSectionProps {
  year: number;
}

const SLICE_COLORS = [
  ...chartPalette,
  'var(--color-brand)',
  'var(--color-warning)',
];

function formatWholeCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export const SpendingMixSection: React.FC<SpendingMixSectionProps> = ({
  year,
}) => {
  const narrative = `See where your money actually went. Each slice is a category's share of everything you spent this year — the total sits in the center so the parts always add up to something concrete.`;
  const { slices, total, isLoading, error } = useSpendingByCategory(year);

  let content: React.ReactNode;

  if (error) {
    content = (
      <p className="px-6 py-8 text-sm text-danger">
        Unable to load spending mix: {error}
      </p>
    );
  } else if (isLoading) {
    content = (
      <p className="py-12 text-center text-muted">Loading spending mix...</p>
    );
  } else if (slices.length === 0) {
    content = <p className="py-12 text-center text-muted">No data available</p>;
  } else {
    content = (
      <div className="flex flex-col items-center gap-6 p-6 lg:flex-row lg:items-center lg:gap-10">
        <div className="w-full max-w-sm lg:w-1/2">
          <DonutChart
            data={slices}
            dataKey="amount"
            nameKey="category"
            colors={SLICE_COLORS}
            showLegend={false}
            showPercentage={false}
            height={280}
            valueFormatter={formatWholeCurrency}
            centerValue={formatWholeCurrency(total)}
            centerLabel="Total spending"
          />
        </div>
        <SpendingMixLegend slices={slices} total={total} />
      </div>
    );
  }

  return (
    <ScrollAnimatedSection className="space-y-8 border-t section-divider px-6 py-12">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-app">Spending Mix</h2>
        <SectionNarrative text={narrative} highlight={true} />
      </div>

      <div className="surface-card">{content}</div>
    </ScrollAnimatedSection>
  );
};

function SpendingMixLegend({
  slices,
  total,
}: {
  slices: SpendingCategorySlice[];
  total: number;
}) {
  return (
    <ul className="flex w-full flex-col gap-3 lg:w-1/2">
      {slices.map((slice, index) => (
        <li key={slice.category} className="flex items-center gap-3">
          <span
            className="h-3 w-3 shrink-0 rounded-sm"
            style={{ backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length] }}
          />
          <span className="flex-1 truncate text-sm text-app">
            {slice.category}
          </span>
          <span className="text-sm font-semibold text-app tabular-nums">
            {slice.percentage.toFixed(1)}%
          </span>
          <span className="w-24 text-right text-sm text-muted tabular-nums">
            {formatWholeCurrency(slice.amount)}
          </span>
        </li>
      ))}
      <li className="mt-1 flex items-center gap-3 border-t pt-3 section-divider">
        <span className="h-3 w-3 shrink-0" />
        <span className="flex-1 text-sm font-semibold text-app">Total</span>
        <span className="text-sm font-semibold text-app tabular-nums">100%</span>
        <span className="w-24 text-right text-sm font-semibold text-app tabular-nums">
          {formatWholeCurrency(total)}
        </span>
      </li>
    </ul>
  );
}
