import { useCallback, useEffect, useMemo } from 'react';

import { normalizePlanningYear } from '@/shared/utils/planningYears';
import { getNumberParam, setNumberParam } from '@/shared/utils/searchParams';

import { usePlanningYears } from './usePlanningYears';

interface SearchParamsUpdater {
  (nextSearchParams: URLSearchParams, options?: { replace?: boolean }): void;
}

interface UsePlanningYearSelectionParams {
  searchParams: URLSearchParams;
  setSearchParams: SearchParamsUpdater;
  fallbackYear: number;
}

interface UsePlanningYearSelectionResult {
  availableYears: number[];
  isLoading: boolean;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
}

function getRequestedPlanningYear(
  searchParams: URLSearchParams,
  fallbackYear: number,
): number {
  return getNumberParam(searchParams, 'year') ?? fallbackYear;
}

export function usePlanningYearSelection({
  searchParams,
  setSearchParams,
  fallbackYear,
}: UsePlanningYearSelectionParams): UsePlanningYearSelectionResult {
  const { years: availableYears, isLoading } = usePlanningYears();

  const requestedYear = useMemo(
    () => getRequestedPlanningYear(searchParams, fallbackYear),
    [fallbackYear, searchParams],
  );

  const selectedYear = useMemo(() => {
    if (isLoading) {
      return requestedYear;
    }

    return normalizePlanningYear({
      requestedYear,
      availableYears,
      fallbackYear,
    });
  }, [availableYears, fallbackYear, isLoading, requestedYear]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const normalizedYear = normalizePlanningYear({
      requestedYear,
      availableYears,
      fallbackYear,
    });

    if (normalizedYear === requestedYear) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);
    setNumberParam(nextSearchParams, 'year', normalizedYear);
    setSearchParams(nextSearchParams, { replace: true });
  }, [
    availableYears,
    fallbackYear,
    isLoading,
    requestedYear,
    searchParams,
    setSearchParams,
  ]);

  const setSelectedYear = useCallback(
    (year: number) => {
      const nextSearchParams = new URLSearchParams(searchParams);
      setNumberParam(nextSearchParams, 'year', year);
      setSearchParams(nextSearchParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  return {
    availableYears,
    isLoading,
    selectedYear,
    setSelectedYear,
  };
}
