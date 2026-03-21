/**
 * Money Flow Section
 * Displays Sankey diagram showing how income flows to expenses
 */

import React from 'react';

import { SankeyFlowChart } from './SankeyFlowChart';
import { ScrollAnimatedSection } from './ScrollAnimatedSection';
import { SectionNarrative } from './SectionNarrative';

interface MoneyFlowSectionProps {
  year: number;
}

export const MoneyFlowSection: React.FC<MoneyFlowSectionProps> = ({ year }) => {
  const narrative = `See how annual net income is ultimately allocated between essentials, lifestyle spending, and the dollars building long-term wealth through savings plus investments.`;

  return (
    <ScrollAnimatedSection className="space-y-8 border-t section-divider px-6 py-12">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-app">Money Flow</h2>
        <SectionNarrative text={narrative} highlight={true} />
      </div>

      <SankeyFlowChart year={year} />
    </ScrollAnimatedSection>
  );
};
