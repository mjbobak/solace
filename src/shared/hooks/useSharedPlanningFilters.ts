import { useCallback, useEffect, useMemo } from 'react';

import type { SpendBasis } from '@/features/budget/types/budgetView';
import { normalizePlanningYear } from '@/shared/utils/planningYears';
import {
  getNumberParam,
  getStringParam,
  setNumberParam,
  setStringParam,
} from '@/shared/utils/searchParams';
import {
  DEFAULT_SPEND_BASIS,
  isSpendBasis,
  normalizeSpendBasisForPlanningYear,
} from '@/shared/utils/spendBasis';

import { usePlanningYears } from './usePlanningYears';

interface SearchParamsUpdater {
  (nextSearchParams: URLSearchParams, options?: { replace?: boolean }): void;
}

interface UseSharedPlanningFiltersParams {
  searchParams: URLSearchParams;
  setSearchParams: SearchParamsUpdater;
  fallbackYear: number;
  enableLegacyPlanningYearFallback?: boolean;
  enableLegacySpendBasisFallback?: boolean;
}

interface UseSharedPlanningFiltersResult {
  availableYears: number[];
  isLoading: boolean;
  planningYear: number;
  spendBasis: SpendBasis;
  setPlanningYear: (year: number) => void;
  setSpendBasis: (spendBasis: SpendBasis) => void;
  setPlanningFilters: (params: {
    planningYear: number;
    spendBasis: SpendBasis;
  }) => void;
}

function syncSharedPlanningParams(params: {
  searchParams: URLSearchParams;
  planningYear?: number;
  spendBasis?: SpendBasis;
}): URLSearchParams {
  const { searchParams, planningYear, spendBasis } = params;
  const nextSearchParams = new URLSearchParams(searchParams);

  if (planningYear !== undefined) {
    setNumberParam(nextSearchParams, 'planningYear', planningYear);
  }

  if (spendBasis !== undefined) {
    setStringParam(nextSearchParams, 'spendBasis', spendBasis);
  }

  return nextSearchParams;
}

function getRequestedPlanningYear(
  searchParams: URLSearchParams,
  fallbackYear: number,
  enableLegacyPlanningYearFallback: boolean,
): number {
  const currentValue = getNumberParam(searchParams, 'planningYear');

  if (currentValue !== undefined) {
    return currentValue;
  }

  if (enableLegacyPlanningYearFallback) {
    const legacyValue = getNumberParam(searchParams, 'year');
    if (legacyValue !== undefined) {
      return legacyValue;
    }
  }

  return fallbackYear;
}

function getRequestedSpendBasis(
  searchParams: URLSearchParams,
  enableLegacySpendBasisFallback: boolean,
): SpendBasis {
  const currentValue = getStringParam(searchParams, 'spendBasis');

  if (isSpendBasis(currentValue)) {
    return currentValue;
  }

  if (enableLegacySpendBasisFallback) {
    const legacyValue = getStringParam(searchParams, 'basis');
    if (isSpendBasis(legacyValue)) {
      return legacyValue;
    }
  }

  return DEFAULT_SPEND_BASIS;
}

export function useSharedPlanningFilters({
  searchParams,
  setSearchParams,
  fallbackYear,
  enableLegacyPlanningYearFallback = false,
  enableLegacySpendBasisFallback = false,
}: UseSharedPlanningFiltersParams): UseSharedPlanningFiltersResult {
  const { years: availableYears, isLoading } = usePlanningYears();

  const requestedYear = useMemo(
    () =>
      getRequestedPlanningYear(
        searchParams,
        fallbackYear,
        enableLegacyPlanningYearFallback,
      ),
    [
      enableLegacyPlanningYearFallback,
      fallbackYear,
      searchParams,
    ],
  );

  const planningYear = useMemo(() => {
    if (isLoading) {
      return requestedYear;
    }

    return normalizePlanningYear({
      requestedYear,
      availableYears,
      fallbackYear,
    });
  }, [availableYears, fallbackYear, isLoading, requestedYear]);

  const spendBasis = useMemo(
    () =>
      normalizeSpendBasisForPlanningYear(
        getRequestedSpendBasis(searchParams, enableLegacySpendBasisFallback),
        planningYear,
      ),
    [enableLegacySpendBasisFallback, planningYear, searchParams],
  );

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const nextSearchParams = syncSharedPlanningParams({
      searchParams,
      planningYear,
      spendBasis,
    });
    let hasChanges = false;

    if (getNumberParam(searchParams, 'planningYear') !== planningYear) {
      hasChanges = true;
    }

    if (getStringParam(searchParams, 'spendBasis') !== spendBasis) {
      hasChanges = true;
    }

    if (enableLegacyPlanningYearFallback && searchParams.has('year')) {
      nextSearchParams.delete('year');
      hasChanges = true;
    }

    if (enableLegacySpendBasisFallback && searchParams.has('basis')) {
      nextSearchParams.delete('basis');
      hasChanges = true;
    }

    if (!hasChanges) {
      return;
    }

    setSearchParams(nextSearchParams, { replace: true });
  }, [
    enableLegacyPlanningYearFallback,
    enableLegacySpendBasisFallback,
    isLoading,
    planningYear,
    searchParams,
    setSearchParams,
    spendBasis,
  ]);

  const setPlanningYear = useCallback(
    (year: number) => {
      const nextSearchParams = syncSharedPlanningParams({
        searchParams,
        planningYear: year,
      });
      setSearchParams(nextSearchParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setSpendBasis = useCallback(
    (nextSpendBasis: SpendBasis) => {
      const nextSearchParams = syncSharedPlanningParams({
        searchParams,
        spendBasis: nextSpendBasis,
      });
      setSearchParams(nextSearchParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setPlanningFilters = useCallback(
    (params: { planningYear: number; spendBasis: SpendBasis }) => {
      const nextSearchParams = syncSharedPlanningParams({
        searchParams,
        planningYear: params.planningYear,
        spendBasis: normalizeSpendBasisForPlanningYear(
          params.spendBasis,
          params.planningYear,
        ),
      });
      setSearchParams(nextSearchParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  return {
    availableYears,
    isLoading,
    planningYear,
    spendBasis,
    setPlanningYear,
    setSpendBasis,
    setPlanningFilters,
  };
}
