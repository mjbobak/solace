import React, { useState } from 'react';
import { LuEllipsis } from 'react-icons/lu';

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

  const handleAddEvent = () => {
    if (activeTab === 'bonus') {
      onAddBonus(source);
      return;
    }

    if (activeRecurringComponent) {
      onAddVersion(activeRecurringComponent);
    }
  };

  const toggleExpansion = () => {
    onToggleExpansion(source.id);
  };

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    toggleExpansion();
  };

  return (
    <React.Fragment>
      <tr
        className="border-b section-divider table-row-hover align-top transition-colors cursor-pointer"
        onClick={toggleExpansion}
        onKeyDown={handleRowKeyDown}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} income source ${source.name}`}
      >
        <td className="px-5 py-3.5">
          <span>
            <span className="block text-sm font-semibold text-app">
              {source.name}
            </span>
            <span className="mt-1 block text-xs text-muted">
              Expand to review pay history and bonus events
            </span>
          </span>
        </td>
        <td className="px-4 py-5 align-middle">
          <IncomeAmountStack
            primaryValue={source.totals.plannedGross}
            secondaryValue={source.totals.plannedGross / 12}
          />
        </td>
        <td className="px-4 py-5 align-middle">
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
                className="icon-button p-1 hover:bg-transparent"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleActionMenu(event.currentTarget);
                }}
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
        <tr className="border-b section-divider income-history-toggle-row">
          <td colSpan={4} className="px-5 pb-5 pt-2">
            <div>
              <div className="px-1">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className={`income-detail-tab ${
                        activeTab === 'recurring'
                          ? 'income-detail-tab-active'
                          : 'income-detail-tab-inactive'
                      }`}
                      onClick={() => setActiveTab('recurring')}
                      aria-pressed={activeTab === 'recurring'}
                    >
                      Recurring Pay
                    </button>
                    <button
                      type="button"
                      className={`inline-flex items-center gap-2 income-detail-tab ${
                        activeTab === 'bonus'
                          ? 'income-detail-tab-active'
                          : 'income-detail-tab-inactive'
                      }`}
                      onClick={() => setActiveTab('bonus')}
                      aria-pressed={activeTab === 'bonus'}
                    >
                      <span>Bonus Events</span>
                    </button>
                  </div>
                  <Button
                    variant="primary"
                    className="income-action-button-compact"
                    onClick={handleAddEvent}
                    disabled={
                      activeTab === 'recurring' && !activeRecurringComponent
                    }
                  >
                    Add Event
                  </Button>
                </div>
              </div>
              <div className="pt-4">
                  {activeTab === 'recurring' ? (
                    <RecurringPayTable
                      components={recurringComponents}
                      onEditVersion={onEditVersion}
                      onDeleteVersion={onDeleteVersion}
                    />
                ) : (
                  <BonusEventsTable
                    components={bonusComponents}
                    onEditBonus={onEditBonus}
                    onDeleteBonus={onDeleteBonus}
                  />
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}
