import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { incomeApiService } from '@/features/income/services/incomeApiService';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Table } from '@/shared/components/data/Table';
import { buildBudgetDrillThroughSearchParams } from '@/shared/utils/budgetDrillThrough';
import {
  getEnumParam,
  getMultiValueParam,
  setMultiValueParam,
  setStringParam,
} from '@/shared/utils/searchParams';

import { extractNumericId } from '../services/budgetAdapters';

export interface BudgetViewHandle {
  openAddBudgetModal: () => void;
}

interface BudgetViewProps {
  planningYear: number;
  spendBasis: SpendBasis;
}

export const BudgetView = React.forwardRef<BudgetViewHandle, BudgetViewProps>(
  ({ planningYear, spendBasis }, ref) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const expenseTypeFilter = getEnumParam<ExpenseTypeFilter>(
      searchParams,
      'type',
      ['ESSENTIAL', 'FUNSIES', 'ALL'],
      'ALL',
    );
    const expenseCategoryFilter = getMultiValueParam(searchParams, 'category');
    const updateQueryParams = React.useCallback(
      (
        updates: Partial<{
          type: ExpenseTypeFilter;
          category: string[];
        }>,
      ) => {
        const nextSearchParams = new URLSearchParams(searchParams);

        if (updates.type) {
          setStringParam(nextSearchParams, 'type', updates.type);
        }

        if (updates.category) {
          setMultiValueParam(nextSearchParams, 'category', updates.category);
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
    const [plannedAnnualNetIncome, setPlannedAnnualNetIncome] = useState(0);

    const normalizeAccrual = true;

    const {
      budgetEntries,
      isLoading: isLoadingBudgets,
      error,
      refetchSpending,
      upsertBudgetEntry,
      removeBudgetEntry,
      spendBasisLabel,
      spendBasisHelpText,
    } = useBudgetData(planningYear, spendBasis, normalizeAccrual);

    React.useEffect(() => {
      const loadPlannedIncome = async () => {
        try {
          const projection =
            await incomeApiService.getYearProjection(planningYear);
          setPlannedAnnualNetIncome(projection.totals.plannedNet);
        } catch (err) {
          console.error('Failed to load planned income projection:', err);
          setPlannedAnnualNetIncome(0);
        }
      };

      void loadPlannedIncome();
    }, [planningYear]);

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
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange,
        );
    }, [refetchSpending]);

    const budgetData = useBudgetFiltering(
      budgetEntries,
      expenseTypeFilter,
      expenseCategoryFilter,
    );
    const isBudgetFiltered =
      expenseTypeFilter !== 'ALL' || expenseCategoryFilter.length > 0;
    const totals = useBudgetCalculations(budgetData);
    const overallTotals = useBudgetCalculations(budgetEntries);

    const operations = useBudgetOperations(budgetEntries, {
      upsertBudgetEntry,
      removeBudgetEntry,
    });
    const customOptions = useCustomOptions();

    const income = plannedAnnualNetIncome / 12;

    const investments = budgetEntries
      .filter((entry) => isInvestmentCategory(entry.expenseCategory))
      .reduce((sum, entry) => sum + entry.budgeted, 0);

    const savings = income - overallTotals.budgeted;

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

    const handleViewSpendingClick = (item: BudgetEntry) => {
      const nextSearchParams = buildBudgetDrillThroughSearchParams({
        baseSearchParams: searchParams,
        planningYear,
        spendBasis,
        budgetId: extractNumericId(item.id),
      });

      navigate({
        pathname: '/spending',
        search: `?${nextSearchParams.toString()}`,
      });
    };

    const columns = getBudgetTableColumns({
      handleEdit: handleEditClick,
      handleToggleAccrual: operations.handleToggleAccrual,
      handleDelete: handleDeleteClick,
      handleViewSpending: handleViewSpendingClick,
    });

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
          totalBudgeted={overallTotals.budgeted}
          investments={investments}
          income={income}
          savings={savings}
          isBudgetFiltered={isBudgetFiltered}
          planningYear={planningYear}
          spendBasis={spendBasis}
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
            </div>
            <p className="pt-3 text-sm text-muted">
              {spendBasisLabel}: {spendBasisHelpText}
            </p>
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
  },
);

BudgetView.displayName = 'BudgetView';
