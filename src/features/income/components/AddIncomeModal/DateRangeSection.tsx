/**
 * Date range section for AddIncomeModal
 * Handles start and end date inputs for effective date ranges
 * Only visible in modes: 'add-range' and 'edit-range'
 */

import React from 'react';

import { FormField, TextInput, SectionHeader } from './FormField';

interface DateRangeSectionProps {
  startDate: string;
  endDate: string | null;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string | null) => void;
}

export const DateRangeSection: React.FC<DateRangeSectionProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  return (
    <div className="space-y-4 border-t border-gray-100 pt-8">
      <SectionHeader>Effective Date Range</SectionHeader>

      <FormField
        label="Start Date"
        required
        hint="When this income range becomes effective"
      >
        <TextInput type="date" value={startDate} onChange={onStartDateChange} />
      </FormField>

      <FormField
        label="End Date (Optional)"
        hint="Leave blank for ongoing. When this income range ends."
      >
        <TextInput
          type="date"
          value={endDate || ''}
          onChange={(value) => onEndDateChange(value || null)}
        />
      </FormField>
    </div>
  );
};
