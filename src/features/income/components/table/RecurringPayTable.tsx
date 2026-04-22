import React, { useState } from 'react';
import { LuPencil, LuTrash2 } from 'react-icons/lu';

import { formatWholeCurrency } from '../../utils/incomeViewFormatters';

import type {
  ProjectedIncomeComponent,
  RecurringIncomeVersion,
} from '../../types/income';
import { getComponentDisplayName } from '../../types/income';
import {
  formatDate,
} from '../../utils/incomeViewFormatters';

interface RecurringPayTableProps {
  components: ProjectedIncomeComponent[];
  onEditVersion: (
    component: ProjectedIncomeComponent,
    version: RecurringIncomeVersion,
  ) => void;
  onDeleteVersion: (
    component: ProjectedIncomeComponent,
    version: RecurringIncomeVersion,
  ) => void;
}

export function RecurringPayTable({
  components,
  onEditVersion,
  onDeleteVersion,
}: RecurringPayTableProps) {
  const [expandedHistory, setExpandedHistory] = useState<Set<number>>(
    () => new Set(),
  );
  const formatNetSummary = (netAmount: number, periodsPerYear: number) =>
    `${formatWholeCurrency(netAmount)} x ${periodsPerYear}`;

  const toggleHistory = (componentId: number) => {
    setExpandedHistory((current) => {
      const next = new Set(current);

      if (next.has(componentId)) {
        next.delete(componentId);
      } else {
        next.add(componentId);
      }

      return next;
    });
  };

  if (components.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-app p-4 text-sm text-muted">
        No recurring components tracked for this source.
      </div>
    );
  }

  return (
    <div className="table-shell">
      <table className="table-base">
        <thead className="table-head">
          <tr>
            <th className="table-header-cell text-left">Component</th>
            <th className="table-header-cell text-left">Active Range</th>
            <th className="table-header-cell text-right">Paycheck Value</th>
            <th className="table-header-cell text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {components.map((component) => {
            const hasHistory = component.versions.length > 0;
            const isHistoryExpanded = expandedHistory.has(component.id);

            return (
              <React.Fragment key={component.id}>
                <tr className="table-row align-top">
                  <td className="table-cell px-4 py-3 font-medium text-app">
                    {getComponentDisplayName(component)}
                  </td>
                  <td className="table-cell px-4 py-3 text-muted">
                    {component.currentVersion
                      ? `${formatDate(
                          component.currentVersion.startDate,
                        )} to ${formatDate(component.currentVersion.endDate)}`
                      : 'No active version'}
                  </td>
                  <td className="table-cell px-4 py-3 text-right text-app">
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="flex items-baseline gap-1.5">
                        <span>
                          {component.currentVersion
                            ? formatWholeCurrency(
                                component.currentVersion.grossAmount,
                              )
                            : formatWholeCurrency(component.totals.plannedCashNet)}
                        </span>
                        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                          Gross
                        </span>
                      </span>
                      <span className="flex items-baseline gap-1.5">
                        <span className="text-xs font-semibold text-muted">
                          {component.currentVersion
                            ? formatNetSummary(
                                component.currentVersion.netAmount,
                                component.currentVersion.periodsPerYear,
                              )
                            : formatWholeCurrency(
                                component.totals.plannedCashNet,
                              )}
                        </span>
                        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                          Net
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="table-cell px-4 py-3" />
                </tr>
                {hasHistory && (
                  <tr className="table-row table-row-striped">
                    <td colSpan={4} className="table-cell px-4 py-2">
                      <div className="flex justify-center">
                        <button
                          type="button"
                          className="text-xs font-medium text-muted transition-colors hover:text-app"
                          onClick={() => toggleHistory(component.id)}
                        >
                          {isHistoryExpanded ? 'Hide History' : 'Show History'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {isHistoryExpanded &&
                  component.versions.map((version) => (
                    <tr
                      key={version.id}
                      className="table-row table-row-striped text-xs text-gray-400/80"
                    >
                      <td className="table-cell px-4 py-2 pl-10">History</td>
                      <td className="table-cell px-4 py-2">
                        {formatDate(version.startDate)} to{' '}
                        {formatDate(version.endDate)}
                      </td>
                      <td className="table-cell px-4 py-2 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="flex items-baseline gap-1.5">
                            <span>{formatWholeCurrency(version.grossAmount)}</span>
                            <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                              Gross
                            </span>
                          </span>
                          <span className="flex items-baseline gap-1.5">
                            <span>
                              {formatNetSummary(
                                version.netAmount,
                                version.periodsPerYear,
                              )}
                            </span>
                            <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                              Net
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="table-cell px-4 py-2">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="icon-button rounded-full border border-app p-2 text-app transition-colors hover:bg-white"
                            onClick={() => onEditVersion(component, version)}
                            title={`Edit ${getComponentDisplayName(
                              component,
                            )} change`}
                            aria-label={`Edit ${getComponentDisplayName(
                              component,
                            )} change`}
                          >
                            <LuPencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="icon-button rounded-full border border-app p-2 text-danger transition-colors hover:bg-white"
                            onClick={() => onDeleteVersion(component, version)}
                            title={`Delete ${getComponentDisplayName(
                              component,
                            )} change`}
                            aria-label={`Delete ${getComponentDisplayName(
                              component,
                            )} change`}
                          >
                            <LuTrash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
