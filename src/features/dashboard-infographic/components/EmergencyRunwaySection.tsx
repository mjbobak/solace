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
    <ScrollAnimatedSection className="space-y-8 border-t section-divider px-6 py-12">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-app">Emergency Runway</h2>
        <SectionNarrative text={narrative} highlight={true} />
      </div>

      <div className="surface-card">
        <p className="py-12 text-center text-muted">
          Emergency Runway progress bars will be displayed here
        </p>
      </div>
    </ScrollAnimatedSection>
  );
};
