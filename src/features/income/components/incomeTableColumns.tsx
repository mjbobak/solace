/**
 * Table column configuration for income table
 * Defines columns for both parent rows (grouped by stream) and child rows (history)
 */

import {
  LuChevronDown,
  LuChevronRight,
  LuPencil,
  LuTrash2,
} from 'react-icons/lu';

import type { Column } from '@/shared/components/data/Table';

import { DEDUCTION_FIELDS } from '../constants/incomeConfig';
import type {
  EffectiveDateRangeWithEntry,
  GroupedIncomeEntry,
} from '../types/incomeView';

import { EditableStreamName } from './EditableStreamName';
import { IncomeFrequencyBadge } from './IncomeFrequencyBadge';
import { IncomeTypeIcon } from './IncomeTypeIcon';

interface GetIncomeTableColumnsParams {
  onDeleteRange: (range: EffectiveDateRangeWithEntry) => void;
  onEditRange: (range: EffectiveDateRangeWithEntry) => void;
  onToggleExpand: (streamName: string) => void;
  onRenameStream: (oldName: string, newName: string) => Promise<void>;
  allStreamNames: string[];
  onDeleteStream: (streamName: string, entryCount: number) => void;
  onAddRange?: (group: GroupedIncomeEntry) => void;
  isChildRow?: boolean;
}

/**
 * Format a date string to MM/DD/YYYY
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Generate deduction columns from DEDUCTION_FIELDS configuration
 * Handles both parent rows and child rows with different key prefixes
 */
function createDeductionColumns(
  isChildRow: boolean = false,
): Column<GroupedIncomeEntry | EffectiveDateRangeWithEntry>[] {
  const prefix = isChildRow ? 'child' : '';

  return DEDUCTION_FIELDS.map((field) => {
    const columnKey =
      prefix + field.key.charAt(0).toUpperCase() + field.key.slice(1);
    // Special case: health insurance header abbreviation
    const headerLabel =
      field.label === 'Health Insurance' ? 'Health Ins.' : field.label;

    return {
      key: columnKey,
      header: headerLabel,
      accessor: (row) => {
        if (isChildRow) {
          // Child rows don't display deduction values
          return '-';
        }
        // Parent rows show deduction values from displayValues
        const group = row as GroupedIncomeEntry;
        const displayValue =
          group.displayValues[field.key as keyof typeof group.displayValues];
        return group.isExpanded ? '' : displayValue;
      },
      align: 'right' as const,
      width: '120px',
    };
  });
}

export function getIncomeTableColumns(
  params: GetIncomeTableColumnsParams,
): Column<GroupedIncomeEntry | EffectiveDateRangeWithEntry>[] {
  const {
    onDeleteRange,
    onEditRange,
    onToggleExpand,
    onRenameStream,
    allStreamNames,
    onDeleteStream,
    isChildRow = false,
  } = params;

  if (isChildRow) {
    // Columns for child rows (expanded history)
    return [
      {
        key: 'dateRange',
        header: 'Date Range',
        accessor: (row) => {
          const range = row as EffectiveDateRangeWithEntry;
          const start = formatDate(range.startDate);
          const end = range.endDate ? formatDate(range.endDate) : 'Present';
          return (
            <span className="pl-8 text-xs text-gray-600">
              {start} to {end}
            </span>
          );
        },
        width: '180px',
      },
      {
        key: 'childType',
        header: '',
        accessor: (row) => {
          const range = row as EffectiveDateRangeWithEntry;
          return (
            <div className="flex items-center gap-2">
              <IncomeTypeIcon
                type={range.entryType}
                frequency={range.entryFrequency}
              />
              <IncomeFrequencyBadge
                type={range.entryType}
                frequency={range.entryFrequency}
              />
            </div>
          );
        },
        width: '140px',
      },
      {
        key: 'childIncome',
        header: 'Income',
        accessor: () => {
          // Note: This will be calculated in the parent component
          // since we don't have access to the period/type toggles here
          return '-';
        },
        align: 'right',
        width: '120px',
      },
      {
        key: 'childPayPeriods',
        header: 'Pay Periods',
        accessor: (row) => {
          const range = row as EffectiveDateRangeWithEntry;
          return range.periods;
        },
        align: 'right',
        width: '100px',
      },
      ...createDeductionColumns(true),
      {
        key: 'childActions',
        header: '',
        accessor: (row) => {
          const range = row as EffectiveDateRangeWithEntry;
          return (
            <div className="flex gap-1 justify-end">
              <button
                onClick={() => onEditRange(range)}
                className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Edit date range"
                aria-label="Edit date range"
              >
                <LuPencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteRange(range)}
                className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                title="Delete date range"
                aria-label="Delete date range"
              >
                <LuTrash2 className="w-4 h-4" />
              </button>
            </div>
          );
        },
        width: '80px',
        align: 'right',
      },
    ];
  }

  // Parent row columns (grouped entries)
  return [
    {
      key: 'stream',
      header: 'Income Stream',
      accessor: (row) => {
        const group = row as GroupedIncomeEntry;
        return (
          <div className="flex gap-2">
            <button
              onClick={() => onToggleExpand(group.streamName)}
              className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              title={group.isExpanded ? 'Collapse history' : 'Expand history'}
              aria-label={group.isExpanded ? 'Collapse' : 'Expand'}
            >
              {group.isExpanded ? (
                <LuChevronDown className="w-4 h-4" />
              ) : (
                <LuChevronRight className="w-4 h-4" />
              )}
            </button>
            <EditableStreamName
              streamName={group.streamName}
              allStreamNames={allStreamNames}
              onRename={onRenameStream}
            />
          </div>
        );
      },
      width: '180px',
    },
    {
      key: 'type',
      header: '',
      accessor: (row) => {
        const group = row as GroupedIncomeEntry;
        return (
          <div className="flex items-center gap-2">
            {!group.isExpanded && (
              <>
                <IncomeTypeIcon
                  type={group.type}
                  frequency={group.frequency ?? undefined}
                />
                <IncomeFrequencyBadge
                  type={group.type}
                  frequency={group.frequency ?? undefined}
                />
              </>
            )}
          </div>
        );
      },
      width: '140px',
    },
    {
      key: 'income',
      header: 'Income',
      accessor: (row) => {
        const group = row as GroupedIncomeEntry;
        return group.isExpanded ? '' : group.displayValues.income;
      },
      align: 'right',
      width: '120px',
    },
    {
      key: 'payPeriods',
      header: 'Pay Periods',
      accessor: (row) => {
        const group = row as GroupedIncomeEntry;
        if (group.isExpanded) return '';
        const periods = group.displayValues.payPeriods;
        return periods || '-';
      },
      align: 'right',
      width: '100px',
    },
    ...createDeductionColumns(false),
    {
      key: 'actions',
      header: '',
      accessor: (row) => {
        const group = row as GroupedIncomeEntry;

        return (
          <div className="flex justify-end group">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteStream(group.streamName, group.entries.length);
              }}
              className="p-1.5 rounded-lg transition-all text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100"
              title={`Delete ${group.streamName}`}
              aria-label={`Delete income stream ${group.streamName}`}
            >
              <LuTrash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
      width: '80px',
      align: 'right',
    },
  ];
}
