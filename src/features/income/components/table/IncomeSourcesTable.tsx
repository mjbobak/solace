import { Button } from '@/shared/components/Button';

import type {
  IncomeOccurrence,
  ProjectedIncomeComponent,
  ProjectedIncomeSource,
  RecurringIncomeVersion,
} from '../../types/income';

import { IncomeSourceRow } from './IncomeSourceRow';

interface IncomeSourcesTableProps {
  isLoading: boolean;
  hasProjection: boolean;
  sources: ProjectedIncomeSource[];
  expandedSources: Set<number>;
  openActionMenuSourceId: number | null;
  onOpenAddSource: () => void;
  onToggleSourceExpansion: (sourceId: number) => void;
  onToggleActionMenu: (sourceId: number, button: HTMLButtonElement) => void;
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

export function IncomeSourcesTable({
  isLoading,
  hasProjection,
  sources,
  expandedSources,
  openActionMenuSourceId,
  onOpenAddSource,
  onToggleSourceExpansion,
  onToggleActionMenu,
  onAddVersion,
  onEditVersion,
  onAddBonus,
  onDeleteVersion,
  onEditBonus,
  onDeleteBonus,
}: IncomeSourcesTableProps) {
  if (isLoading && !hasProjection) {
    return (
      <div className="surface-card py-16 text-center text-muted">
        Loading income plan...
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="surface-card space-y-4 py-14 text-center">
        <div>
          <p className="text-lg font-semibold text-app">No income data yet</p>
          <p className="mt-2 text-sm text-muted">
            Start by adding an income source and the first recurring pay
            version.
          </p>
        </div>
        <div className="flex justify-center">
          <Button onClick={onOpenAddSource}>Add Income Source</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[44%]" />
            <col className="w-[24%]" />
            <col className="w-[28%]" />
            <col className="w-[4%]" />
          </colgroup>
          <thead className="table-head text-left">
            <tr>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-app">
                Source
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-app">
                Gross
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-app">
                Net
              </th>
              <th className="w-px whitespace-nowrap px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.16em] text-app">
              </th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <IncomeSourceRow
                key={source.id}
                source={source}
                isExpanded={expandedSources.has(source.id)}
                isActionMenuOpen={openActionMenuSourceId === source.id}
                onToggleExpansion={onToggleSourceExpansion}
                onToggleActionMenu={(button) =>
                  onToggleActionMenu(source.id, button)
                }
                onAddVersion={onAddVersion}
                onEditVersion={onEditVersion}
                onAddBonus={onAddBonus}
                onDeleteVersion={onDeleteVersion}
                onEditBonus={onEditBonus}
                onDeleteBonus={onDeleteBonus}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
