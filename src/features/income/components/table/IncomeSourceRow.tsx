import React, { useState } from 'react';
import { LuChevronDown, LuChevronRight, LuEllipsis } from 'react-icons/lu';

import { Button } from '@/shared/components/Button';
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
  onAddBonus: (source: ProjectedIncomeSource) => void;
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
  onAddBonus,
  onDeleteVersion,
  onMarkActual,
  onEditBonus,
  onDeleteBonus,
}: IncomeSourceRowProps) {
  const [activeTab, setActiveTab] = useState<'recurring' | 'bonus'>(
    'recurring',
  );
  const recurringComponents = source.components.filter(
    (component) => component.componentMode === 'recurring',
  );
  const bonusComponents = source.components.filter(
    (component) => component.componentMode === 'occurrence',
  );
  const activeRecurringComponent = recurringComponents[0] ?? null;
  const bonusCount = bonusComponents.reduce(
    (count, component) => count + component.occurrences.length,
    0,
  );

  const handleAddEvent = () => {
    if (activeTab === 'bonus') {
      onAddBonus(source);
      return;
    }

    if (activeRecurringComponent) {
      onAddVersion(activeRecurringComponent);
    }
  };

  return (
    <React.Fragment>
      <tr className="border-b section-divider align-top transition-colors hover:bg-gray-50/35">
        <td className="px-5 py-3.5">
          <button
            type="button"
            className="flex items-start gap-3 text-left"
            onClick={() => onToggleExpansion(source.id)}
          >
            <span className="mt-1 text-gray-300">
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
        <td className="px-6 py-5 align-middle">
          <IncomeAmountStack
            primaryValue={source.totals.plannedGross}
            secondaryValue={source.totals.plannedGross / 12}
          />
        </td>
        <td className="px-6 py-5 align-middle">
          <IncomeAmountStack
            primaryValue={source.totals.plannedNet}
            secondaryValue={source.totals.plannedNet / 12}
          />
        </td>
        <td className="px-5 py-3.5">
          <div className="flex justify-end">
            <div className="relative">
              <button
                type="button"
                className="icon-button p-1 text-gray-300 hover:bg-transparent hover:text-gray-400"
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
          <td colSpan={4} className="px-6 py-5">
            <div className="pl-10">
              <div className="overflow-hidden rounded-2xl border border-app bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <div className="border-b section-divider bg-gray-50/70 px-5 py-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className={`border-b-2 px-1 pb-3 pt-1 text-sm font-semibold transition-colors ${
                          activeTab === 'recurring'
                            ? 'border-teal-500 text-teal-600'
                            : 'border-transparent text-muted hover:text-app'
                        }`}
                        onClick={() => setActiveTab('recurring')}
                        aria-pressed={activeTab === 'recurring'}
                      >
                        Recurring Pay
                      </button>
                      <button
                        type="button"
                        className={`inline-flex items-center gap-2 border-b-2 px-1 pb-3 pt-1 text-sm font-semibold transition-colors ${
                          activeTab === 'bonus'
                            ? 'border-teal-500 text-teal-600'
                            : 'border-transparent text-muted hover:text-app'
                        }`}
                        onClick={() => setActiveTab('bonus')}
                        aria-pressed={activeTab === 'bonus'}
                      >
                        <span>Bonus Events</span>
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-muted">
                          {bonusCount}
                        </span>
                      </button>
                    </div>
                    <Button
                      variant="secondary"
                      className="px-3 py-2 text-xs"
                      onClick={handleAddEvent}
                      disabled={
                        activeTab === 'recurring' && !activeRecurringComponent
                      }
                    >
                      Add Event
                    </Button>
                  </div>
                </div>
                <div className="p-5">
                  {activeTab === 'recurring' ? (
                    <RecurringPayTable
                      components={recurringComponents}
                      onAddVersion={onAddVersion}
                      onEditVersion={onEditVersion}
                      onDeleteVersion={onDeleteVersion}
                    />
                  ) : (
                    <BonusEventsTable
                      components={bonusComponents}
                      onMarkActual={onMarkActual}
                      onEditBonus={onEditBonus}
                      onDeleteBonus={onDeleteBonus}
                    />
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}
