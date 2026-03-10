import { useEffect, useMemo, useState } from 'react';

import { incomeApiService } from '@/features/income/services/incomeApiService';
import type { IncomeEntry } from '@/features/income/types/income';

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
  const [incomeData, setIncomeData] = useState<IncomeEntry[]>([]);

  useEffect(() => {
    const fetchIncomeData = async () => {
      try {
        const data = await incomeApiService.getAllIncomes();
        setIncomeData(data);
      } catch (error) {
        console.error('Failed to fetch income data for Sankey:', error);
      }
    };

    fetchIncomeData();
  }, []);

  return useMemo(() => {
    return viewMode === 'top-level'
      ? buildTopLevelSankeyData(period, incomeData)
      : buildDetailedSankeyData(period, incomeData);
  }, [viewMode, period, incomeData]);
}
