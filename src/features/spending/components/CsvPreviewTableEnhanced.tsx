/**
 * Enhanced CSV preview table with tab-based filtering and row actions
 */

import React, { useState, useMemo } from 'react';

import type { BudgetApiResponse } from '@/features/budget/types/budgetApi';

import type { ParsedTransaction } from '../types/csvUpload';

interface CsvPreviewTableEnhancedProps {
  transactions: ParsedTransaction[];
  budgets: BudgetApiResponse[];
  isLoadingBudgets?: boolean;
  onEditTransaction: (
    previewId: string,
    updates: Partial<ParsedTransaction>,
  ) => void;
  onToggleFiltered: (previewId: string) => void;
  stats: {
    total: number;
    importing: number;
    filtered: number;
    errors: number;
  };
}

type ViewMode = 'import' | 'filtered' | 'all';

export const CsvPreviewTableEnhanced: React.FC<
  CsvPreviewTableEnhancedProps
> = ({
  transactions,
  budgets,
  isLoadingBudgets = false,
  onEditTransaction,
  onToggleFiltered,
  stats,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('import');
  const [editingCell, setEditingCell] = useState<{
    row: string;
    field: string;
  } | null>(null);
  const [editHistory, setEditHistory] = useState<Set<string>>(new Set());

  const displayTransactions = useMemo(() => {
    if (viewMode === 'import') {
      return transactions.filter(
        (t) => !t.is_filtered && t.validation_errors.length === 0,
      );
    }
    if (viewMode === 'filtered') {
      return transactions.filter((t) => t.is_filtered);
    }
    return transactions;
  }, [transactions, viewMode]);

  const budgetsById = useMemo(
    () => new Map(budgets.map((budget) => [budget.id, budget])),
    [budgets],
  );
  const groupedBudgets = useMemo(() => {
    const groups = new Map<string, BudgetApiResponse[]>();
    budgets.forEach((budget) => {
      const category = budget.expense_category;
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)?.push(budget);
    });
    return Array.from(groups.entries());
  }, [budgets]);

  const handleCellChange = (
    previewId: string,
    field: string,
    value: string | number,
  ) => {
    setEditHistory((prev) => new Set(prev).add(previewId));

    if (field === 'description') {
      onEditTransaction(previewId, { description: value as string });
    } else if (field === 'amount') {
      const numValue = parseFloat(value as string);
      onEditTransaction(previewId, {
        amount: isNaN(numValue) ? 0 : numValue,
      });
    } else if (field === 'post_date') {
      onEditTransaction(previewId, { post_date: value as string });
    } else if (field === 'transaction_date') {
      onEditTransaction(previewId, { transaction_date: value as string });
    } else if (field === 'budget_id') {
      const parsedBudgetId =
        typeof value === 'string' && value !== '' ? parseInt(value, 10) : null;
      onEditTransaction(previewId, {
        budget_id: Number.isNaN(parsedBudgetId) ? null : parsedBudgetId,
        auto_categorized: false,
      });
    }
  };

  const handleReFilter = (previewId: string) => {
    const transaction = transactions.find((t) => t.preview_id === previewId);
    if (transaction && !transaction.is_filtered) {
      onToggleFiltered(previewId);
    }
  };

  const viewModeCopy: Record<
    ViewMode,
    { title: string; description: string; accentClass: string }
  > = {
    import: {
      title: 'Ready to import',
      description: 'Editable rows that will be imported when you confirm.',
      accentClass: 'import-accent-import',
    },
    filtered: {
      title: 'Filtered out',
      description:
        'Rows excluded from import. Include any that should come back.',
      accentClass: 'import-accent-filtered',
    },
    all: {
      title: 'All uploaded rows',
      description:
        'Complete file review, including importable, filtered, and error rows.',
      accentClass: 'import-accent-all',
    },
  };

  const activeView = viewModeCopy[viewMode];
  const summaryItems = [
    { label: 'Total rows', value: stats.total, toneClass: 'text-app' },
    { label: 'Importing', value: stats.importing, toneClass: 'text-success' },
    { label: 'Filtered', value: stats.filtered, toneClass: 'text-muted' },
    { label: 'Errors', value: stats.errors, toneClass: 'text-danger' },
  ];

  return (
    <div className="space-y-4">
      <section className="import-review-panel">
        <div className="import-review-header">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-1">
              <p className="import-kicker">Review Workspace</p>
              <h3 className="import-title">{activeView.title}</h3>
              <p className="import-description max-w-2xl">
                {activeView.description}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {summaryItems.map((item) => (
                <div key={item.label} className="import-stat-card">
                  <dt className="import-card-label uppercase tracking-wide">
                    {item.label}
                  </dt>
                  <dd
                    className={`mt-1 text-lg font-semibold tabular-nums ${item.toneClass}`}
                  >
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="space-y-3 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="import-tab-bar">
              <button
                onClick={() => setViewMode('import')}
                className={`import-tab ${viewMode === 'import' ? 'import-tab-active-import' : ''}`}
              >
                To Import ({stats.importing})
              </button>
              <button
                onClick={() => setViewMode('filtered')}
                className={`import-tab ${viewMode === 'filtered' ? 'import-tab-active-filtered' : ''}`}
              >
                Filtered ({stats.filtered})
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`import-tab ${viewMode === 'all' ? 'import-tab-active-all' : ''}`}
              >
                All Rows ({stats.total})
              </button>
            </div>
            <p className={`text-sm font-medium ${activeView.accentClass}`}>
              {displayTransactions.length} row(s) in this view
            </p>
          </div>

          <div className="import-hint-box">
            {viewMode === 'import'
              ? 'Click a date, description, amount, or budget cell to edit it. Use Filter to exclude a row from this import.'
              : viewMode === 'filtered'
                ? 'These rows are currently excluded. Use Include to add a row back into the import.'
                : 'Use this view to audit everything that was uploaded before confirming the import.'}
          </div>
        </div>
      </section>

      {/* Table */}
      <div className="import-table-container">
        <div className="max-h-[58vh] overflow-auto">
          <table className="w-full min-w-[1180px] table-fixed">
            <thead className="sticky top-0 z-10">
              <tr className="import-table-head-row">
                <th className="w-14 px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-app">
                  #
                </th>
                <th className="w-24 px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-app">
                  Account
                </th>
                <th className="w-28 px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-app">
                  Txn Date
                </th>
                <th className="w-28 px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-app">
                  Post Date
                </th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-app">
                  Description
                </th>
                <th className="w-32 px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wide text-app">
                  Amount
                </th>
                <th className="w-72 px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-app">
                  Budget Item
                </th>
                <th className="w-56 px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-app">
                  Status
                </th>
                <th className="w-28 px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wide text-app">
                  Review
                </th>
              </tr>
            </thead>
            <tbody>
              {displayTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-sm text-muted"
                  >
                    No transactions to display in this view
                  </td>
                </tr>
              ) : (
                displayTransactions.map((txn) => {
                  const isEdited = editHistory.has(txn.preview_id);
                  const hasError = txn.validation_errors.length > 0;
                  const isFiltered = txn.is_filtered;
                  const budget = txn.budget_id
                    ? budgetsById.get(txn.budget_id) ?? null
                    : null;
                  const budgetLabel = budget?.expense_label
                    ? budget.expense_label
                    : txn.budget_id
                      ? `Budget #${txn.budget_id}`
                      : 'Uncategorized';
                  const budgetMeta = budget
                    ? `${budget.expense_category} • ${budget.expense_type}`
                    : txn.chase_category
                      ? `Bank category: ${txn.chase_category}`
                      : 'No budget selected';

                  const rowClass = hasError
                    ? 'import-table-row-error'
                    : isFiltered
                      ? 'import-table-row-filtered'
                      : '';

                  return (
                    <tr
                      key={txn.preview_id}
                      className={`import-table-row ${rowClass} ${isEdited ? 'import-table-row-edited' : ''}`}
                    >
                      {/* Row Number */}
                      <td className="px-4 py-3.5 align-top text-xs font-mono tabular-nums text-muted">
                        {txn.row_number}
                      </td>

                      {/* Account */}
                      <td className="px-4 py-3.5 align-top text-xs font-semibold text-app">
                        {txn.account}
                      </td>

                      {/* Transaction Date */}
                      <td className="px-4 py-3.5 align-top text-xs text-app">
                        {editingCell?.row === txn.preview_id &&
                        editingCell?.field === 'transaction_date' ? (
                          <input
                            type="date"
                            value={txn.transaction_date || ''}
                            onChange={(e) =>
                              handleCellChange(
                                txn.preview_id,
                                'transaction_date',
                                e.target.value,
                              )
                            }
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                            className="import-cell-input"
                          />
                        ) : (
                          <span
                            onClick={() =>
                              !isFiltered &&
                              setEditingCell({
                                row: txn.preview_id,
                                field: 'transaction_date',
                              })
                            }
                            className={`${!isFiltered ? 'cursor-pointer import-cell-editable' : ''} inline-block rounded-md px-2 py-1 tabular-nums transition-colors`}
                            title={!isFiltered ? 'Click to edit' : undefined}
                          >
                            {txn.transaction_date || '-'}
                          </span>
                        )}
                      </td>

                      {/* Post Date */}
                      <td className="px-4 py-3.5 align-top text-xs text-app">
                        {editingCell?.row === txn.preview_id &&
                        editingCell?.field === 'post_date' ? (
                          <input
                            type="date"
                            value={txn.post_date}
                            onChange={(e) =>
                              handleCellChange(
                                txn.preview_id,
                                'post_date',
                                e.target.value,
                              )
                            }
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                            className="import-cell-input"
                          />
                        ) : (
                          <span
                            onClick={() =>
                              !isFiltered &&
                              setEditingCell({
                                row: txn.preview_id,
                                field: 'post_date',
                              })
                            }
                            className={`${!isFiltered ? 'cursor-pointer import-cell-editable' : ''} inline-block rounded-md px-2 py-1 tabular-nums transition-colors`}
                            title={!isFiltered ? 'Click to edit' : undefined}
                          >
                            {txn.post_date}
                          </span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3.5 align-top text-xs text-app">
                        {editingCell?.row === txn.preview_id &&
                        editingCell?.field === 'description' ? (
                          <input
                            type="text"
                            value={txn.description}
                            onChange={(e) =>
                              handleCellChange(
                                txn.preview_id,
                                'description',
                                e.target.value,
                              )
                            }
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                            className="import-cell-input"
                          />
                        ) : (
                          <span
                            onClick={() =>
                              !isFiltered &&
                              setEditingCell({
                                row: txn.preview_id,
                                field: 'description',
                              })
                            }
                            className={`${!isFiltered ? 'cursor-pointer import-cell-editable' : ''} inline-block max-w-full truncate rounded-md px-2 py-1 pr-3 leading-5 transition-colors`}
                            title={txn.description}
                          >
                            {txn.description}
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5 align-top text-right text-xs font-semibold text-app">
                        {editingCell?.row === txn.preview_id &&
                        editingCell?.field === 'amount' ? (
                          <input
                            type="number"
                            step="0.01"
                            value={txn.amount}
                            onChange={(e) =>
                              handleCellChange(
                                txn.preview_id,
                                'amount',
                                e.target.value,
                              )
                            }
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                            className="import-cell-input text-right tabular-nums"
                          />
                        ) : (
                          <span
                            onClick={() =>
                              !isFiltered &&
                              setEditingCell({
                                row: txn.preview_id,
                                field: 'amount',
                              })
                            }
                            className={`${!isFiltered ? 'cursor-pointer import-cell-editable' : ''} inline-block rounded-md px-2 py-1 tabular-nums transition-colors`}
                            title={!isFiltered ? 'Click to edit' : undefined}
                          >
                            ${txn.amount.toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Budget Item */}
                      <td className="px-4 py-3.5 align-top text-xs text-app">
                        {editingCell?.row === txn.preview_id &&
                        editingCell?.field === 'budget_id' ? (
                          <select
                            value={txn.budget_id ?? ''}
                            onChange={(e) =>
                              handleCellChange(
                                txn.preview_id,
                                'budget_id',
                                e.target.value,
                              )
                            }
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                            className="import-cell-input"
                          >
                            <option value="">
                              {isLoadingBudgets
                                ? 'Loading budgets...'
                                : 'Uncategorized'}
                            </option>
                            {groupedBudgets.map(([category, categoryBudgets]) => (
                              <optgroup key={category} label={category}>
                                {categoryBudgets.map((budgetOption) => (
                                  <option
                                    key={budgetOption.id}
                                    value={budgetOption.id}
                                  >
                                    {budgetOption.expense_label} (
                                    {budgetOption.expense_type})
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        ) : (
                          <div
                            onClick={() =>
                              !isFiltered &&
                              !hasError &&
                              setEditingCell({
                                row: txn.preview_id,
                                field: 'budget_id',
                              })
                            }
                            className={`space-y-1 rounded-md px-2 py-1.5 transition-colors ${!isFiltered && !hasError ? 'cursor-pointer import-cell-editable' : ''}`}
                            title={
                              !isFiltered && !hasError
                                ? 'Click to change budget'
                                : undefined
                            }
                          >
                            <div className="flex items-start gap-2">
                              <span className="leading-5 font-semibold text-app">
                                {budgetLabel}
                              </span>
                              {txn.auto_categorized && (
                                <span className="import-badge-auto">Auto</span>
                              )}
                              {!txn.auto_categorized && txn.budget_id && (
                                <span className="import-badge-manual">
                                  Manual
                                </span>
                              )}
                            </div>
                            <p className="line-clamp-2 text-[11px] leading-5 text-muted">
                              {budgetMeta}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 align-top text-xs">
                        {hasError ? (
                          <div className="space-y-1">
                            <span className="import-status-error">Error</span>
                            <p className="line-clamp-2 text-[11px] leading-5 text-danger">
                              {txn.validation_errors[0]}
                            </p>
                          </div>
                        ) : isFiltered ? (
                          <div className="space-y-1">
                            <span className="import-status-excluded">
                              Excluded
                            </span>
                            <p className="line-clamp-2 text-[11px] leading-5 text-muted">
                              {txn.filter_reason || 'Excluded from import'}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="import-status-included">
                              Included
                            </span>
                            <p className="line-clamp-2 text-[11px] leading-5 text-success">
                              Ready to import
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 align-top text-xs">
                        <div className="flex items-start justify-center gap-2 pt-0.5">
                          {hasError ? (
                            <span className="import-action-error-badge">
                              Error
                            </span>
                          ) : isFiltered ? (
                            <button
                              onClick={() => onToggleFiltered(txn.preview_id)}
                              className="import-action-include"
                            >
                              Include
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleReFilter(txn.preview_id)}
                                className="import-action-filter"
                                title="Mark as filtered (exclude from import)"
                              >
                                Filter
                              </button>
                              {isEdited && (
                                <span className="import-badge-edited">
                                  Edited
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="import-bottom-bar">
        <span>
          Showing{' '}
          <span className="font-semibold text-app">
            {displayTransactions.length}
          </span>{' '}
          transaction(s)
        </span>
        {viewMode === 'import' && stats.importing > 0 && (
          <span className="font-medium text-success">
            Ready to import {stats.importing} transaction(s)
          </span>
        )}
      </div>
    </div>
  );
};
