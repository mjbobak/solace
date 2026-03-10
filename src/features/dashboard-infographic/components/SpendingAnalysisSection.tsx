/**
 * Spending Analysis Section
 * Shows spending by category and top spending categories
 */

import React from 'react';

import { categoryData } from '@/features/home/services/mockDashboardData';
import { DonutChart, BarChart } from '@/shared/components/charts';

import type { Period } from '../types/infographic';

import { ScrollAnimatedSection } from './ScrollAnimatedSection';
import { SectionNarrative } from './SectionNarrative';

interface SpendingAnalysisSectionProps {
  period: Period;
}

export const SpendingAnalysisSection: React.FC<
  SpendingAnalysisSectionProps
> = () => {
  // Top 5 categories for bar chart
  const topCategories = [...categoryData]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const totalSpending = categoryData.reduce((sum, item) => sum + item.value, 0);
  const topCategory = topCategories[0];
  const topPercentage = ((topCategory.value / totalSpending) * 100).toFixed(1);

  const narrative = `Your biggest spending category is ${
    topCategory.name
  } at $${topCategory.value.toLocaleString()} (${topPercentage}% of total). Your top 5 categories account for most of your spending.`;

  return (
    <ScrollAnimatedSection className="py-12 px-6 space-y-8 border-t border-gray-200">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Spending Analysis
        </h2>
        <SectionNarrative text={narrative} highlight={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            All Categories
          </h3>
          {categoryData.length > 0 ? (
            <DonutChart
              data={categoryData}
              dataKey="value"
              nameKey="name"
              height={300}
            />
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Top Spending Categories
          </h3>
          {topCategories.length > 0 ? (
            <BarChart
              data={topCategories}
              xAxisKey="name"
              bars={[{ dataKey: 'value', fill: '#f43f5e' }]}
              height={300}
              orientation="vertical"
            />
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>
      </div>
    </ScrollAnimatedSection>
  );
};
