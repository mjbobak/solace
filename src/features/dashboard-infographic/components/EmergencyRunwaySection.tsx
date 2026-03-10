/**
 * Emergency Runway Section
 * Shows how many months you can live off emergency fund in different income loss scenarios
 */

import React from 'react';

import type { Period } from '../types/infographic';

import { ScrollAnimatedSection } from './ScrollAnimatedSection';
import { SectionNarrative } from './SectionNarrative';

interface EmergencyRunwaySectionProps {
  period: Period;
}

export const EmergencyRunwaySection: React.FC<
  EmergencyRunwaySectionProps
> = () => {
  const narrative = `Your emergency fund provides financial security. These projections show how many months you can cover your essential expenses if someone loses income.`;

  return (
    <ScrollAnimatedSection className="py-12 px-6 space-y-8 border-t border-gray-200">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Emergency Runway
        </h2>
        <SectionNarrative text={narrative} highlight={true} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-500 text-center py-12">
          Emergency Runway progress bars will be displayed here
        </p>
      </div>
    </ScrollAnimatedSection>
  );
};
