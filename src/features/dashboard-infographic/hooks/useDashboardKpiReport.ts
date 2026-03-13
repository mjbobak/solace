import { useEffect, useMemo, useState } from 'react';

import { useBudgetData } from '@/features/budget/hooks/useBudgetData';
import { incomeApiService } from '@/features/income/services/incomeApiService';
import type { IncomeYearProjection } from '@/features/income/types/income';

import {
  buildDashboardKpiGroups,
  type DashboardKpiGroup,
} from '../utils/dashboardKpiReport';

interface UseDashboardKpiReportResult {
  groups: DashboardKpiGroup[];
  isLoading: boolean;
  error: string | null;
}

export function useDashboardKpiReport(
  year: number,
  availableYears: number[],
): UseDashboardKpiReportResult {
  const [currentProjection, setCurrentProjection] =
    useState<IncomeYearProjection | null>(null);
  const [previousProjection, setPreviousProjection] =
    useState<IncomeYearProjection | null>(null);
  const [incomeError, setIncomeError] = useState<string | null>(null);
  const [isIncomeLoading, setIsIncomeLoading] = useState(true);
  const { budgetEntries, isLoading: isBudgetLoading, error: budgetError } =
    useBudgetData(year, 'monthly_current_month', false);

  useEffect(() => {
    let isCancelled = false;

    const loadIncomeProjections = async () => {
      try {
        setIsIncomeLoading(true);
        setIncomeError(null);

        const previousYear = year - 1;
        const shouldLoadPreviousYear = availableYears.includes(previousYear);

        const nextCurrentProjection = await incomeApiService.getYearProjection(
          year,
        );
        const nextPreviousProjection = shouldLoadPreviousYear
          ? await incomeApiService
              .getYearProjection(previousYear)
              .catch(() => null)
          : null;

        if (isCancelled) {
          return;
        }

        setCurrentProjection(nextCurrentProjection);
        setPreviousProjection(nextPreviousProjection);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        console.error('Failed to load income projections for KPI report:', error);
        setCurrentProjection(null);
        setPreviousProjection(null);
        setIncomeError(
          error instanceof Error ? error.message : 'Failed to load income data',
        );
      } finally {
        if (!isCancelled) {
          setIsIncomeLoading(false);
        }
      }
    };

    void loadIncomeProjections();

    return () => {
      isCancelled = true;
    };
  }, [availableYears, year]);

  const groups = useMemo(
    () =>
      buildDashboardKpiGroups({
        currentIncomeTotals: currentProjection?.totals ?? null,
        previousIncomeTotals: previousProjection?.totals ?? null,
        currentTaxAdvantagedInvestments:
          currentProjection?.taxAdvantagedInvestments ?? null,
        budgetEntries: budgetError ? null : budgetEntries,
      }),
    [budgetEntries, budgetError, currentProjection, previousProjection],
  );

  return {
    groups,
    isLoading: isIncomeLoading || isBudgetLoading,
    error: incomeError ?? budgetError,
  };
}
