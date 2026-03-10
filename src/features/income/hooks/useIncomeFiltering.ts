/**
 * Hook for filtering and calculating display amounts
 * Transforms income entries based on selected period and display type
 */

import { useMemo } from 'react';

import type { IncomeEntry } from '../types/income';
import { calculateAnnualGross, calculateAnnualNet } from '../types/income';
import type {
  IncomePeriod,
  IncomeDisplayType,
  IncomeWithCalculations,
} from '../types/incomeView';

/**
 * Calculate display amount for a single income entry based on period and type
 */
function calculateDisplayAmount(
  entry: IncomeEntry,
  period: IncomePeriod,
  displayType: IncomeDisplayType,
): number {
  const annualGross = calculateAnnualGross(entry);
  const annualNet = calculateAnnualNet(entry);

  // Determine base annual value
  const annualValue = displayType === 'gross' ? annualGross : annualNet;

  // Convert to monthly if needed
  if (period === 'annual') {
    return annualValue;
  }

  return annualValue / 12;
}

/**
 * Hook to filter and transform income entries
 * Returns enhanced entries with calculated display amounts
 */
export function useIncomeFiltering(
  incomeEntries: IncomeEntry[],
  period: IncomePeriod,
  displayType: IncomeDisplayType,
): { filteredData: IncomeWithCalculations[] } {
  const filteredData = useMemo(() => {
    return incomeEntries.map((entry) => {
      const annualGross = calculateAnnualGross(entry);
      const annualNet = calculateAnnualNet(entry);

      return {
        ...entry,
        displayAmount: calculateDisplayAmount(entry, period, displayType),
        annualGross,
        annualNet,
      };
    });
  }, [incomeEntries, period, displayType]);

  return { filteredData };
}
