/**
 * Enhanced CSV preview table with tab-based filtering and row actions
 */

import React, { useState, useMemo } from 'react';

import type { ParsedTransaction } from '../types/csvUpload';

interface CsvPreviewTableEnhancedProps {
  transactions: ParsedTransaction[];
  onEditTransaction: (
    rowNumber: number,
    updates: Partial<ParsedTransaction>,
  ) => void;
  onToggleFiltered: (rowNumber: number) => void;
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
> = ({ transactions, onEditTransaction, onToggleFiltered, stats }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('import');
  const [editingCell, setEditingCell] = useState<{
    row: number;
    field: string;
  } | null>(null);
  const [editHistory, setEditHistory] = useState<Set<number>>(new Set());

  // Filter transactions based on view mode
  const displayTransactions = useMemo(() => {
    if (viewMode === 'import') {
      return transactions.filter(
        (t) => !t.is_filtered && t.validation_errors.length === 0,
      );
    }
    if (viewMode === 'filtered') {
      return transactions.filter((t) => t.is_filtered);
    }
    return transactions; // all
  }, [transactions, viewMode]);

  const handleCellChange = (
    rowNumber: number,
    field: string,
    value: string | number,
  ) => {
    // Track edited rows
    setEditHistory((prev) => new Set(prev).add(rowNumber));

    if (field === 'description') {
      onEditTransaction(rowNumber, { description: value as string });
    } else if (field === 'amount') {
      const numValue = parseFloat(value as string);
      onEditTransaction(rowNumber, { amount: isNaN(numValue) ? 0 : numValue });
    } else if (field === 'post_date') {
      onEditTransaction(rowNumber, { post_date: value as string });
    } else if (field === 'transaction_date') {
      onEditTransaction(rowNumber, { transaction_date: value as string });
    }
  };

  const handleReFilter = (rowNumber: number) => {
    const transaction = transactions.find((t) => t.row_number === rowNumber);
    if (transaction && !transaction.is_filtered) {
      onToggleFiltered(rowNumber);
    }
  };

  const viewModeCopy: Record<
    ViewMode,
    { title: string; description: string; accent: string }
  > = {
    import: {
      title: 'Ready to import',
      description: 'Editable rows that will be imported when you confirm.',
      accent: 'text-emerald-700',
    },
    filtered: {
      title: 'Filtered out',
      description:
        'Rows excluded from import. Include any that should come back.',
      accent: 'text-slate-700',
    },
    all: {
      title: 'All uploaded rows',
      description:
        'Complete file review, including importable, filtered, and error rows.',
      accent: 'text-blue-700',
    },
  };

  const activeView = viewModeCopy[viewMode];
  const summaryItems = [
    {
      label: 'Total rows',
      value: stats.total,
      tone: 'text-slate-900',
    },
    {
      label: 'Importing',
      value: stats.importing,
      tone: 'text-emerald-700',
    },
    {
      label: 'Filtered',
      value: stats.filtered,
      tone: 'text-slate-700',
    },
    {
      label: 'Errors',
      value: stats.errors,
      tone: 'text-rose-700',
    },
  ];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-slate-50">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Review Workspace
              </p>
              <h3 className="text-lg font-semibold text-slate-900">
                {activeView.title}
              </h3>
              <p className="max-w-2xl text-sm text-slate-600">
                {activeView.description}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  className="min-w-[110px] rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                >
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    {item.label}
                  </dt>
                  <dd
                    className={`mt-1 text-lg font-semibold tabular-nums ${item.tone}`}
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
            <div className="inline-flex w-full flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-1.5 lg:w-auto">
              <button
                onClick={() => setViewMode('import')}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'import'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                To Import ({stats.importing})
              </button>
              <button
                onClick={() => setViewMode('filtered')}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'filtered'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                Filtered ({stats.filtered})
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'all'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                All Rows ({stats.total})
              </button>
            </div>
            <p className={`text-sm font-medium ${activeView.accent}`}>
              {displayTransactions.length} row(s) in this view
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            {viewMode === 'import'
              ? 'Click a date, description, or amount cell to edit it. Use Filter to exclude a row from this import.'
              : viewMode === 'filtered'
                ? 'These rows are currently excluded. Use Include to add a row back into the import.'
                : 'Use this view to audit everything that was uploaded before confirming the import.'}
          </div>
        </div>
      </section>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="max-h-[58vh] overflow-auto">
          <table className="w-full min-w-[880px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-12 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  #
                </th>
                <th className="w-32 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  Account
                </th>
                <th className="w-28 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  Txn Date
                </th>
                <th className="w-28 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  Post Date
                </th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  Description
                </th>
                <th className="w-28 px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  Amount
                </th>
                <th className="w-36 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  Category
                </th>
                <th className="w-36 px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  Review
                </th>
              </tr>
            </thead>
            <tbody>
              {displayTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    No transactions to display in this view
                  </td>
                </tr>
              ) : (
                displayTransactions.map((txn) => {
                  const isEdited = editHistory.has(txn.row_number);
                  const hasError = txn.validation_errors.length > 0;
                  const isFiltered = txn.is_filtered;

                  return (
                    <tr
                      key={txn.row_number}
                      className={`border-b border-slate-100 transition-colors ${
                        hasError
                          ? 'bg-rose-50/60 hover:bg-rose-50'
                          : isFiltered
                            ? 'bg-slate-50 hover:bg-slate-100/70'
                            : 'hover:bg-slate-50'
                      } ${isEdited ? 'ring-1 ring-inset ring-amber-200' : ''}`}
                    >
                      {/* Row Number */}
                      <td className="px-3 py-2.5 text-xs font-mono tabular-nums text-slate-500">
                        {txn.row_number}
                      </td>

                      {/* Account */}
                      <td className="px-3 py-2.5 text-xs font-medium text-slate-900">
                        {txn.account}
                      </td>

                      {/* Transaction Date */}
                      <td className="px-3 py-2.5 text-xs text-slate-700">
                        {editingCell?.row === txn.row_number &&
                        editingCell?.field === 'transaction_date' ? (
                          <input
                            type="date"
                            value={txn.transaction_date || ''}
                            onChange={(e) =>
                              handleCellChange(
                                txn.row_number,
                                'transaction_date',
                                e.target.value,
                              )
                            }
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                            className="w-full px-2 py-1 border border-blue-300 rounded-md text-xs bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <span
                            onClick={() =>
                              !isFiltered &&
                              setEditingCell({
                                row: txn.row_number,
                                field: 'transaction_date',
                              })
                            }
                            className={`${
                              !isFiltered
                                ? 'cursor-pointer hover:bg-slate-100'
                                : ''
                            } inline-block rounded-md px-2 py-1 tabular-nums transition-colors`}
                            title={!isFiltered ? 'Click to edit' : undefined}
                          >
                            {txn.transaction_date || '-'}
                          </span>
                        )}
                      </td>

                      {/* Post Date */}
                      <td className="px-3 py-2.5 text-xs text-slate-700">
                        {editingCell?.row === txn.row_number &&
                        editingCell?.field === 'post_date' ? (
                          <input
                            type="date"
                            value={txn.post_date}
                            onChange={(e) =>
                              handleCellChange(
                                txn.row_number,
                                'post_date',
                                e.target.value,
                              )
                            }
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                            className="w-full px-2 py-1 border border-blue-300 rounded-md text-xs bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <span
                            onClick={() =>
                              !isFiltered &&
                              setEditingCell({
                                row: txn.row_number,
                                field: 'post_date',
                              })
                            }
                            className={`${
                              !isFiltered
                                ? 'cursor-pointer hover:bg-slate-100'
                                : ''
                            } inline-block rounded-md px-2 py-1 tabular-nums transition-colors`}
                            title={!isFiltered ? 'Click to edit' : undefined}
                          >
                            {txn.post_date}
                          </span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="max-w-sm px-3 py-2.5 text-xs text-slate-900">
                        {editingCell?.row === txn.row_number &&
                        editingCell?.field === 'description' ? (
                          <input
                            type="text"
                            value={txn.description}
                            onChange={(e) =>
                              handleCellChange(
                                txn.row_number,
                                'description',
                                e.target.value,
                              )
                            }
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                            className="w-full px-2 py-1 border border-blue-300 rounded-md text-xs bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <span
                            onClick={() =>
                              !isFiltered &&
                              setEditingCell({
                                row: txn.row_number,
                                field: 'description',
                              })
                            }
                            className={`${
                              !isFiltered
                                ? 'cursor-pointer hover:bg-slate-100'
                                : ''
                            } inline-block max-w-sm truncate rounded-md px-2 py-1 transition-colors`}
                            title={txn.description}
                          >
                            {txn.description}
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-2.5 text-xs text-slate-900 text-right font-semibold">
                        {editingCell?.row === txn.row_number &&
                        editingCell?.field === 'amount' ? (
                          <input
                            type="number"
                            step="0.01"
                            value={txn.amount}
                            onChange={(e) =>
                              handleCellChange(
                                txn.row_number,
                                'amount',
                                e.target.value,
                              )
                            }
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                            className="w-full px-2 py-1 border border-blue-300 rounded-md text-xs text-right bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                          />
                        ) : (
                          <span
                            onClick={() =>
                              !isFiltered &&
                              setEditingCell({
                                row: txn.row_number,
                                field: 'amount',
                              })
                            }
                            className={`${
                              !isFiltered
                                ? 'cursor-pointer hover:bg-slate-100'
                                : ''
                            } inline-block rounded-md px-2 py-1 tabular-nums transition-colors`}
                            title={!isFiltered ? 'Click to edit' : undefined}
                          >
                            ${txn.amount.toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Chase Category */}
                      <td className="px-3 py-2.5 text-xs text-slate-600">
                        {txn.chase_category || '-'}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5 text-xs">
                        <div className="flex items-center justify-center gap-2">
                          {hasError ? (
                            <span
                              className="rounded-full bg-rose-100 px-2.5 py-1 font-medium text-rose-700"
                              title={txn.validation_errors[0]}
                            >
                              Error
                            </span>
                          ) : isFiltered ? (
                            <button
                              onClick={() => onToggleFiltered(txn.row_number)}
                              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-700 transition-colors hover:bg-emerald-100 hover:text-emerald-900"
                              title={
                                txn.filter_reason || 'Include this transaction'
                              }
                            >
                              Include
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleReFilter(txn.row_number)}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                title="Mark as filtered (exclude from import)"
                              >
                                Filter
                              </button>
                              {isEdited && (
                                <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
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
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing{' '}
          <span className="font-semibold text-slate-900">
            {displayTransactions.length}
          </span>{' '}
          transaction(s)
        </span>
        {viewMode === 'import' && stats.importing > 0 && (
          <span className="font-medium text-emerald-700">
            Ready to import {stats.importing} transaction(s)
          </span>
        )}
      </div>
    </div>
  );
};
