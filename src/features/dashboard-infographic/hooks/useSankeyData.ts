import { useEffect, useMemo, useState } from 'react';

import { useBudgetData } from '@/features/budget/hooks/useBudgetData';
import { incomeApiService } from '@/features/income/services/incomeApiService';
import type { IncomeYearProjection } from '@/features/income/types/income';
import { getCompletedMonthsForYear } from '@/shared/utils/spendBasis';

import { buildAnnualMoneyFlowSankeyData } from '../services/sankeyDataService';
import type { SankeyData } from '../types/sankeyTypes';
import {
  buildDashboardMoneyFlowSummary,
  type DashboardMoneyFlowSummary,
} from '../utils/dashboardKpiReport';

interface UseSankeyDataResult {
  data: SankeyData;
  summary: DashboardMoneyFlowSummary;
  isLoading: boolean;
  error: string | null;
}

const EMPTY_SUMMARY: DashboardMoneyFlowSummary = {
  netIncome: null,
  essentialSpending: null,
  funsiesSpending: null,
  savingsAmount: null,
  investmentAmount: null,
  preTax401kContribution: null,
  netIncomeWealthContribution: null,
  wealthContribution: null,
};

export function useSankeyData(year: number): UseSankeyDataResult {
  const completedMonths = getCompletedMonthsForYear(year);
  const [incomeProjection, setIncomeProjection] =
    useState<IncomeYearProjection | null>(null);
  const [incomeError, setIncomeError] = useState<string | null>(null);
  const [isIncomeLoading, setIsIncomeLoading] = useState(true);
  const {
    budgetEntries,
    isLoading: isBudgetLoading,
    error: budgetError,
  } = useBudgetData(year, 'annual_full_year', true);

  useEffect(() => {
    let isCancelled = false;

    const fetchIncomeData = async () => {
      try {
        setIsIncomeLoading(true);
        setIncomeError(null);
        const data = await incomeApiService.getYearProjection(year);

        if (isCancelled) {
          return;
        }

        setIncomeProjection(data);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        console.error('Failed to fetch income data for Sankey:', error);
        setIncomeProjection(null);
        setIncomeError(
          error instanceof Error ? error.message : 'Failed to load income data',
        );
      } finally {
        if (!isCancelled) {
          setIsIncomeLoading(false);
        }
      }
    };

    void fetchIncomeData();

    return () => {
      isCancelled = true;
    };
  }, [year]);

  const summary = useMemo(() => {
    if (budgetError) {
      return EMPTY_SUMMARY;
    }

    return buildDashboardMoneyFlowSummary({
      currentIncomeTotals: incomeProjection?.totals ?? null,
      currentTaxAdvantagedInvestments:
        incomeProjection?.taxAdvantagedInvestments ?? null,
      budgetEntries,
      spendBasis: 'annual_full_year',
      completedMonths,
    });
  }, [budgetEntries, budgetError, completedMonths, incomeProjection]);

  return {
    data: buildAnnualMoneyFlowSankeyData(summary),
    summary,
    isLoading: isIncomeLoading || isBudgetLoading,
    error: incomeError ?? budgetError,
  };
}
