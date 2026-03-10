/**
 * Sticky header with period toggle
 * Stays fixed at top while user scrolls through infographic
 */

import React from 'react';

import { ToggleButtonGroup } from '@/shared/components/ToggleButtonGroup';

import type { Period } from '../types/infographic';

interface InfographicStickyHeaderProps {
  period: Period;
  onPeriodChange: (period: Period) => void;
}

export const InfographicStickyHeader: React.FC<
  InfographicStickyHeaderProps
> = ({ period, onPeriodChange }) => {
  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
      <div className="max-w-6xl ml-12 px-6 py-4">
        {/* Period Toggle */}
        <ToggleButtonGroup
          options={[
            { value: 'monthly' as const, label: 'Monthly' },
            { value: 'annual' as const, label: 'Annual' },
          ]}
          value={period}
          onChange={onPeriodChange}
        />
      </div>
    </div>
  );
};
