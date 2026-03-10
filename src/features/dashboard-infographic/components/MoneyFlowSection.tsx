/**
 * Money Flow Section
 * Displays Sankey diagram showing how income flows to expenses
 */

import React from 'react';

import { SankeyFlowChart } from '@/features/home/components/SankeyFlowChart';

import type { Period } from '../types/infographic';

import { ScrollAnimatedSection } from './ScrollAnimatedSection';
import { SectionNarrative } from './SectionNarrative';

interface MoneyFlowSectionProps {
  period: Period;
}

export const MoneyFlowSection: React.FC<MoneyFlowSectionProps> = ({
  period,
}) => {
  const narrative = `Visualize how your income flows from various sources into essential and discretionary spending categories.`;

  return (
    <ScrollAnimatedSection className="py-12 px-6 space-y-8 border-t border-gray-200">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Money Flow</h2>
        <SectionNarrative text={narrative} highlight={true} />
      </div>

      <SankeyFlowChart period={period} />
    </ScrollAnimatedSection>
  );
};
