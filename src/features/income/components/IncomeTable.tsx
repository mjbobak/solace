/**
 * Income table component
 * Renders grouped income entries with expansion for viewing history
 */

import React from 'react';
import { LuPlus } from 'react-icons/lu';

import type { Column } from '@/shared/components/data/Table';

import type {
  EffectiveDateRangeWithEntry,
  GroupedIncomeEntry,
  IncomeDisplayType,
  IncomePeriod,
} from '../types/incomeView';
import { calculateDisplayValues } from '../utils/incomeCalculations';

interface IncomeTableProps {
  data: GroupedIncomeEntry[];
  columns: Column<GroupedIncomeEntry | EffectiveDateRangeWithEntry>[];
  childColumns: Column<GroupedIncomeEntry | EffectiveDateRangeWithEntry>[];
  period: IncomePeriod;
  displayType: IncomeDisplayType;
  onAddRange: (group: GroupedIncomeEntry) => void;
}

export const IncomeTable: React.FC<IncomeTableProps> = ({
  data,
  columns,
  childColumns,
  period,
  displayType,
  onAddRange,
}) => {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className="w-full border-collapse"
        role="table"
        aria-label="Income entries table"
      >
        <thead
          className="bg-gray-50 border-b border-gray-200 sticky top-0"
          role="rowgroup"
        >
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-left ${
                  column.sortable
                    ? 'cursor-pointer select-none hover:bg-gray-100'
                    : ''
                }`}
                style={{
                  width: column.width,
                  textAlign: column.align === 'right' ? 'right' : 'left',
                }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {data.length === 0 ? (
            <tr role="row">
              <td
                colSpan={columns.length}
                className="px-3 py-8 text-center text-gray-500"
                role="cell"
              >
                No income entries found
              </td>
            </tr>
          ) : (
            data.map((group, groupIndex) => {
              // Collapsed state: simple row with zebra striping
              if (!group.isExpanded) {
                return (
                  <tr
                    key={group.streamName}
                    role="row"
                    className={`border-b border-gray-100 ${
                      groupIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        role="cell"
                        className="px-3 py-2 text-xs text-gray-900"
                        style={{
                          width: column.width,
                          textAlign:
                            column.align === 'right'
                              ? 'right'
                              : column.align === 'center'
                                ? 'center'
                                : 'left',
                        }}
                      >
                        {column.accessor(group)}
                      </td>
                    ))}
                  </tr>
                );
              }

              // Expanded state: container with nested table
              return (
                <tr key={group.streamName} role="row">
                  <td colSpan={columns.length} className="p-0">
                    <div
                      className="mb-4 rounded-xl border border-gray-200/80 overflow-hidden
                                    bg-gradient-to-br from-gray-50/50 to-blue-50/30
                                    shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      <table className="w-full border-collapse">
                        {/* Parent Row (Grouped Entry) */}
                        <tbody>
                          <tr role="row" className="border-b border-gray-100">
                            {columns.map((column) => (
                              <td
                                key={column.key}
                                role="cell"
                                className="px-3 py-2 text-xs text-gray-900"
                                style={{
                                  width: column.width,
                                  textAlign:
                                    column.align === 'right'
                                      ? 'right'
                                      : column.align === 'center'
                                        ? 'center'
                                        : 'left',
                                }}
                              >
                                {column.accessor(group)}
                              </td>
                            ))}
                          </tr>

                          {/* Child Rows (History) - Shown when Expanded */}
                          {group.allRanges.map((range) => {
                            // Calculate display values for this range (use 'net' for breakdown)
                            const effectiveDisplayType =
                              displayType === 'breakdown' ? 'net' : displayType;
                            const displayValues = calculateDisplayValues(
                              range,
                              period,
                              effectiveDisplayType,
                            );

                            return (
                              <tr
                                key={range.id}
                                role="row"
                                className="border-b border-gray-100/50 bg-gray-100"
                              >
                                {childColumns.map((column) => {
                                  let cellContent: React.ReactNode;

                                  // Special handling for columns that need display values
                                  if (column.key === 'childIncome') {
                                    cellContent = displayValues.income;
                                  } else if (column.key === 'childFederalTax') {
                                    cellContent = displayValues.federalTax;
                                  } else if (column.key === 'childStateTax') {
                                    cellContent = displayValues.stateTax;
                                  } else if (column.key === 'childFica') {
                                    cellContent = displayValues.fica;
                                  } else if (column.key === 'childRetirement') {
                                    cellContent = displayValues.retirement;
                                  } else if (
                                    column.key === 'childHealthInsurance'
                                  ) {
                                    cellContent = displayValues.healthInsurance;
                                  } else {
                                    cellContent = column.accessor(range);
                                  }

                                  return (
                                    <td
                                      key={column.key}
                                      role="cell"
                                      className="px-3 py-2 text-xs text-gray-700"
                                      style={{
                                        width: column.width,
                                        textAlign:
                                          column.align === 'right'
                                            ? 'right'
                                            : column.align === 'center'
                                              ? 'center'
                                              : 'left',
                                      }}
                                    >
                                      {cellContent}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}

                          {/* Add Date Range Button - Shown when Expanded */}
                          {group.isExpanded && (
                            <tr role="row" className="bg-gray-100">
                              <td
                                colSpan={childColumns.length}
                                className="px-3 py-3"
                                role="cell"
                              >
                                <button
                                  onClick={() => onAddRange(group)}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-3
                                             bg-white
                                             hover:bg-gray-50
                                             border border-dashed border-gray-600
                                             hover:border-gray-900 rounded-lg
                                             transition-all duration-200 ease-out
                                             hover:scale-[1.0] active:scale-[0.99]
                                             text-sm font-medium text-gray-600
                                             hover:text-gray-900 shadow-sm"
                                >
                                  <LuPlus className="w-4 h-4" />
                                  Add Date Range
                                </button>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
