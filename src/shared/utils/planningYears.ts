export const MINIMUM_PLANNING_YEAR = 2025;

export function sortPlanningYears(years: Iterable<number>): number[] {
  return Array.from(new Set(years))
    .filter(
      (year): year is number =>
        Number.isInteger(year) && year >= MINIMUM_PLANNING_YEAR,
    )
    .sort((left, right) => left - right);
}

export function getFallbackPlanningYear(
  years: number[],
  fallbackYear: number,
): number {
  const normalizedYears = sortPlanningYears(years);
  if (normalizedYears.length > 0) {
    return normalizedYears[normalizedYears.length - 1];
  }

  return Math.max(fallbackYear, MINIMUM_PLANNING_YEAR);
}

export function normalizePlanningYear(params: {
  requestedYear: number;
  availableYears: number[];
  fallbackYear: number;
}): number {
  const { requestedYear, availableYears, fallbackYear } = params;
  const normalizedYears = sortPlanningYears(availableYears);

  if (normalizedYears.includes(requestedYear)) {
    return requestedYear;
  }

  return getFallbackPlanningYear(normalizedYears, fallbackYear);
}
