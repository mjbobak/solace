import { useEffect, useMemo, useState } from 'react';

import { useBudgetData } from '@/features/budget/hooks/useBudgetData';
import type { SpendBasis } from '@/features/budget/types/budgetView';
import { DEFAULT_EMERGENCY_FUND_BALANCE } from '@/features/income/constants/yearSettings';
import { incomeApiService } from '@/features/income/services/incomeApiService';
import type { IncomeYearProjection } from '@/features/income/types/income';
import { getCompletedMonthsForYear } from '@/shared/utils/spendBasis';

import {
  buildDashboardKpiGroups,
  type DashboardKpiGroup,
} from '../utils/dashboardKpiReport';

interface UseDashboardKpiReportResult {
  groups: DashboardKpiGroup[];
  savedEmergencyFundBalance: number;
  isLoading: boolean;
  error: string | null;
}

export function useDashboardKpiReport(
  year: number,
  availableYears: number[],
  spendBasis: SpendBasis,
  emergencyFundBalance?: number | null,
): UseDashboardKpiReportResult {
  const completedMonths = getCompletedMonthsForYear(year);
  const previousYear = year - 1;
  const shouldLoadPreviousYear = availableYears.includes(previousYear);
  const previousCompletedMonthsOverride =
    spendBasis === 'monthly_avg_elapsed' ? completedMonths : undefined;
  const [currentProjection, setCurrentProjection] =
    useState<IncomeYearProjection | null>(null);
  const [previousProjection, setPreviousProjection] =
    useState<IncomeYearProjection | null>(null);
  const [incomeError, setIncomeError] = useState<string | null>(null);
  const [isIncomeLoading, setIsIncomeLoading] = useState(true);
  const {
    budgetEntries,
    isLoading: isBudgetLoading,
    error: budgetError,
  } = useBudgetData(year, spendBasis, true);
  const {
    budgetEntries: previousBudgetEntries,
    isLoading: isPreviousBudgetLoading,
    error: previousBudgetError,
  } = useBudgetData(
    previousYear,
    spendBasis,
    true,
    previousCompletedMonthsOverride,
  );

  useEffect(() => {
    let isCancelled = false;

    const loadIncomeProjections = async () => {
      try {
        setIsIncomeLoading(true);
        setIncomeError(null);

        const nextCurrentProjection =
          await incomeApiService.getYearProjection(year);
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

        console.error(
          'Failed to load income projections for KPI report:',
          error,
        );
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
  }, [availableYears, previousYear, shouldLoadPreviousYear, year]);

  const groups = useMemo(
    () =>
      buildDashboardKpiGroups({
        currentIncomeTotals: currentProjection?.totals ?? null,
        previousIncomeTotals: previousProjection?.totals ?? null,
        currentTaxAdvantagedInvestments:
          currentProjection?.taxAdvantagedInvestments ?? null,
        budgetEntries: budgetError ? null : budgetEntries,
        previousBudgetEntries:
          shouldLoadPreviousYear && !previousBudgetError
            ? previousBudgetEntries
            : null,
        spendBasis,
        completedMonths,
        emergencyFundBalance,
      }),
    [
      budgetEntries,
      budgetError,
      completedMonths,
      currentProjection,
      previousProjection,
      previousBudgetEntries,
      previousBudgetError,
      spendBasis,
      shouldLoadPreviousYear,
      emergencyFundBalance,
    ],
  );

  return {
    groups,
    savedEmergencyFundBalance:
      currentProjection?.emergencyFundBalance ?? DEFAULT_EMERGENCY_FUND_BALANCE,
    isLoading: isIncomeLoading || isBudgetLoading || isPreviousBudgetLoading,
    error: incomeError ?? budgetError ?? previousBudgetError,
  };
}
