import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { ExpenseTypeFilters } from '@/features/budget/components/BudgetFilters';
import { BudgetItemModal } from '@/features/budget/components/BudgetItemModal';
import { BudgetSummary } from '@/features/budget/components/BudgetSummary';
import { getBudgetTableColumns } from '@/features/budget/components/budgetTableColumns';
import { useBudgetCalculations } from '@/features/budget/hooks/useBudgetCalculations';
import { useBudgetData } from '@/features/budget/hooks/useBudgetData';
import { useBudgetFiltering } from '@/features/budget/hooks/useBudgetFiltering';
import { useBudgetOperations } from '@/features/budget/hooks/useBudgetOperations';
import { useCustomOptions } from '@/features/budget/hooks/useCustomOptions';
import type {
  ExpenseTypeFilter,
  BudgetEntry,
  SpendBasis,
} from '@/features/budget/types/budgetView';
import { isInvestmentCategory } from '@/features/budget/utils/investmentCategories';
import { spendingService } from '@/features/spending/services/spendingService';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Table } from '@/shared/components/data/Table';
import { MultiSelectDropdown } from '@/shared/components/MultiSelectDropdown';
import { Tooltip } from '@/shared/components/Tooltip';
import {
  getEnumParam,
  getMultiValueParam,
  getNumberParam,
  setMultiValueParam,
  setNumberParam,
  setStringParam,
} from '@/shared/utils/searchParams';
import { getYearFromDateOnly } from '@/shared/utils/dateOnly';

const ANNUAL_NET_INCOME = 200000;
const SPEND_BASIS_OPTIONS: ReadonlyArray<{
  value: SpendBasis;
  label: string;
}> = [
  { value: 'annual_full_year', label: 'Annual' },
  {
    value: 'monthly_avg_elapsed',
    label: 'Monthly - Completed Months',
  },
  {
    value: 'monthly_current_month',
    label: 'Monthly - Current Month',
  },
];

function getLastSelected(values: string[]): string | null {
  if (values.length === 0) return null;
  return values[values.length - 1];
}

export interface BudgetViewHandle {
  openAddBudgetModal: () => void;
}

