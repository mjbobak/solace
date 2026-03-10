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
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
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
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="h-10">
              {selectable && <th className="px-3 py-1 w-10" />}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-3 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
              <th className="w-12 px-3 py-1" />
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, idx) => (
              <tr key={idx} className="border-b border-gray-100 h-10">
                {selectable && (
                  <td className="px-3 py-1 w-10">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className="px-3 py-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
                <td className="px-3 py-1 w-12 flex items-center justify-end" />
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
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
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
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                    aria-label="Select all"
                  />
                </div>
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-3 py-1 text-[11px] font-medium text-gray-500 uppercase tracking-wider ${getAlignClass(
                  column.align,
                )} ${
                  column.sortable
                    ? 'cursor-pointer select-none hover:bg-gray-100'
                    : ''
                }`}
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
            <th className="w-12 px-3 py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              {/* Empty header for indicator column */}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIndex) => {
            const isSelected = selectedIds.has(rowKey(row));
            return (
              <tr
                key={rowKey(row)}
                className={`border-b border-gray-100 transition-colors h-10 align-middle ${
                  isSelected ? 'bg-blue-50' : ''
                } ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-gray-50'
                    : rowIndex % 2 === 0
                      ? 'bg-white'
                      : 'bg-gray-50'
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
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                        aria-label={`Select row`}
                      />
                    </div>
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-3 py-1 text-[11px] text-gray-900 ${getAlignClass(
                      column.align,
                    )}`}
                  >
                    {column.accessor(row)}
                  </td>
                ))}
                <td className="px-3 text-right">
                  {highlightedIds.has(rowKey(row)) && (
                    <div
                      className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"
                      title="Recently modified"
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
