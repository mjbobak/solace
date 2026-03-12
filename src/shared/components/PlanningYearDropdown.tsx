import React from 'react';

import { CustomDropdown } from './CustomDropdown';
import type { DropdownOption } from './CustomDropdown';

interface PlanningYearDropdownProps {
  year: number;
  onYearChange: (year: number) => void;
  years: number[];
  className?: string;
  labelPrefix?: string;
}

function toYearOptions(years: number[]): DropdownOption[] {
  return years.map((optionYear) => ({
    value: String(optionYear),
    label: String(optionYear),
  }));
}

export const PlanningYearDropdown: React.FC<PlanningYearDropdownProps> = ({
  year,
  onYearChange,
  years,
  className = '',
  labelPrefix = 'Planning year',
}) => {
  return (
    <div className={className}>
      <CustomDropdown
        value={String(year)}
        options={toYearOptions(years)}
        onChange={(value) => onYearChange(Number(value))}
        labelPrefix={labelPrefix}
        triggerClassName="pl-7"
      />
    </div>
  );
};
