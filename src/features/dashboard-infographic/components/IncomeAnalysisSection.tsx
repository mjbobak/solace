/**
 * Income Analysis Section
 * Shows income sources and trends
 */

import React from 'react';

import { DonutChart, LineChart } from '@/shared/components/charts';

import { useIncomeAnalysis } from '../hooks/useIncomeAnalysis';
import type { Period } from '../types/infographic';

import { ScrollAnimatedSection } from './ScrollAnimatedSection';
import { SectionNarrative } from './SectionNarrative';

interface IncomeAnalysisSectionProps {
  period: Period;
}

export const IncomeAnalysisSection: React.FC<
  IncomeAnalysisSectionProps
> = () => {
  const incomeData = useIncomeAnalysis();

  // Prepare donut chart data
  const donutData = incomeData.typeBreakdown.map((item) => ({
    name: item.type,
    value: item.amount,
  }));

  const narrative = `You earn $${incomeData.totalIncome.toLocaleString()} from ${
    incomeData.streamBreakdown.length
  } income sources. Your largest source is ${incomeData.streamBreakdown[0]
    ?.stream} at ${incomeData.streamBreakdown[0]?.percentage.toFixed(
    1,
  )}% of total income.`;

  return (
    <ScrollAnimatedSection className="py-12 px-6 space-y-8 border-t border-gray-200">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Income Analysis
        </h2>
        <SectionNarrative text={narrative} highlight={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Income Sources
          </h3>
          {donutData.length > 0 ? (
            <DonutChart
              data={donutData}
              dataKey="value"
              nameKey="name"
              height={300}
            />
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">No income data available</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Income Trend
          </h3>
          {incomeData.trend.length > 0 ? (
            <LineChart
              data={incomeData.trend}
              xAxisKey="month"
              lines={[{ dataKey: 'income', stroke: '#10b981' }]}
              height={300}
            />
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">No trend data available</p>
            </div>
          )}
        </div>
      </div>
    </ScrollAnimatedSection>
  );
};
