import { useMemo } from 'react';

import type {
  IncomeProjectionTotals,
  ProjectedIncomeSource,
} from '../types/income';

export type IncomeOverviewMode = 'all' | 'salary' | 'bonus';

const TOTAL_KEYS = [
  'committedGross',
  'committedCashNet',
  'committedNet',
  'plannedGross',
  'plannedCashNet',
  'plannedNet',
] as const;

const buildTotals = (
  value: (key: (typeof TOTAL_KEYS)[number]) => number,
): IncomeProjectionTotals =>
  Object.fromEntries(
    TOTAL_KEYS.map((key) => [key, value(key)]),
  ) as unknown as IncomeProjectionTotals;

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
    if (mode === 'all') return totals;

    const bonuses = sources
      .flatMap((source) => source.components)
      .filter((component) => component.componentType === 'bonus');
    const bonusTotals = buildTotals((key) =>
      bonuses.reduce((sum, component) => sum + component.totals[key], 0),
    );

    return mode === 'bonus'
      ? bonusTotals
      : buildTotals((key) => totals[key] - bonusTotals[key]);
  }, [totals, sources, mode]);
}
