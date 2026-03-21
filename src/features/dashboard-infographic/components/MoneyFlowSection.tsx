/**
 * Money Flow Section
 * Displays Sankey diagram showing how income flows to expenses
 */

import React from 'react';

import type { Period } from '../types/infographic';

import { SankeyFlowChart } from './SankeyFlowChart';
import { ScrollAnimatedSection } from './ScrollAnimatedSection';
import { SectionNarrative } from './SectionNarrative';

interface MoneyFlowSectionProps {
  period: Period;
  year: number;
}

export const MoneyFlowSection: React.FC<MoneyFlowSectionProps> = ({
  period,
  year,
}) => {
  const narrative = `Visualize how your income flows from various sources into essential and discretionary spending categories.`;

  return (
    <ScrollAnimatedSection className="space-y-8 border-t section-divider px-6 py-12">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-app">Money Flow</h2>
        <SectionNarrative text={narrative} highlight={true} />
      </div>

      <SankeyFlowChart period={period} year={year} />
    </ScrollAnimatedSection>
  );
};
