/**
 * Income Analysis Section
 * Shows income sources and trends
 */

import React from 'react';

import { DonutChart, LineChart } from '@/shared/components/charts';
import { statusPalette } from '@/shared/theme';

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

  const narrative = `You plan ${incomeData.totalIncome.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })} of net income across ${incomeData.sourceBreakdown.length} income sources. Your largest source is ${incomeData.sourceBreakdown[0]
    ?.source} at ${incomeData.sourceBreakdown[0]?.percentage.toFixed(
    1,
  )}% of total income.`;

  return (
    <ScrollAnimatedSection className="space-y-8 border-t section-divider px-6 py-12">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-app">Income Analysis</h2>
        <SectionNarrative text={narrative} highlight={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="page-section-title">Income Sources</h3>
          {donutData.length > 0 ? (
            <DonutChart
              data={donutData}
              dataKey="value"
              nameKey="name"
              height={300}
            />
          ) : (
            <div className="chart-empty-state h-80">
              <p className="text-muted">No income data available</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="page-section-title">Income Trend</h3>
          {incomeData.trend.length > 0 ? (
            <LineChart
              data={incomeData.trend}
              xAxisKey="month"
              lines={[{ dataKey: 'income', stroke: statusPalette.income }]}
              height={300}
            />
          ) : (
            <div className="chart-empty-state h-80">
              <p className="text-muted">No trend data available</p>
            </div>
          )}
        </div>
      </div>
    </ScrollAnimatedSection>
  );
};
