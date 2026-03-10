import React, { useState, useRef, useEffect } from 'react';
import { LuSlidersHorizontal, LuChevronDown } from 'react-icons/lu';

import {
  MONTHS,
  ACCRUAL_STATUS_OPTIONS,
} from '@/features/spending/constants/spendingConfig';
import type { SpendingFilters } from '@/features/spending/types/spendingView';
import { Input } from '@/shared/components/Input';

interface FilterDropdownMenuProps {
  filters: SpendingFilters;
  onFiltersChange: (updates: Partial<SpendingFilters>) => void;
  availableYears: { value: string; label: string }[];
}

interface FilterSection {
  id: string;
  label: string;
  component: React.ReactNode;
}

export const FilterDropdownMenu: React.FC<FilterDropdownMenuProps> = ({
  filters,
  onFiltersChange,
  availableYears,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setExpandedSection(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setExpandedSection(null);
    }
  };

  const handleSectionClick = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  // Filter out 'ALL' option from available options
  const yearOptions = availableYears.filter((y) => y.value !== 'ALL');
  const monthOptions = MONTHS.filter((m) => m.value !== 'ALL');
  const accrualOptions = ACCRUAL_STATUS_OPTIONS.filter(
    (a) => a.value !== 'ALL',
  );

  // Helper to toggle selection in array-based filters
  const handleToggleSelection = (
    currentValues: string[],
    newValue: string,
  ): string[] => {
    if (currentValues.includes(newValue)) {
      return currentValues.filter((v) => v !== newValue);
    }
    return [...currentValues, newValue];
  };

  const filterSections: FilterSection[] = [
    {
      id: 'year',
      label: 'Year',
      component: (
        <div className="space-y-1">
          {yearOptions.map((year) => {
            const isSelected = filters.year.includes(year.value);
            return (
              <label
                key={year.value}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {
                    onFiltersChange({
                      year: handleToggleSelection(filters.year, year.value),
                    });
                  }}
                  className="w-4 h-4 text-slate-900 bg-white border-slate-300 rounded focus:ring-2 focus:ring-slate-900 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                  {year.label}
                </span>
                {isSelected && (
                  <span className="ml-auto text-slate-900">✓</span>
                )}
              </label>
            );
          })}
          {filters.year.length > 0 && (
            <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onFiltersChange({ year: [] })}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => setExpandedSection(null)}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'month',
      label: 'Month',
      component: (
        <div className="space-y-1">
          {monthOptions.map((month) => {
            const isSelected = filters.month.includes(month.value);
            return (
              <label
                key={month.value}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {
                    onFiltersChange({
                      month: handleToggleSelection(filters.month, month.value),
                    });
                  }}
                  className="w-4 h-4 text-slate-900 bg-white border-slate-300 rounded focus:ring-2 focus:ring-slate-900 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                  {month.label}
                </span>
                {isSelected && (
                  <span className="ml-auto text-slate-900">✓</span>
                )}
              </label>
            );
          })}
          {filters.month.length > 0 && (
            <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onFiltersChange({ month: [] })}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => setExpandedSection(null)}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'accrual',
      label: 'Payment Spread',
      component: (
        <div className="space-y-1">
          {accrualOptions.map((option) => {
            const isSelected = filters.accrualStatus.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {
                    onFiltersChange({
                      accrualStatus: handleToggleSelection(
                        filters.accrualStatus,
                        option.value,
                      ),
                    });
                  }}
                  className="w-4 h-4 text-slate-900 bg-white border-slate-300 rounded focus:ring-2 focus:ring-slate-900 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                  {option.label}
                </span>
                {isSelected && (
                  <span className="ml-auto text-slate-900">✓</span>
                )}
              </label>
            );
          })}
          {filters.accrualStatus.length > 0 && (
            <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onFiltersChange({ accrualStatus: [] })}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => setExpandedSection(null)}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'amount',
      label: 'Amount Range',
      component: (
        <div className="space-y-3 px-1">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Minimum ($)
            </label>
            <Input
              type="number"
              placeholder="0.00"
              value={filters.amountMin?.toString() || ''}
              onChange={(e) =>
                onFiltersChange({
                  amountMin: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                })
              }
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Maximum ($)
            </label>
            <Input
              type="number"
              placeholder="∞"
              value={filters.amountMax?.toString() || ''}
              onChange={(e) =>
                onFiltersChange({
                  amountMax: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                })
              }
              className="text-sm"
            />
          </div>
        </div>
      ),
    },
  ];

  // Count active filters in this menu
  const activeFilterCount = [
    filters.year.length > 0 ? 1 : 0,
    filters.month.length > 0 ? 1 : 0,
    filters.accrualStatus.length > 0 ? 1 : 0,
    filters.amountMin !== undefined || filters.amountMax !== undefined ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="group inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all focus:outline-none focus:ring-0 focus:border-slate-300"
      >
        <LuSlidersHorizontal className="w-4 h-4 text-slate-500 group-hover:text-slate-700 transition-colors" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 bg-slate-900 text-white text-xs font-semibold rounded-full">
            {activeFilterCount}
          </span>
        )}
        <LuChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2">
            {filterSections.map((section, index) => (
              <div
                key={section.id}
                className={index !== filterSections.length - 1 ? 'mb-1' : ''}
              >
                <button
                  type="button"
                  onClick={() => handleSectionClick(section.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group"
                >
                  <span>{section.label}</span>
                  <LuChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      expandedSection === section.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedSection === section.id && (
                  <div className="mt-1 mb-2 px-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    {section.component}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
