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
): SankeyData {
  const [incomeProjection, setIncomeProjection] = useState<IncomeYearProjection | null>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchIncomeData = async () => {
      try {
        const data = await incomeApiService.getYearProjection(currentYear);
        setIncomeProjection(data);
      } catch (error) {
        console.error('Failed to fetch income data for Sankey:', error);
      }
    };

    void fetchIncomeData();
  }, [currentYear]);

  return useMemo(() => {
    return viewMode === 'top-level'
      ? buildTopLevelSankeyData(period, incomeProjection)
      : buildDetailedSankeyData(period, incomeProjection);
  }, [incomeProjection, period, viewMode]);
}
