/**
 * Collapsible deductions section
 */

import React from 'react';
import { LuChevronDown, LuChevronUp } from 'react-icons/lu';

import { formatCurrency } from '@/shared/utils/currency';

import { DEDUCTION_FIELDS } from '../../constants/incomeConfig';
import type { Deductions } from '../../types/income';

interface DeductionsSectionProps {
  deductions: Record<keyof Deductions, string>;
  onDeductionChange: (key: keyof Deductions, value: string) => void;
  totalDeductions: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const INPUT_BASE_CLASS =
  'w-full px-4 py-3 text-base border border-gray-200 rounded-lg bg-gray-50 text-gray-900 transition-colors';
const INPUT_FOCUS_CLASS =
  'focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';
const LABEL_CLASS = 'block text-xs font-medium text-gray-600 mb-2';

export const DeductionsSection: React.FC<DeductionsSectionProps> = ({
  deductions,
  onDeductionChange,
  totalDeductions,
  isExpanded,
  onToggle,
}) => {
  const hasDeductions = totalDeductions > 0;

  return (
    <div className="space-y-4 border-t border-gray-100 pt-8">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        Deductions (Optional)
      </h3>

      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-left"
      >
        <span className="text-sm font-medium text-gray-700">
          {hasDeductions ? '- Deductions' : '+ Add Deductions'}
        </span>
        {isExpanded ? (
          <LuChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <LuChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="grid grid-cols-2 gap-3">
            {DEDUCTION_FIELDS.map((field) => (
              <div key={field.key}>
                <label className={LABEL_CLASS}>{field.label}</label>
                <input
                  type="number"
                  step="0.01"
                  value={deductions[field.key as keyof Deductions]}
                  onChange={(e) =>
                    onDeductionChange(
                      field.key as keyof Deductions,
                      e.target.value,
                    )
                  }
                  placeholder="0.00"
                  className={`${INPUT_BASE_CLASS} ${INPUT_FOCUS_CLASS}`}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between border-t border-blue-200 pt-3">
            <span className="text-sm font-medium text-gray-700">
              Total Deductions:
            </span>
            <span className="text-sm font-bold text-blue-600">
              {formatCurrency(totalDeductions, '$')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
