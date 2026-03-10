import React from 'react';

import type {
  BudgetPeriod,
  ExpenseTypeFilter,
} from '@/features/budget/types/budgetView';
import { MultiSelectDropdown } from '@/shared/components/MultiSelectDropdown';
import { ToggleButtonGroup } from '@/shared/components/ToggleButtonGroup';

interface BudgetPeriodSelectorProps {
  budgetPeriod: BudgetPeriod;
  onPeriodChange: (period: BudgetPeriod) => void;
}

export const BudgetPeriodSelector: React.FC<BudgetPeriodSelectorProps> = ({
  budgetPeriod,
  onPeriodChange,
}) => (
  <ToggleButtonGroup
    value={budgetPeriod}
    options={[
      { value: 'monthly', label: 'Monthly' },
      { value: 'annual', label: 'Annual' },
    ]}
    onChange={onPeriodChange}
  />
);

interface ExpenseTypeFiltersProps {
  expenseTypeFilter: ExpenseTypeFilter;
  onFilterChange: (filter: ExpenseTypeFilter) => void;
  expenseCategoryFilter: string[];
  onCategoryChange: (categories: string[]) => void;
  availableCategories?: string[];
}

export const ExpenseTypeFilters: React.FC<ExpenseTypeFiltersProps> = ({
  expenseTypeFilter,
  onFilterChange,
  expenseCategoryFilter,
  onCategoryChange,
  availableCategories = [],
}) => (
  <div className="flex items-center gap-3">
    {/* Expense Type Filter */}
    <ToggleButtonGroup
      value={expenseTypeFilter}
      options={[
        { value: 'ESSENTIAL', label: 'Essential' },
        { value: 'FUNSIES', label: 'Funsies' },
        { value: 'ALL', label: 'All' },
      ]}
      onChange={onFilterChange}
    />

    {/* Category Filter Dropdown - matches spending page style */}
    <div className="w-70">
      <MultiSelectDropdown
        label="Expense Category"
        selectedValues={expenseCategoryFilter}
        onChange={onCategoryChange}
        options={availableCategories}
        placeholder="All Categories"
      />
    </div>
  </div>
);
