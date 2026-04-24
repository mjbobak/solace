import React, { useState } from 'react';
import { LuChevronUp, LuChevronDown } from 'react-icons/lu';

import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  align?: 'left' | 'center' | 'right';
  width?: string;
  headerClassName?: string;
  cellClassName?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  hoverRows?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  rowKey: (row: T) => string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (id: string) => void;
  onSelectAll?: () => void;
  highlightedIds?: Set<string>;
  sortState?: SortState;
  onSortChange?: (sortState: SortState) => void;
}

type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  column: string | null;
  direction: SortDirection;
}

function getNextSortState(
  currentSortState: SortState,
  columnKey: string,
): SortState {
  if (currentSortState.column !== columnKey) {
    return {
      column: columnKey,
      direction: 'asc',
    };
  }

  if (currentSortState.direction === null) {
    return {
      column: columnKey,
      direction: 'asc',
    };
  }

  if (currentSortState.direction === 'asc') {
    return {
      column: columnKey,
      direction: 'desc',
    };
  }

  return {
    column: null,
    direction: null,
  };
}

function getSortValue<T>(column: Column<T>, row: T): string | number {
  if (column.sortValue) {
    return column.sortValue(row);
  }

  const accessorValue = column.accessor(row);
  if (typeof accessorValue === 'string' || typeof accessorValue === 'number') {
    return String(accessorValue);
  }

  return '';
}

export function Table<T>({
  columns,
  data,
  onRowClick,
  hoverRows = false,
  isLoading = false,
  emptyMessage = 'No data available',
  rowKey,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  onSelectAll,
  highlightedIds = new Set(),
  sortState: controlledSortState,
  onSortChange,
}: TableProps<T>) {
  const checkboxClassName = 'checkbox-input';
  const hasHighlightedColumn = highlightedIds.size > 0;

  const [internalSortState, setInternalSortState] = useState<SortState>({
    column: null,
    direction: null,
  });
  const sortState = controlledSortState ?? internalSortState;

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;

    const nextSortState = getNextSortState(sortState, column.key);

    if (onSortChange) {
      onSortChange(nextSortState);
      return;
    }

    setInternalSortState(nextSortState);
  };

  const sortedData = React.useMemo(() => {
    if (onSortChange) {
      return data;
    }

    if (!sortState.column || !sortState.direction) {
      return data;
    }

    const column = columns.find((col) => col.key === sortState.column);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const aString = String(getSortValue(column, a));
      const bString = String(getSortValue(column, b));

      const comparison = aString.localeCompare(bString, undefined, {
        numeric: true,
        sensitivity: 'base',
      });

      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortState, columns, onSortChange]);

  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  const getJustifyClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'justify-center';
      case 'right':
        return 'justify-end';
      default:
        return 'justify-start';
    }
  };

  if (isLoading) {
    return (
      <div className="table-shell">
        <table className="table-base">
          <thead className="table-head">
            <tr className="h-10">
              {selectable && <th className="px-3 py-1 w-10" />}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`table-header-cell text-left ${
                    column.headerClassName ?? ''
                  }`}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
              {hasHighlightedColumn && <th className="w-12 px-3 py-1" />}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, idx) => (
              <tr key={idx} className="table-row">
                {selectable && (
                  <td className="px-3 py-1 w-10">
                    <div className="table-skeleton h-4 w-4 animate-pulse rounded" />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className="px-3 py-1">
                    <div className="table-skeleton h-4 animate-pulse rounded" />
                  </td>
                ))}
                {hasHighlightedColumn && (
                  <td className="px-3 py-1 w-12 flex items-center justify-end" />
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data.length) {
    return <EmptyState title="No data" description={emptyMessage} />;
  }

  return (
    <div className="table-shell">
      <table className="table-base">
        <thead className="table-head sticky top-0">
          <tr className="h-10">
            {selectable && (
              <th className="px-3 py-1 w-10">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={
                      data.length > 0 &&
                      data.every((row) => selectedIds.has(rowKey(row)))
                    }
                    onChange={() => onSelectAll?.()}
                    className={checkboxClassName}
                    aria-label="Select all"
                  />
                </div>
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={`table-header-cell ${getAlignClass(column.align)} ${
                  column.sortable
                    ? 'table-sortable cursor-pointer select-none'
                    : ''
                } ${column.headerClassName ?? ''}`}
                style={{ width: column.width }}
                onClick={() => handleSort(column)}
              >
                <div
                  className={`flex items-center gap-1 ${getJustifyClass(
                    column.align,
                  )}`}
                >
                  <span>{column.header}</span>
                  {column.sortable && (
                    <div className="flex flex-col">
                      {sortState.column === column.key &&
                      sortState.direction === 'asc' ? (
                        <LuChevronUp className="w-4 h-4" />
                      ) : sortState.column === column.key &&
                        sortState.direction === 'desc' ? (
                        <LuChevronDown className="w-4 h-4" />
                      ) : (
                        <div className="w-4 h-4 opacity-30">
                          <LuChevronUp className="w-3 h-3 -mb-1" />
                          <LuChevronDown className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </th>
            ))}
            {hasHighlightedColumn && (
              <th className="table-header-cell w-12 px-3 py-3.5 text-right" />
            )}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIndex) => {
            const isSelected = selectedIds.has(rowKey(row));
            return (
              <tr
                key={rowKey(row)}
                className={`table-row ${
                  isSelected ? 'table-row-selected' : ''
                } ${
                  onRowClick
                    ? 'table-row-hover cursor-pointer'
                    : hoverRows
                      ? 'table-row-hover'
                      : rowIndex % 2 === 0
                        ? ''
                        : 'table-row-striped'
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <td
                    className="px-3 py-1 w-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectionChange?.(rowKey(row))}
                        className={checkboxClassName}
                        aria-label={`Select row`}
                      />
                    </div>
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`table-cell ${getAlignClass(column.align)} ${
                      column.cellClassName ?? ''
                    }`}
                  >
                    {column.accessor(row)}
                  </td>
                ))}
                {hasHighlightedColumn && (
                  <td className="px-3 text-right">
                    {highlightedIds.has(rowKey(row)) && (
                      <div
                        className="table-highlight-dot inline-block h-2 w-2 animate-pulse rounded-full"
                        title="Recently modified"
                      />
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
