import React, { useMemo } from 'react';
import { LuX } from 'react-icons/lu';

import { MONTHS } from '@/features/spending/constants/spendingConfig';
import type { SpendingFilters as SpendingFiltersType } from '@/features/spending/types/spendingView';
import { Input } from '@/shared/components/Input';
import { MultiSelectDropdown } from '@/shared/components/MultiSelectDropdown';

import { FilterDropdownMenu } from './FilterDropdownMenu';

interface SpendingFiltersProps {
  filters: SpendingFiltersType;
  onFiltersChange: (updates: Partial<SpendingFiltersType>) => void;
  availableYears: { value: string; label: string }[];
  availableAccounts: string[];
  availableBudgetItems: string[];
  drillThroughBudgetLabel?: string;
}

export const SpendingFilters: React.FC<SpendingFiltersProps> = ({
  filters,
  onFiltersChange,
  availableYears,
  availableAccounts,
  availableBudgetItems,
  drillThroughBudgetLabel,
}) => {
  const hasDrillThroughBudgetFilter = filters.budgetId !== undefined;
  const drillThroughChipLabel = hasDrillThroughBudgetFilter
    ? `Budget Item: ${drillThroughBudgetLabel ?? `Budget #${filters.budgetId}`}`
    : undefined;

  const hasActiveFilters = useMemo(() => {
    return (
      filters.year.length > 0 ||
      filters.month.length > 0 ||
      filters.accounts.length > 0 ||
      filters.budgetCategories.length > 0 ||
      hasDrillThroughBudgetFilter ||
      filters.accrualStatus.length > 0 ||
      filters.amountMin !== undefined ||
      filters.amountMax !== undefined ||
      filters.forceEmpty === true ||
      filters.searchQuery !== ''
    );
  }, [filters, hasDrillThroughBudgetFilter]);

  const activeFilterChips = useMemo((): Array<{ key: string; label: string }> => {
    const chips: Array<{ key: string; label: string }> = [];

    if (filters.searchQuery !== '') {
      chips.push({
        key: 'searchQuery',
        label: `Search: "${filters.searchQuery}"`,
      });
    }

    if (filters.year.length > 0) {
      chips.push({ key: 'year', label: `Year: ${filters.year.join(', ')}` });
    }

    if (filters.month.length > 0) {
      const monthNames = filters.month
        .map((m) => MONTHS.find((month) => month.value === m)?.label)
        .filter(Boolean)
        .join(', ');
      chips.push({ key: 'month', label: `Month: ${monthNames}` });
    }

    if (filters.accounts.length > 0) {
      chips.push({
        key: 'accounts',
        label: `Account: ${filters.accounts.join(', ')}`,
      });
    }

    if (filters.budgetCategories.length > 0) {
      chips.push({
        key: 'budgetCategories',
        label: `Budget Item: ${filters.budgetCategories.join(', ')}`,
      });
    }

    if (drillThroughChipLabel) {
      chips.push({
        key: 'budgetId',
        label: drillThroughChipLabel,
      });
    }

    if (filters.accrualStatus.length > 0) {
      const statusLabels = filters.accrualStatus
        .map((status) => (status === 'YES' ? 'Spread' : 'Not spread'))
        .join(', ');
      chips.push({
        key: 'accrualStatus',
        label: `Payment Spread: ${statusLabels}`,
      });
    }

    if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
      let amountLabel = 'Amount: ';
      if (filters.amountMin !== undefined && filters.amountMax !== undefined) {
        amountLabel += `$${filters.amountMin}-$${filters.amountMax}`;
      } else if (filters.amountMin !== undefined) {
        amountLabel += `≥$${filters.amountMin}`;
      } else if (filters.amountMax !== undefined) {
        amountLabel += `≤$${filters.amountMax}`;
      }
      chips.push({
        key: 'amount',
        label: amountLabel,
      });
    }

    return chips;
  }, [drillThroughChipLabel, filters]);

  const handleRemoveFilter = (filterKey: string) => {
    const updates: Partial<SpendingFiltersType> = {};

    switch (filterKey) {
      case 'searchQuery':
        updates.searchQuery = '';
        break;
      case 'year':
        updates.year = [];
        break;
      case 'month':
        updates.month = [];
        break;
      case 'accounts':
        updates.accounts = [];
        break;
      case 'budgetCategories':
        updates.budgetCategories = [];
        break;
      case 'budgetId':
        updates.budgetId = undefined;
        updates.forceEmpty = false;
        break;
      case 'accrualStatus':
        updates.accrualStatus = [];
        break;
      case 'amount':
        updates.amountMin = undefined;
        updates.amountMax = undefined;
        break;
    }

    onFiltersChange(updates);
  };

  return (
    <div className="space-y-4">
      {/* Main filter bar - refined minimal design */}
      <div className="flex items-stretch gap-2.5">
        {/* Left side: Primary filters */}
        <div className="flex items-stretch gap-2.5">
          {/* Account Filter */}
          <div className="w-60">
            <MultiSelectDropdown
              label="Account"
              selectedValues={filters.accounts}
              onChange={(values) => onFiltersChange({ accounts: values })}
              options={availableAccounts}
              placeholder="All Accounts"
            />
          </div>

          {/* Budget Item Filter */}
          <div className="w-60">
            <MultiSelectDropdown
              label="Budget Item"
              selectedValues={filters.budgetCategories}
              onChange={(values) =>
                onFiltersChange({ budgetCategories: values })
              }
              options={availableBudgetItems}
              placeholder="All Budget Items"
              searchPlaceholder="Filter budget items..."
            />
          </div>
        </div>

        {/* Center: More Filters Dropdown */}
        <FilterDropdownMenu
          filters={filters}
          onFiltersChange={onFiltersChange}
          availableYears={availableYears}
        />

        {/* Right side: Search bar */}
        <div className="w-56">
          <Input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ searchQuery: e.target.value })}
            placeholder="Search..."
            className="rounded-full px-4 py-2.5 text-sm font-medium"
          />
        </div>
      </div>

      {/* Active filter chips - refined chip design */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2.5 items-center">
          {activeFilterChips.map((chip) => (
            <div
              key={chip.key}
              className="filter-chip group"
            >
              <span className="truncate max-w-xs">{chip.label}</span>
              <button
                onClick={() => handleRemoveFilter(chip.key)}
                className="filter-chip-dismiss flex-shrink-0 opacity-60 group-hover:opacity-100"
                aria-label={`Remove ${chip.label} filter`}
              >
                <LuX size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
