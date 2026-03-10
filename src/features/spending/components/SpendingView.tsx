import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { budgetService } from '@/features/budget/services/budgetService';
import type { BudgetApiResponse } from '@/features/budget/types/budgetApi';
import { generateYearOptions } from '@/features/spending/constants/spendingConfig';
import { useBulkSpendingOperations } from '@/features/spending/hooks/useBulkSpendingOperations';
import { useSpendingFiltering } from '@/features/spending/hooks/useSpendingFiltering';
import { useSpendingOperations } from '@/features/spending/hooks/useSpendingOperations';
import { spendingService } from '@/features/spending/services/spendingService';
import type {
  SpendingEntry,
  SpendingFilters as SpendingFiltersType,
} from '@/features/spending/types/spendingView';
import { hasSpreadPayment } from '@/features/spending/utils/spreadPayments';
import { BulkActionBar } from '@/shared/components/BulkActionBar';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Table } from '@/shared/components/data/Table';
import type { SortState } from '@/shared/components/data/Table';
import { Pagination } from '@/shared/components/Pagination';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useTableSelection } from '@/shared/hooks/useTableSelection';
import {
  getMultiValueParam,
  getNumberParam,
  getStringParam,
  setMultiValueParam,
  setNumberParam,
  setStringParam,
} from '@/shared/utils/searchParams';

import { AddTransactionModal } from './AddTransactionModal';
import { BulkAccountDropdown } from './BulkAccountDropdown';
import { BulkBudgetDropdown } from './BulkBudgetDropdown';
import { BulkSaveConfirm } from './BulkConfirmDialogs';
import { SpendingFilters } from './SpendingFilters';
import { getSpendingTableColumns } from './spendingTableColumns';
import { SpreadPaymentModal } from './SpreadPaymentModal';

interface PendingBulkOperation {
  type: 'delete' | 'category' | 'account' | 'spread';
  value?: string | { id: number; label: string; category: string };
}

interface SpreadEditorState {
  transaction: SpendingEntry;
  anchorElement: HTMLButtonElement;
}

interface DisplayMonthContext {
  year: number;
  month: number;
  label: string;
}

function getDisplayMonthContext(
  filters: SpendingFiltersType,
): DisplayMonthContext | null {
  if (filters.year.length !== 1 || filters.month.length !== 1) {
    return null;
  }

  const year = parseInt(filters.year[0], 10);
  const month = parseInt(filters.month[0], 10);

  return {
    year,
    month,
    label: new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    }),
  };
}

function sortTransactions(
  data: SpendingEntry[],
  columns: ReturnType<typeof getSpendingTableColumns>,
  sortState: SortState,
): SpendingEntry[] {
  if (!sortState.column || !sortState.direction) {
    return data;
  }

  const column = columns.find((candidate) => candidate.key === sortState.column);
  if (!column?.sortValue) {
    return data;
  }

  return [...data].sort((left, right) => {
    const leftValue = String(column.sortValue?.(left) ?? '');
    const rightValue = String(column.sortValue?.(right) ?? '');
    const comparison = leftValue.localeCompare(rightValue, undefined, {
      numeric: true,
      sensitivity: 'base',
    });

    return sortState.direction === 'asc' ? comparison : -comparison;
  });
}

export interface SpendingViewHandle {
  openAddTransactionModal: () => void;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;
const SORT_DIRECTIONS = ['asc', 'desc'] as const;

export const SpendingView = React.forwardRef<SpendingViewHandle>((_, ref) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo<SpendingFiltersType>(
    () => ({
      year: getMultiValueParam(searchParams, 'year'),
      month: getMultiValueParam(searchParams, 'month'),
      accounts: getMultiValueParam(searchParams, 'account'),
      budgetCategories: getMultiValueParam(searchParams, 'budget'),
      accrualStatus: getMultiValueParam(searchParams, 'accrual'),
      amountMin: getNumberParam(searchParams, 'min'),
      amountMax: getNumberParam(searchParams, 'max'),
      searchQuery: getStringParam(searchParams, 'q') ?? '',
    }),
    [searchParams],
  );
  const [transactions, setTransactions] = useState<SpendingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<
    SpendingEntry | undefined
  >(undefined);
  const [spreadEditorState, setSpreadEditorState] =
    useState<SpreadEditorState | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [allBudgets, setAllBudgets] = useState<BudgetApiResponse[]>([]);

  // Bulk operations state
  const selection = useTableSelection<SpendingEntry>();
  const bulkOps = useBulkSpendingOperations(transactions, setTransactions);
  const [pendingOperations, setPendingOperations] = useState<
    PendingBulkOperation[]
  >([]);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Highlighting state for recently modified rows
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());

  // Initialize operations hook for CRUD operations
  const operations = useSpendingOperations(transactions, setTransactions);

