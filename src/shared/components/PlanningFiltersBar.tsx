import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LuChevronDown } from 'react-icons/lu';

import type { SpendBasis } from '@/features/budget/types/budgetView';
import { buildPlanningFilterOptions } from '@/shared/utils/planningFilters';
import { getAvailableSpendBasisOptions } from '@/shared/utils/spendBasis';

import { CustomDropdown } from './CustomDropdown';
import { PlanningYearDropdown } from './PlanningYearDropdown';

interface PlanningFiltersBarProps {
  planningYear: number;
  availableYears: number[];
  onPlanningYearChange: (year: number) => void;
  spendBasis: SpendBasis;
  onSpendBasisChange: (spendBasis: SpendBasis) => void;
  onPlanningFiltersChange?: (params: {
    planningYear: number;
    spendBasis: SpendBasis;
  }) => void;
  showPlanningYear: boolean;
  showSpendBasis: boolean;
}

const DEFAULT_VISIBLE_COMBINED_OPTIONS = 4;

interface CombinedPlanningFilterProps {
  planningYear: number;
  availableYears: number[];
  spendBasis: SpendBasis;
  onChange: (params: { planningYear: number; spendBasis: SpendBasis }) => void;
}

const CombinedPlanningFilter: React.FC<CombinedPlanningFilterProps> = ({
  planningYear,
  availableYears,
  spendBasis,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const options = useMemo(
    () => buildPlanningFilterOptions({ availableYears }),
    [availableYears],
  );
  const selectedOption =
    options.find(
      (option) =>
        option.planningYear === planningYear && option.spendBasis === spendBasis,
    ) ?? options[0];
  const primaryOptions = options.slice(0, DEFAULT_VISIBLE_COMBINED_OPTIONS);
  const overflowOptions = options.slice(DEFAULT_VISIBLE_COMBINED_OPTIONS);
  const selectedIndex = selectedOption
    ? options.findIndex((option) => option.value === selectedOption.value)
    : -1;
  const selectedInOverflow = selectedIndex >= DEFAULT_VISIBLE_COMBINED_OPTIONS;

  useEffect(() => {
    if (!isOpen) {
      setShowMore(false);
      return;
    }

    if (selectedInOverflow) {
      setShowMore(true);
    }
  }, [isOpen, selectedInOverflow]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!selectedOption) {
    return null;
  }

  const renderOption = (option: (typeof options)[number]) => {
    const isSelected = option.value === selectedOption.value;

    return (
      <button
        key={option.value}
        type="button"
        onClick={() => {
          onChange({
            planningYear: option.planningYear,
            spendBasis: option.spendBasis,
          });
          setIsOpen(false);
        }}
        className={`dropdown-option flex w-full items-center justify-between gap-3 ${
          isSelected ? 'dropdown-option-active font-medium' : ''
        }`}
      >
        <span className="font-semibold tabular-nums">{option.planningYear}</span>
        <span className="truncate text-sm text-muted">{option.basisLabel}</span>
      </button>
    );
  };

  return (
    <div ref={dropdownRef} className="relative min-w-[280px]">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="dropdown-trigger px-4 py-3"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex w-full items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="truncate">Plan:</span>
            <span className="truncate px-1.5 font-semibold">
              {selectedOption.label}
            </span>
          </span>
          <LuChevronDown
            className={`dropdown-icon h-4 w-4 flex-shrink-0 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {isOpen ? (
        <div className="dropdown-panel absolute right-0 z-50 mt-1 w-full animate-in overflow-hidden fade-in slide-in-from-top-2 duration-200">
          <div className="p-2">
            <div className="space-y-1">{primaryOptions.map(renderOption)}</div>

            {overflowOptions.length > 0 ? (
              <div className="mt-2 border-t border-app pt-2">
                <button
                  type="button"
                  onClick={() => setShowMore((current) => !current)}
                  className="dropdown-option w-full text-center text-sm font-medium text-brand"
                >
                  {showMore
                    ? 'Show less'
                    : `Show ${overflowOptions.length} more`}
                </button>
              </div>
            ) : null}

            {showMore ? (
              <div className="mt-2 space-y-1">
                {overflowOptions.map(renderOption)}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export const PlanningFiltersBar: React.FC<PlanningFiltersBarProps> = ({
  planningYear,
  availableYears,
  onPlanningYearChange,
  spendBasis,
  onSpendBasisChange,
  onPlanningFiltersChange,
  showPlanningYear,
  showSpendBasis,
}) => {
  if (!showPlanningYear && !showSpendBasis) {
    return null;
  }

  const spendBasisOptions = getAvailableSpendBasisOptions(planningYear);
  const showCombinedFilter =
    showPlanningYear && showSpendBasis && onPlanningFiltersChange;

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {showCombinedFilter ? (
        <CombinedPlanningFilter
          planningYear={planningYear}
          availableYears={availableYears}
          spendBasis={spendBasis}
          onChange={onPlanningFiltersChange}
        />
      ) : null}

      {showPlanningYear && !showCombinedFilter ? (
        <PlanningYearDropdown
          year={planningYear}
          years={availableYears}
          onYearChange={onPlanningYearChange}
          className="min-w-[216px]"
        />
      ) : null}

      {showSpendBasis && !showCombinedFilter ? (
        <CustomDropdown
          value={spendBasis}
          options={spendBasisOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          onChange={(value) => onSpendBasisChange(value as SpendBasis)}
          labelPrefix="Spending basis"
          className="min-w-[240px]"
          triggerClassName="pl-4"
        />
      ) : null}
    </div>
  );
};