export const BudgetView = React.forwardRef<BudgetViewHandle>((_, ref) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const expenseTypeFilter = getEnumParam<ExpenseTypeFilter>(
    searchParams,
    'type',
    ['ESSENTIAL', 'FUNSIES', 'ALL'],
    'ALL',
  );
  const expenseCategoryFilter = getMultiValueParam(searchParams, 'category');
  const currentYear = new Date().getFullYear();
  const selectedYear = getNumberParam(searchParams, 'year') ?? currentYear;
  const spendBasis = getEnumParam<SpendBasis>(
    searchParams,
    'basis',
    ['annual_full_year', 'monthly_avg_elapsed', 'monthly_avg_12', 'monthly_current_month'],
    'monthly_avg_elapsed',
  );
  const updateQueryParams = React.useCallback(
    (
      updates: Partial<{
        type: ExpenseTypeFilter;
        category: string[];
        year: number;
        basis: SpendBasis;
      }>,
    ) => {
      const nextSearchParams = new URLSearchParams(searchParams);

      if (updates.type) {
        setStringParam(nextSearchParams, 'type', updates.type);
      }

      if (updates.category) {
        setMultiValueParam(nextSearchParams, 'category', updates.category);
      }

      if (updates.year !== undefined) {
        setNumberParam(nextSearchParams, 'year', updates.year);
      }

      if (updates.basis) {
        setStringParam(nextSearchParams, 'basis', updates.basis);
      }

      setSearchParams(nextSearchParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetEntry | undefined>(
    undefined,
  );

  const [normalizeAccrual] = useState<boolean>(true);
  const [yearOptions, setYearOptions] = useState<string[]>([
    String(currentYear),
  ]);

  const {
    budgetEntries,
    isLoading: isLoadingBudgets,
    error,
    refetchSpending,
    upsertBudgetEntry,
    removeBudgetEntry,
    spendBasisLabel,
    spendBasisHelpText,
  } = useBudgetData(selectedYear, spendBasis, normalizeAccrual);

  React.useEffect(() => {
    const loadYearOptions = async () => {
      try {
        const transactions = await spendingService.getAllTransactions({
          fetchAll: true,
        });

        const years = new Set<number>();
        transactions.forEach((transaction) => {
          years.add(getYearFromDateOnly(transaction.transactionDate));
        });
        years.add(currentYear);

        const options = Array.from(years)
          .sort((a, b) => b - a)
          .map((year) => String(year));

        setYearOptions(options);
      } catch (err) {
        console.error('Failed to load year options:', err);
        setYearOptions([String(currentYear)]);
      }
    };

    loadYearOptions();
  }, [currentYear]);

  React.useEffect(() => {
    if (error) {
      toast.error(`Failed to load data: ${error}`);
      console.error('Data loading error:', error);
    }
  }, [error]);

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetchSpending();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetchSpending]);

  const budgetData = useBudgetFiltering(
    budgetEntries,
    expenseTypeFilter,
    expenseCategoryFilter,
  );
  const totals = useBudgetCalculations(budgetData);
  const overallTotals = useBudgetCalculations(budgetEntries);

  const operations = useBudgetOperations(budgetEntries, {
    upsertBudgetEntry,
    removeBudgetEntry,
  });
  const customOptions = useCustomOptions();

  const income = ANNUAL_NET_INCOME / 12;

  const investments = budgetEntries
    .filter((entry) => isInvestmentCategory(entry.expenseCategory))
    .reduce((sum, entry) => sum + entry.budgeted, 0);

  const savings = income - overallTotals.budgeted;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  const handleAddClick = () => {
    setEditingItem(undefined);
    setIsModalOpen(true);
  };

  React.useImperativeHandle(
    ref,
    () => ({
      openAddBudgetModal: handleAddClick,
    }),
    [],
  );

  const handleEditClick = (item: BudgetEntry) => {
    const originalItem = budgetEntries.find((entry) => entry.id === item.id);
    setEditingItem(originalItem);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(undefined);
  };

  const handleModalSave = (
    itemData: Omit<BudgetEntry, 'id' | 'spent' | 'remaining' | 'percentage'>,
  ) => {
    if (editingItem) {
      operations.handleUpdate(editingItem.id, itemData);
    } else {
      operations.handleSave(itemData);
    }
    handleModalClose();
  };

  const handleDeleteClick = (id: string) => {
    setDeletingItemId(id);
  };

  const handleDeleteConfirm = () => {
    if (deletingItemId) {
      operations.handleDelete(deletingItemId);
      setDeletingItemId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeletingItemId(null);
  };

  const columns = getBudgetTableColumns({
    handleEdit: handleEditClick,
    handleToggleAccrual: operations.handleToggleAccrual,
    handleDelete: handleDeleteClick,
  });

  const spendBasisTooltipContent = `${spendBasisLabel}: ${spendBasisHelpText}`;
  const spendBasisOptions = SPEND_BASIS_OPTIONS.map((option) => option.label);
  const selectedSpendBasisLabel =
    SPEND_BASIS_OPTIONS.find((option) => option.value === spendBasis)?.label ??
    SPEND_BASIS_OPTIONS[0].label;

  const handleYearChange = (values: string[]) => {
    const next = getLastSelected(values);
    if (!next) return;

    const parsedYear = parseInt(next, 10);
    if (!Number.isNaN(parsedYear)) {
      updateQueryParams({ year: parsedYear });
    }
  };

  const handleSpendBasisChange = (values: string[]) => {
    const nextLabel = getLastSelected(values);
    if (!nextLabel) return;

    const nextOption = SPEND_BASIS_OPTIONS.find(
      (option) => option.label === nextLabel,
    );
    if (nextOption) {
      updateQueryParams({ basis: nextOption.value });
    }
  };

  if (isLoadingBudgets) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted">Loading budgets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <BudgetSummary
        totals={totals}
        investments={investments}
        income={income}
        savings={savings}
        savingsRate={savingsRate}
      />

      <div className="surface-card">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <ExpenseTypeFilters
              expenseTypeFilter={expenseTypeFilter}
              onFilterChange={(filter) => updateQueryParams({ type: filter })}
              expenseCategoryFilter={expenseCategoryFilter}
              onCategoryChange={(categories) =>
                updateQueryParams({ category: categories })
              }
              availableCategories={customOptions.categories.map(
                (cat) => cat.name,
              )}
            />
            <div className="w-32">
              <MultiSelectDropdown
                label="Year"
                options={yearOptions}
                selectedValues={[String(selectedYear)]}
                onChange={handleYearChange}
                placeholder="Select year"
                showCheckboxes={false}
              />
            </div>
          </div>

          <div className="ml-auto shrink-0">
            <Tooltip content={spendBasisTooltipContent}>
              <MultiSelectDropdown
                label="Spend Basis"
                options={spendBasisOptions}
                selectedValues={[selectedSpendBasisLabel]}
                onChange={handleSpendBasisChange}
                placeholder="Select spend basis"
                className="inline-block w-auto min-w-[22rem]"
                menuAlign="right"
                showCheckboxes={false}
              />
            </Tooltip>
          </div>
        </div>

        <Table
          columns={columns}
          data={budgetData}
          rowKey={(row) => row.id}
          emptyMessage="No budget entries found"
        />
      </div>

      <BudgetItemModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        item={editingItem}
        expenseTypes={customOptions.getAllExpenseTypeOptions()}
        expenseCategories={customOptions.categories.map((cat) => cat.name)}
        onAddCustomCategory={customOptions.addCategory}
      />

      <ConfirmDialog
        isOpen={deletingItemId !== null}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Budget Item"
        message={
          <>
            Are you sure you want to delete{' '}
            <strong>
              {budgetEntries.find((e) => e.id === deletingItemId)
                ?.expenseLabel || 'this item'}
            </strong>
            ? This action cannot be undone.
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
});

BudgetView.displayName = 'BudgetView';
