import { LuPencil, LuTrash2 } from 'react-icons/lu';

import { Button } from '@/shared/components/Button';
import { formatWholeCurrency } from '../../utils/incomeViewFormatters';

import type {
  IncomeOccurrence,
  ProjectedIncomeComponent,
} from '../../types/income';
import { getComponentDisplayName } from '../../types/income';
import {
  formatDate,
  getOccurrenceEventDate,
  OCCURRENCE_STATUS_BADGE_CLASSES,
} from '../../utils/incomeViewFormatters';

interface BonusEventsTableProps {
  components: ProjectedIncomeComponent[];
  onMarkActual: (occurrence: IncomeOccurrence) => void;
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
  onMarkActual,
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
    <div className="overflow-x-auto rounded-xl border border-app bg-white">
      <table className="w-full text-sm">
        <thead className="border-b section-divider bg-gray-200 text-left text-gray-700 text-muted">
          <tr>
            <th className="px-4 py-3">Bonus</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Event Date</th>
            <th className="px-4 py-3 text-right">Cash Net</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {components.flatMap((component) =>
            component.occurrences.map((occurrence) => (
              <tr
                key={`${component.id}-${occurrence.id}`}
                className="border-b section-divider"
              >
                <td className="px-4 py-3 font-medium text-app">
                  {getComponentDisplayName(component)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                      OCCURRENCE_STATUS_BADGE_CLASSES[occurrence.status]
                    }`}
                  >
                    {occurrence.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">
                  {formatDate(getOccurrenceEventDate(occurrence))}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-app">
                  {formatWholeCurrency(occurrence.netAmount)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {occurrence.status === 'expected' ? (
                      <Button
                        variant="secondary"
                        className="px-3 py-2 text-xs"
                        onClick={() => onMarkActual(occurrence)}
                      >
                        Mark Actual
                      </Button>
                    ) : (
                      <span className="text-xs text-muted"></span>
                    )}
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
