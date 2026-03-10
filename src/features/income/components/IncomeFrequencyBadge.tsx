/**
 * Component to display income frequency as a badge
 * Shows visual indicator for bonus vs regular income frequency
 */

import React from 'react';

import type { IncomeType, IncomeFrequency } from '../types/income';

interface IncomeFrequencyBadgeProps {
  type: IncomeType;
  frequency?: IncomeFrequency;
}

export const IncomeFrequencyBadge: React.FC<IncomeFrequencyBadgeProps> =
  React.memo(({ type }) => {
    if (type === 'regular') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium leading-none bg-green-100 text-green-800">
          Regular Income
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium leading-none bg-blue-100 text-blue-800">
        Bonus
      </span>
    );
  });
