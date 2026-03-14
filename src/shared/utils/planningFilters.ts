import type { SpendBasis } from '@/features/budget/types/budgetView';
import { getAvailableSpendBasisOptions } from '@/shared/utils/spendBasis';

export interface PlanningFilterOption {
  value: string;
  planningYear: number;
  spendBasis: SpendBasis;
  basisLabel: string;
  label: string;
}

export function encodePlanningFilterValue(
  planningYear: number,
  spendBasis: SpendBasis,
): string {
  return `${planningYear}:${spendBasis}`;
}

export function buildPlanningFilterOptions(params: {
  availableYears: number[];
  currentYear?: number;
}): PlanningFilterOption[] {
  const { availableYears, currentYear = new Date().getFullYear() } = params;
  const uniqueYears = [...new Set(availableYears)].sort((a, b) => b - a);

  return uniqueYears.flatMap((planningYear) =>
    getAvailableSpendBasisOptions(planningYear, currentYear).map((option) => ({
      value: encodePlanningFilterValue(planningYear, option.value),
      planningYear,
      spendBasis: option.value,
      basisLabel: option.label,
      label: `${planningYear} • ${option.label}`,
    })),
  );
}
