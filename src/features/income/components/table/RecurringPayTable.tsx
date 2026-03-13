import React from 'react';
import { LuPencil, LuTrash2 } from 'react-icons/lu';

import { Button } from '@/shared/components/Button';
import { formatCurrency } from '@/shared/utils/currency';

import type {
  ProjectedIncomeComponent,
  RecurringIncomeVersion,
} from '../../types/income';
import { getComponentDisplayName } from '../../types/income';
import {
  formatDate,
  formatNetRangeSummary,
} from '../../utils/incomeViewFormatters';

interface RecurringPayTableProps {
  components: ProjectedIncomeComponent[];
  onAddVersion: (component: ProjectedIncomeComponent) => void;
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
  onAddVersion,
  onEditVersion,
  onDeleteVersion,
}: RecurringPayTableProps) {
  if (components.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-app p-4 text-sm text-muted">
        No recurring components tracked for this source.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-app bg-white">
      <table className="w-full text-sm">
        <thead className="border-b section-divider bg-gray-200 text-gray-700 text-left text-muted">
          <tr>
            <th className="px-4 py-3">Component</th>
            <th className="px-4 py-3">Active Range</th>
            <th className="px-4 py-3">Current Pay</th>
            <th className="px-4 py-3 text-right">Planned Net</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {components.map((component) => (
            <React.Fragment key={component.id}>
              <tr className="border-b section-divider align-top">
                <td className="px-4 py-3 font-medium text-app">
                  {getComponentDisplayName(component)}
                </td>
                <td className="px-4 py-3 text-muted">
                  {component.currentVersion
                    ? `${formatDate(component.currentVersion.startDate)} to ${formatDate(component.currentVersion.endDate)}`
                    : 'No active version'}
                </td>
                <td className="px-4 py-3 text-muted">
                  {formatNetRangeSummary(component)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-app">
                  {formatCurrency(component.totals.plannedNet)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      className="px-3 py-2 text-xs"
                      onClick={() => onAddVersion(component)}
                    >
                      Add Promotion
                    </Button>
                  </div>
                </td>
              </tr>
              {component.versions.map((version) => (
                <tr
                  key={version.id}
                  className="border-b section-divider bg-gray-50/70 text-xs text-muted text-gray-400"
                >
                  <td className="px-4 py-2 pl-10">History</td>
                  <td className="px-4 py-2">
                    {formatDate(version.startDate)} to{' '}
                    {formatDate(version.endDate)}
                  </td>
                  <td className="px-4 py-2">
                    {formatCurrency(version.netAmount)} net x{' '}
                    {version.periodsPerYear}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatCurrency(version.grossAmount)} gross
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="icon-button rounded-full border border-app p-2 text-app transition-colors hover:bg-white"
                        onClick={() => onEditVersion(component, version)}
                        title={`Edit ${getComponentDisplayName(component)} change`}
                        aria-label={`Edit ${getComponentDisplayName(component)} change`}
                      >
                        <LuPencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="icon-button rounded-full border border-app p-2 text-danger transition-colors hover:bg-white"
                        onClick={() => onDeleteVersion(component, version)}
                        title={`Delete ${getComponentDisplayName(component)} change`}
                        aria-label={`Delete ${getComponentDisplayName(component)} change`}
                      >
                        <LuTrash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
