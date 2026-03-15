import { useEffect, useMemo, useState } from 'react';

import { incomeApiService } from '@/features/income/services/incomeApiService';
import type { IncomeYearProjection } from '@/features/income/types/income';

import {
  buildTopLevelSankeyData,
  buildDetailedSankeyData,
} from '../services/sankeyDataService';
import type {
  SankeyViewMode,
  SankeyPeriod,
  SankeyData,
} from '../types/sankeyTypes';

export function useSankeyData(
  viewMode: SankeyViewMode,
  period: SankeyPeriod,
  year = new Date().getFullYear(),
): SankeyData {
  const [incomeProjection, setIncomeProjection] =
    useState<IncomeYearProjection | null>(null);

  useEffect(() => {
    const fetchIncomeData = async () => {
      try {
        const data = await incomeApiService.getYearProjection(year);
        setIncomeProjection(data);
      } catch (error) {
        console.error('Failed to fetch income data for Sankey:', error);
      }
    };

    void fetchIncomeData();
  }, [year]);

  return useMemo(() => {
    return viewMode === 'top-level'
      ? buildTopLevelSankeyData(period, incomeProjection)
      : buildDetailedSankeyData(period, incomeProjection);
  }, [incomeProjection, period, viewMode]);
}
