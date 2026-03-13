import React from 'react';
import { LuChevronDown, LuChevronRight, LuEllipsis } from 'react-icons/lu';

import type {
  IncomeOccurrence,
  ProjectedIncomeComponent,
  ProjectedIncomeSource,
  RecurringIncomeVersion,
} from '../../types/income';
import { IncomeAmountStack } from '../IncomeAmountStack';

import { BonusEventsTable } from './BonusEventsTable';
import { RecurringPayTable } from './RecurringPayTable';

interface IncomeSourceRowProps {
  source: ProjectedIncomeSource;
  isExpanded: boolean;
  isActionMenuOpen: boolean;
  onToggleExpansion: (sourceId: number) => void;
  onToggleActionMenu: (button: HTMLButtonElement) => void;
  onAddVersion: (component: ProjectedIncomeComponent) => void;
  onEditVersion: (
    component: ProjectedIncomeComponent,
    version: RecurringIncomeVersion,
  ) => void;
  onDeleteVersion: (
    component: ProjectedIncomeComponent,
    version: RecurringIncomeVersion,
  ) => void;
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

export function IncomeSourceRow({
  source,
  isExpanded,
  isActionMenuOpen,
  onToggleExpansion,
  onToggleActionMenu,
  onAddVersion,
  onEditVersion,
  onDeleteVersion,
  onMarkActual,
  onEditBonus,
  onDeleteBonus,
}: IncomeSourceRowProps) {
  const recurringComponents = source.components.filter(
    (component) => component.componentMode === 'recurring',
  );
  const bonusComponents = source.components.filter(
    (component) => component.componentMode === 'occurrence',
  );

  return (
    <React.Fragment>
      <tr className="border-b section-divider align-top hover:bg-gray-50/60">
        <td className="px-4 py-4">
          <button
            type="button"
            className="flex items-start gap-3 text-left"
            onClick={() => onToggleExpansion(source.id)}
          >
            <span className="mt-0.5 rounded-full border border-app p-1 text-muted">
              {isExpanded ? (
                <LuChevronDown className="h-4 w-4" />
              ) : (
                <LuChevronRight className="h-4 w-4" />
              )}
            </span>
            <span>
              <span className="block text-sm font-semibold text-app">
                {source.name}
              </span>
              <span className="mt-1 block text-xs text-muted">
                Expand to review pay history and bonus events
              </span>
            </span>
          </button>
        </td>
        <td className="px-4 py-4 align-middle">
          <IncomeAmountStack
            primaryValue={source.totals.committedGross}
            secondaryValue={source.totals.committedNet}
          />
        </td>
        <td className="px-4 py-4 align-middle">
          <IncomeAmountStack
            primaryValue={source.totals.plannedGross}
            secondaryValue={source.totals.plannedNet}
          />
        </td>
        <td className="px-4 py-4">
          <div className="flex justify-end gap-2">
            <div className="relative">
              <button
                type="button"
                className="icon-button rounded-full border border-app p-2"
                onClick={(event) => onToggleActionMenu(event.currentTarget)}
                title={`More actions for ${source.name}`}
                aria-label={`More actions for income source ${source.name}`}
                aria-haspopup="menu"
                aria-expanded={isActionMenuOpen}
              >
                <LuEllipsis className="h-4 w-4" />
              </button>
            </div>
          </div>
        </td>
      </tr>

      {isExpanded && (
        <tr className="border-b section-divider bg-gray-50/40">
          <td colSpan={4} className="px-4 py-4">
            <div className="space-y-5">
              <div>
                <div className="mb-3 flex items-center justify-between pl-10">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                    Recurring Pay
                  </h4>
                </div>
                <div className="pl-10">
                  <RecurringPayTable
                    components={recurringComponents}
                    onAddVersion={onAddVersion}
                    onEditVersion={onEditVersion}
                    onDeleteVersion={onDeleteVersion}
                  />
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between pl-10">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                    Bonus Events
                  </h4>
                </div>
                <div className="pl-10">
                  <BonusEventsTable
                    components={bonusComponents}
                    onMarkActual={onMarkActual}
                    onEditBonus={onEditBonus}
                    onDeleteBonus={onDeleteBonus}
                  />
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}
