/**
 * Component to display income type icon
 * Shows visual indicator for regular vs bonus income
 */

import React from 'react';

import { getIncomeIcon } from '../constants/incomeIcons';
import type { IncomeType, IncomeFrequency } from '../types/income';

interface IncomeTypeIconProps {
  type: IncomeType;
  frequency?: IncomeFrequency;
  className?: string;
}

export const IncomeTypeIcon: React.FC<IncomeTypeIconProps> = React.memo(
  ({ type, frequency, className = 'w-4 h-4' }) => {
    const { icon: Icon, color, label } = getIncomeIcon(type, frequency);

    return (
      <Icon
        className={`${className} ${color}`}
        title={label}
        aria-label={label}
      />
    );
  },
);