  const updateQueryParams = useCallback(
    (
      updates: Partial<SpendingFiltersType> & {
        page?: number;
        pageSize?: number;
        sortColumn?: string | null;
        sortDirection?: SortState['direction'];
      },
    ) => {
      const nextSearchParams = new URLSearchParams(searchParams);
      const mergedFilters = {
        ...filters,
        ...updates,
      };

      setMultiValueParam(nextSearchParams, 'year', mergedFilters.year);
      setMultiValueParam(nextSearchParams, 'month', mergedFilters.month);
      setMultiValueParam(nextSearchParams, 'account', mergedFilters.accounts);
      setMultiValueParam(
        nextSearchParams,
        'budget',
        mergedFilters.budgetCategories,
      );
      setMultiValueParam(
        nextSearchParams,
        'accrual',
        mergedFilters.accrualStatus,
      );
      setNumberParam(nextSearchParams, 'min', mergedFilters.amountMin);
      setNumberParam(nextSearchParams, 'max', mergedFilters.amountMax);
      setStringParam(nextSearchParams, 'q', mergedFilters.searchQuery);

      if ('page' in updates) {
        setNumberParam(nextSearchParams, 'page', updates.page);
      }

      if ('pageSize' in updates) {
        setNumberParam(nextSearchParams, 'pageSize', updates.pageSize);
      }

      if ('sortColumn' in updates) {
        setStringParam(nextSearchParams, 'sort', updates.sortColumn ?? undefined);
      }

      if ('sortDirection' in updates) {
        setStringParam(
          nextSearchParams,
          'dir',
          updates.sortDirection ?? undefined,
        );
      }

      setSearchParams(nextSearchParams, { replace: true });
    },
    [filters, searchParams, setSearchParams],
  );

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [transactionData, budgetData] = await Promise.all([
          spendingService.getAllTransactions(),
          budgetService.getAllBudgets(),
        ]);
        setTransactions(transactionData);
        setAllBudgets(budgetData);
      } catch {
        toast.error('Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Debounce search query to avoid excessive re-filtering
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);

  // Update filters when debounced search changes
  const activeFilters = useMemo(
    () => ({
      ...filters,
      searchQuery: debouncedSearchQuery,
    }),
    [filters, debouncedSearchQuery],
  );

  // Filter data
  const filteredData = useSpendingFiltering(transactions, activeFilters);

  // Derive available years, accounts, and budget categories from data
  const availableYears = useMemo(
    () => generateYearOptions(transactions),
    [transactions],
  );
  const availableAccounts = useMemo(() => {
    const accounts = new Set(transactions.map((t) => t.account));
    return Array.from(accounts).sort();
  }, [transactions]);
  const availableBudgetItems = useMemo(() => {
    const budgetItems = new Set<string>();
    let hasUncategorized = false;

    for (const transaction of transactions) {
      if (transaction.budgetLabel && transaction.budgetLabel !== 'Uncategorized') {
        budgetItems.add(transaction.budgetLabel);
      } else {
        hasUncategorized = true;
      }
    }

    const result = Array.from(budgetItems).sort();
    if (hasUncategorized) {
      result.unshift('Uncategorized');
    }
    return result;
  }, [transactions]);

  // Filter handlers
  const handleFiltersChange = (updates: Partial<SpendingFiltersType>) => {
    updateQueryParams({
      ...updates,
      page: 1,
    });
  };

  // Modal handlers
  const handleEditClick = (transaction: SpendingEntry) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleSpreadEditClick = useCallback(
    (transaction: SpendingEntry, anchorElement: HTMLButtonElement) => {
      setSpreadEditorState({ transaction, anchorElement });
    },
    [],
  );

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTransaction(undefined);
  };

  const handleUpdateTransaction = async (
    id: string,
    updates: Partial<SpendingEntry>,
  ) => {
    try {
      const success = await operations.handleUpdate(id, updates);
      if (!success) {
        return;
      }

      await refreshTransactionsAndHighlight(id);
      handleModalClose();
    } catch {
      // Error already toasted by operations hook
    }
  };

  // Delete handlers
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

  // Handle add transaction
  const handleAddTransaction = useCallback(
    async (entry: Omit<SpendingEntry, 'id'>) => {
      try {
        const newTransaction = await operations.handleCreate(entry);
        if (newTransaction) {
          // Highlight the new transaction
          setHighlightedIds(new Set([newTransaction.id]));
          setIsModalOpen(false);
        }
      } catch {
        // Error already toasted by operations hook
      }
    },
    [operations],
  );

  const handleAddTransactionClick = useCallback(() => {
    setEditingTransaction(undefined);
    setIsModalOpen(true);
  }, []);

  const refreshTransactionsAndHighlight = useCallback(async (id: string) => {
    const updatedData = await spendingService.getAllTransactions();
    setTransactions(updatedData);
    setHighlightedIds(new Set([id]));
  }, []);

  const columns = useMemo(
    () => {
      return getSpendingTableColumns({
        handleEditSpread: handleSpreadEditClick,
        handleEdit: handleEditClick,
        handleDelete: handleDeleteClick,
        displayMonth: getDisplayMonthContext(filters),
      });
    },
    [filters, handleSpreadEditClick],
  );

  const sortState = useMemo<SortState>(() => {
    const sortColumn = getStringParam(searchParams, 'sort');
    const sortDirection = getStringParam(searchParams, 'dir');
    const isValidColumn = columns.some(
      (column) => column.key === sortColumn && column.sortable,
    );
    const isValidDirection = SORT_DIRECTIONS.includes(
      sortDirection as (typeof SORT_DIRECTIONS)[number],
    );

    return {
      column: isValidColumn ? sortColumn! : null,
      direction: isValidDirection
        ? (sortDirection as SortState['direction'])
        : null,
    };
  }, [columns, searchParams]);

  const sortedFilteredData = useMemo(() => {
    return sortTransactions(filteredData, columns, sortState);
  }, [columns, filteredData, sortState]);

  const pageSizeParam = getNumberParam(searchParams, 'pageSize');
  const pageSize = PAGE_SIZE_OPTIONS.includes(
    pageSizeParam as (typeof PAGE_SIZE_OPTIONS)[number],
  )
    ? pageSizeParam!
    : 50;
  const totalPages = Math.max(1, Math.ceil(sortedFilteredData.length / pageSize));
  const currentPage = Math.min(
    Math.max(getNumberParam(searchParams, 'page') ?? 1, 1),
    totalPages,
  );
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(currentPage * pageSize, sortedFilteredData.length);
  const paginatedData = useMemo(
    () => sortedFilteredData.slice(startIndex, endIndex),
    [endIndex, sortedFilteredData, startIndex],
  );

  useEffect(() => {
    const requestedPage = getNumberParam(searchParams, 'page') ?? 1;
    if (requestedPage !== currentPage) {
      updateQueryParams({ page: currentPage });
    }
  }, [currentPage, searchParams, updateQueryParams]);

  const handleSortChange = useCallback(
    (nextSortState: SortState) => {
      updateQueryParams({
        page: 1,
        sortColumn: nextSortState.column,
        sortDirection: nextSortState.direction,
      });
    },
    [updateQueryParams],
  );

  React.useImperativeHandle(
    ref,
    () => ({
      openAddTransactionModal: handleAddTransactionClick,
    }),
    [handleAddTransactionClick],
  );

  // Bulk operation handlers - Stage operations instead of executing immediately
  const handleBulkDelete = () => {
    setPendingOperations((prev) => [
      ...prev.filter((op) => op.type !== 'delete'),
      { type: 'delete' },
    ]);
  };

  const handleBulkBudgetSelect = (
    budgetId: number,
    label: string,
    category: string,
  ) => {
    setPendingOperations((prev) => [
      ...prev.filter((op) => op.type !== 'category'),
      { type: 'category', value: { id: budgetId, label, category } },
    ]);
  };

  const handleBulkAccountSelect = (account: string) => {
    setPendingOperations((prev) => [
      ...prev.filter((op) => op.type !== 'account'),
      { type: 'account', value: account },
    ]);
  };

  const handleBulkRemoveSpread = () => {
    setPendingOperations((prev) => [
      ...prev.filter((op) => op.type !== 'spread'),
      { type: 'spread', value: 'remove' },
    ]);
  };

  // Save button handler
  const handleSave = () => {
    if (pendingOperations.length === 0) return;
    setShowSaveConfirm(true);
  };

  // Execute all pending operations
  const handleSaveConfirm = async () => {
    const selectedIds = Array.from(selection.selectedIds);

    try {
      // Execute all pending operations sequentially
      for (const op of pendingOperations) {
        switch (op.type) {
          case 'delete':
            await bulkOps.handleBulkDelete(selectedIds);
            break;
          case 'category': {
            const budgetValue = op.value as {
              id: number;
              label: string;
              category: string;
            };
            await bulkOps.handleBulkUpdateBudget(selectedIds, budgetValue);
            break;
          }
          case 'account':
            await bulkOps.handleBulkUpdateAccount(
              selectedIds,
              op.value as string,
            );
            break;
          case 'spread':
            await bulkOps.handleBulkRemoveSpread(selectedIds);
            break;
        }
      }

      // Refresh table to ensure UI matches database exactly
      const updatedData = await spendingService.getAllTransactions();
      setTransactions(updatedData);

      // Highlight all updated rows (except deleted ones which are no longer in the list)
      const updatedIds = new Set(
        selectedIds.filter((id) => updatedData.some((t) => t.id === id)),
      );
      setHighlightedIds(updatedIds);

      // Clear state after successful execution
      selection.clearSelection();
      setPendingOperations([]);
      setShowSaveConfirm(false);
    } catch {
      // Errors already toasted by bulk operations hook
      // Keep pending operations so user can retry
    }
  };

  // Clear pending operation
  const handleClearPendingOperation = (type: PendingBulkOperation['type']) => {
    setPendingOperations((prev) => prev.filter((op) => op.type !== type));
  };

  // Format pending operations for display
  const getPendingOperationsDisplay = () => {
    return pendingOperations.map((op) => {
      let label = '';
      switch (op.type) {
        case 'delete':
          label = 'Delete';
          break;
        case 'category': {
          const budgetValue =
            typeof op.value === 'object'
              ? `${op.value.label} (${op.value.category})`
              : op.value;
          label = `Budget: ${budgetValue}`;
          break;
        }
        case 'account':
          label = `Account: ${op.value}`;
          break;
        case 'spread':
          label = 'Payment Spread: Remove';
          break;
      }

      return {
        type: op.type,
        label,
        onClear: () => handleClearPendingOperation(op.type),
      };
    });
  };

  const selectedTransactions = useMemo(
    () => transactions.filter((transaction) => selection.selectedIds.has(transaction.id)),
    [selection.selectedIds, transactions],
  );
  const hasSelectedSpreadPayments = selectedTransactions.some((transaction) =>
    hasSpreadPayment(transaction),
  );

  const handleSaveSpread = useCallback(
    async (id: string, updates: Partial<SpendingEntry>) => {
      const success = await operations.handleUpdate(id, updates);
      if (!success) {
        throw new Error('Failed to update spread payment');
      }

      await refreshTransactionsAndHighlight(id);
    },
    [operations, refreshTransactionsAndHighlight],
  );

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading transactions...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/40 p-6">
        <div className="mb-4">
        <SpendingFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          availableYears={availableYears}
          availableAccounts={availableAccounts}
          availableBudgetItems={availableBudgetItems}
        />
        </div>

        <BulkActionBar
          selectedCount={selection.selectedCount}
          onClearSelection={selection.clearSelection}
          actions={[]}
          pendingOperations={getPendingOperationsDisplay()}
          onSave={handleSave}
          saveDisabled={bulkOps.isLoading}
          onDelete={handleBulkDelete}
        >
          <BulkBudgetDropdown
            budgets={allBudgets}
            onSelectBudget={handleBulkBudgetSelect}
          />
          <BulkAccountDropdown
            accounts={availableAccounts}
            onSelectAccount={handleBulkAccountSelect}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleBulkRemoveSpread}
            disabled={bulkOps.isLoading || !hasSelectedSpreadPayments}
            className="px-3 py-1.5 text-xs"
          >
            Remove Spread
          </Button>
        </BulkActionBar>

        <Table
          columns={columns}
          data={paginatedData}
          rowKey={(row) => row.id}
          emptyMessage="No transactions found"
          selectable={true}
          selectedIds={selection.selectedIds}
          onSelectionChange={selection.toggleSelection}
          onSelectAll={() =>
            selection.toggleAll(sortedFilteredData.map((t) => t.id))
          }
          highlightedIds={highlightedIds}
          sortState={sortState}
          onSortChange={handleSortChange}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => updateQueryParams({ page })}
          pageSize={pageSize}
          totalItems={sortedFilteredData.length}
          showPageSize={true}
          onPageSizeChange={(size) =>
            updateQueryParams({ page: 1, pageSize: size })
          }
          pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
        />
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onAddEntry={handleAddTransaction}
        onUpdateEntry={handleUpdateTransaction}
        item={editingTransaction}
      />

      <SpreadPaymentModal
        isOpen={spreadEditorState !== null}
        transaction={spreadEditorState?.transaction ?? null}
        anchorElement={spreadEditorState?.anchorElement ?? null}
        onClose={() => setSpreadEditorState(null)}
        onSave={handleSaveSpread}
      />

      <ConfirmDialog
        isOpen={deletingItemId !== null}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        message={
          <>
            Are you sure you want to delete{' '}
            <strong>
              {transactions.find((t) => t.id === deletingItemId)?.description ||
                'this transaction'}
            </strong>
            ? This action cannot be undone.
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <BulkSaveConfirm
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={handleSaveConfirm}
        count={selection.selectedCount}
        operations={pendingOperations}
        isLoading={bulkOps.isLoading}
      />
    </div>
  );
});

SpendingView.displayName = 'SpendingView';
