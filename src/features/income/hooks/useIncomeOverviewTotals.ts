import { useMemo } from 'react';

import type {
  IncomeProjectionTotals,
  ProjectedIncomeSource,
} from '../types/income';
import { EMPTY_PROJECTION_TOTALS } from '../types/incomeView';

export type IncomeOverviewMode = 'all' | 'salary' | 'bonus';

function sumBonusTotals(
  sources: ProjectedIncomeSource[],
): IncomeProjectionTotals {
  return sources
    .flatMap((source) => source.components)
    .filter((component) => component.componentType === 'bonus')
    .reduce<IncomeProjectionTotals>(
      (acc, component) => ({
        committedGross: acc.committedGross + component.totals.committedGross,
        committedCashNet:
          acc.committedCashNet + component.totals.committedCashNet,
        committedNet: acc.committedNet + component.totals.committedNet,
        plannedGross: acc.plannedGross + component.totals.plannedGross,
        plannedCashNet: acc.plannedCashNet + component.totals.plannedCashNet,
        plannedNet: acc.plannedNet + component.totals.plannedNet,
      }),
      EMPTY_PROJECTION_TOTALS,
    );
}

/**
 * Returns the projection totals to display in the income overview:
 * everything, salary only (bonuses excluded), or bonuses only.
 */
export function useIncomeOverviewTotals(
  totals: IncomeProjectionTotals,
  sources: ProjectedIncomeSource[],
  mode: IncomeOverviewMode,
): IncomeProjectionTotals {
  return useMemo(() => {
    if (mode === 'all') {
      return totals;
    }

    const bonusTotals = sumBonusTotals(sources);
    if (mode === 'bonus') {
      return bonusTotals;
    }

    return {
      committedGross: totals.committedGross - bonusTotals.committedGross,
      committedCashNet: totals.committedCashNet - bonusTotals.committedCashNet,
      committedNet: totals.committedNet - bonusTotals.committedNet,
      plannedGross: totals.plannedGross - bonusTotals.plannedGross,
      plannedCashNet: totals.plannedCashNet - bonusTotals.plannedCashNet,
      plannedNet: totals.plannedNet - bonusTotals.plannedNet,
    };
  }, [totals, sources, mode]);
}
