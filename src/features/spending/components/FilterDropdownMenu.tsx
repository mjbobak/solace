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
                className="dropdown-check-option group"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {
                    onFiltersChange({
                      year: handleToggleSelection(filters.year, year.value),
                    });
                  }}
                  className="checkbox-input"
                />
                <span className="text-app text-sm transition-colors">
                  {year.label}
                </span>
                {isSelected && <span className="ml-auto text-brand">✓</span>}
              </label>
            );
          })}
          {filters.year.length > 0 && (
            <div className="mt-2 flex gap-2 border-t section-divider pt-2">
              <button
                type="button"
                onClick={() => onFiltersChange({ year: [] })}
                className="dropdown-action-secondary flex-1"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => setExpandedSection(null)}
                className="dropdown-action-primary flex-1"
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
                className="dropdown-check-option group"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {
                    onFiltersChange({
                      month: handleToggleSelection(filters.month, month.value),
                    });
                  }}
                  className="checkbox-input"
                />
                <span className="text-app text-sm transition-colors">
                  {month.label}
                </span>
                {isSelected && <span className="ml-auto text-brand">✓</span>}
              </label>
            );
          })}
          {filters.month.length > 0 && (
            <div className="mt-2 flex gap-2 border-t section-divider pt-2">
              <button
                type="button"
                onClick={() => onFiltersChange({ month: [] })}
                className="dropdown-action-secondary flex-1"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => setExpandedSection(null)}
                className="dropdown-action-primary flex-1"
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
                className="dropdown-check-option group"
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
                  className="checkbox-input"
                />
                <span className="text-app text-sm transition-colors">
                  {option.label}
                </span>
                {isSelected && <span className="ml-auto text-brand">✓</span>}
              </label>
            );
          })}
          {filters.accrualStatus.length > 0 && (
            <div className="mt-2 flex gap-2 border-t section-divider pt-2">
              <button
                type="button"
                onClick={() => onFiltersChange({ accrualStatus: [] })}
                className="dropdown-action-secondary flex-1"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => setExpandedSection(null)}
                className="dropdown-action-primary flex-1"
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
            <label className="dropdown-label mb-1.5 block">
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
            <label className="dropdown-label mb-1.5 block">
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
      <button
        type="button"
        onClick={handleToggle}
        className="dropdown-trigger group inline-flex w-auto items-center gap-2"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <LuSlidersHorizontal className="dropdown-icon h-4 w-4 transition-colors" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="status-chip status-chip-brand min-h-[18px] min-w-[18px] justify-center rounded-full px-1.5 py-0 text-[11px]">
            {activeFilterCount}
          </span>
        )}
        <LuChevronDown
          className={`dropdown-icon h-4 w-4 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="dropdown-panel absolute left-0 top-full z-50 mt-2 w-72 animate-in overflow-hidden fade-in slide-in-from-top-2 duration-200">
          <div className="p-2">
            {filterSections.map((section, index) => (
              <div
                key={section.id}
                className={index !== filterSections.length - 1 ? 'mb-1' : ''}
              >
                <button
                  type="button"
                  onClick={() => handleSectionClick(section.id)}
                  className="dropdown-option flex w-full items-center justify-between font-medium"
                >
                  <span>{section.label}</span>
                  <LuChevronDown
                    className={`dropdown-icon h-4 w-4 transition-transform ${
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
