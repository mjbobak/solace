/**
 * Hook for calculating spending pulse data (variance from budget)
 */

import { useMemo } from 'react';

import { spendingData } from '@/features/home/services/mockDashboardData';

import type { SpendingPulseData } from '../types/spendingPulse';

export function useSpendingPulse(): SpendingPulseData[] {
  return useMemo(() => {
    return spendingData.map((item) => ({
      month: item.month,
      budget: item.Budget,
      actual: item.Actual,
      variance: item.Budget - item.Actual,
      variancePercent: ((item.Budget - item.Actual) / item.Budget) * 100,
    }));
  }, []);
}
