import { LuPencil, LuTrash2 } from 'react-icons/lu';

import { formatWholeCurrency } from '../../utils/incomeViewFormatters';

import type {
  IncomeOccurrence,
  ProjectedIncomeComponent,
} from '../../types/income';
import { getComponentDisplayName } from '../../types/income';
import {
  formatDate,
  getOccurrenceEventDate,
} from '../../utils/incomeViewFormatters';

interface BonusEventsTableProps {
  components: ProjectedIncomeComponent[];
  onEditBonus: (
    component: ProjectedIncomeComponent,
    occurrence: IncomeOccurrence,
  ) => void;
  onDeleteBonus: (
    component: ProjectedIncomeComponent,
    occurrence: IncomeOccurrence,
  ) => void;
}

export function BonusEventsTable({
  components,
  onEditBonus,
  onDeleteBonus,
}: BonusEventsTableProps) {
  if (components.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-app p-4 text-sm text-muted">
        No bonuses tracked for this source yet.
      </div>
    );
  }

  return (
    <div className="table-shell">
      <table className="table-base w-full table-fixed">
        <colgroup>
          <col className="w-[20%]" />
          <col className="w-[24%]" />
          <col className="w-[42%]" />
          <col className="w-[14%]" />
        </colgroup>
        <thead className="table-head">
          <tr>
            <th className="table-header-cell text-left">Bonus</th>
            <th className="table-header-cell text-left">Event Date</th>
            <th className="table-header-cell text-left">Cash Net</th>
            <th className="table-header-cell text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {components.flatMap((component) =>
            component.occurrences.map((occurrence) => (
              <tr
                key={`${component.id}-${occurrence.id}`}
                className="table-row"
              >
                <td className="table-cell px-4 py-3 font-medium text-app">
                  {getComponentDisplayName(component)}
                </td>
                <td className="table-cell px-4 py-3 text-muted">
                  {formatDate(getOccurrenceEventDate(occurrence))}
                </td>
                <td className="table-cell px-4 py-3 font-semibold text-app">
                  {formatWholeCurrency(occurrence.netAmount)}
                </td>
                <td className="table-cell px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="icon-button rounded-full border border-app p-2 text-app transition-colors hover:bg-gray-50"
                      onClick={() => onEditBonus(component, occurrence)}
                      title={`Edit ${getComponentDisplayName(component)} event`}
                      aria-label={`Edit ${getComponentDisplayName(
                        component,
                      )} event`}
                    >
                      <LuPencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="icon-button rounded-full border border-app p-2 text-danger transition-colors hover:bg-red-50"
                      onClick={() => onDeleteBonus(component, occurrence)}
                      title={`Delete ${getComponentDisplayName(
                        component,
                      )} event`}
                      aria-label={`Delete ${getComponentDisplayName(
                        component,
                      )} event`}
                    >
                      <LuTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}
