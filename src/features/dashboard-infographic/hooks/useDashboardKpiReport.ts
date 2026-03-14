import { useEffect, useMemo, useState } from 'react';

import { useBudgetData } from '@/features/budget/hooks/useBudgetData';
import { DEFAULT_EMERGENCY_FUND_BALANCE } from '@/features/income/constants/yearSettings';
import { incomeApiService } from '@/features/income/services/incomeApiService';
import type { IncomeYearProjection } from '@/features/income/types/income';

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
  emergencyFundBalance?: number | null,
): UseDashboardKpiReportResult {
  const [currentProjection, setCurrentProjection] =
    useState<IncomeYearProjection | null>(null);
  const [previousProjection, setPreviousProjection] =
    useState<IncomeYearProjection | null>(null);
  const [incomeError, setIncomeError] = useState<string | null>(null);
  const [isIncomeLoading, setIsIncomeLoading] = useState(true);
  const {
    budgetEntries: monthlyBudgetEntries,
    isLoading: isMonthlyBudgetLoading,
    error: monthlyBudgetError,
  } = useBudgetData(year, 'monthly_current_month', false);
  const {
    budgetEntries: annualBudgetEntries,
    isLoading: isAnnualBudgetLoading,
    error: annualBudgetError,
  } = useBudgetData(year, 'annual_full_year', false);

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
        monthlyBudgetEntries: monthlyBudgetError ? null : monthlyBudgetEntries,
        annualBudgetEntries: annualBudgetError ? null : annualBudgetEntries,
        emergencyFundBalance,
      }),
    [
      monthlyBudgetEntries,
      monthlyBudgetError,
      annualBudgetEntries,
      annualBudgetError,
      currentProjection,
      previousProjection,
      emergencyFundBalance,
    ],
  );

  return {
    groups,
    savedEmergencyFundBalance:
      currentProjection?.emergencyFundBalance ??
      DEFAULT_EMERGENCY_FUND_BALANCE,
    isLoading: isIncomeLoading || isMonthlyBudgetLoading || isAnnualBudgetLoading,
    error: incomeError ?? monthlyBudgetError ?? annualBudgetError,
  };
}
