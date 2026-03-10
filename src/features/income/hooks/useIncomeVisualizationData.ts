/**
 * Hook for transforming income data for visualizations
 * Calculates year-over-year and monthly income data
 * Handles effective date ranges, one-time income frequency, and gross/net display
 */

import { useMemo, useCallback } from 'react';

import { INCOME_FREQUENCY_MULTIPLIERS } from '../constants/incomeConfig';
import type { IncomeEntry } from '../types/income';
import type {
  IncomeDisplayType,
  YearOverYearDataPoint,
  BreakdownYearDataPoint,
} from '../types/incomeView';

interface MonthlyBreakdownDataPoint {
  month: string;
  income: number;
}

interface UseIncomeVisualizationDataReturn {
  yearOverYearData: YearOverYearDataPoint[];
  getMonthlyBreakdownData: (year: number) => MonthlyBreakdownDataPoint[];
}

/**
 * Calculate number of months between two dates
 */
function calculateMonthsBetween(startDate: Date, endDate: Date): number {
  return (
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth())
  );
}

/**
 * Hook to prepare income data for visualization
 * Calculates year-over-year totals and monthly breakdowns
 */
export function useIncomeVisualizationData(
  incomeEntries: IncomeEntry[],
  displayType: IncomeDisplayType,
): UseIncomeVisualizationDataReturn {
  /**
   * Calculate total income for a specific year
   * Handles effective date ranges with prorating and one-time income frequency
   */
  const calculateIncomeForYear = useCallback(
    (entry: IncomeEntry, year: number): number => {
      let total = 0;

      // Handle continuous income with effective date ranges
      if (entry.effectiveRanges && entry.effectiveRanges.length > 0) {
        for (const range of entry.effectiveRanges) {
          const rangeStart = new Date(range.startDate);
          const rangeEnd = range.endDate ? new Date(range.endDate) : null;
          const yearStart = new Date(year, 0, 1);
          const yearEnd = new Date(year, 11, 31);

          // Find overlap between range and year
          const overlapStart = rangeStart > yearStart ? rangeStart : yearStart;
          const overlapEnd =
            rangeEnd && rangeEnd < yearEnd ? rangeEnd : yearEnd;

          if (overlapStart <= overlapEnd) {
            // Calculate months in overlap
            const monthsInOverlap = calculateMonthsBetween(
              overlapStart,
              overlapEnd,
            );
            // Add 1 to include both start and end months
            const months = monthsInOverlap + 1;

            const amount =
              displayType === 'gross' ? range.grossAmount : range.netAmount;
            const annualAmount = amount * range.periods;
            const proratedAmount = (annualAmount / 12) * Math.min(months, 12);

            total += proratedAmount;
          }
        }
      }

      // Handle one-time income
      if (entry.type === 'bonus' && entry.receivedDate) {
        const receivedYear = new Date(entry.receivedDate).getFullYear();
        if (receivedYear === year) {
          const frequency = entry.frequency || 'one-time';
          const multiplier =
            INCOME_FREQUENCY_MULTIPLIERS[
              frequency as keyof typeof INCOME_FREQUENCY_MULTIPLIERS
            ] || 1;

          // Get the amount from the first effective range
          if (entry.effectiveRanges && entry.effectiveRanges.length > 0) {
            const range = entry.effectiveRanges[0];
            const amount =
              displayType === 'gross' ? range.grossAmount : range.netAmount;
            total += amount * multiplier;
          }
        }
      }

      return total;
    },
    [displayType],
  );

  /**
   * Calculate deduction breakdown for a specific year
   */
  const calculateBreakdownForYear = useCallback(
    (year: number): BreakdownYearDataPoint => {
      let net = 0;
      let federalTax = 0;
      let stateTax = 0;
      let fica = 0;
      let retirement = 0;
      let healthInsurance = 0;
      let other = 0;

      for (const entry of incomeEntries) {
        // Handle continuous income with effective date ranges
        if (entry.effectiveRanges && entry.effectiveRanges.length > 0) {
          for (const range of entry.effectiveRanges) {
            const rangeStart = new Date(range.startDate);
            const rangeEnd = range.endDate ? new Date(range.endDate) : null;
            const yearStart = new Date(year, 0, 1);
            const yearEnd = new Date(year, 11, 31);

            // Find overlap
            const overlapStart =
              rangeStart > yearStart ? rangeStart : yearStart;
            const overlapEnd =
              rangeEnd && rangeEnd < yearEnd ? rangeEnd : yearEnd;

            if (overlapStart <= overlapEnd) {
              const monthsInOverlap = calculateMonthsBetween(
                overlapStart,
                overlapEnd,
              );
              const months = monthsInOverlap + 1;

              // Prorate net
              const annualNet = range.netAmount * range.periods;
              net += (annualNet / 12) * Math.min(months, 12);

              // Prorate each deduction category
              const deductions = range.deductions || {};
              const annualFederalTax =
                (deductions.federalTax || 0) * range.periods;
              const annualStateTax = (deductions.stateTax || 0) * range.periods;
              const annualFica = (deductions.fica || 0) * range.periods;
              const annualRetirement =
                (deductions.retirement || 0) * range.periods;
              const annualHealth =
                (deductions.healthInsurance || 0) * range.periods;
              const annualOther = (deductions.other || 0) * range.periods;

              federalTax += (annualFederalTax / 12) * Math.min(months, 12);
              stateTax += (annualStateTax / 12) * Math.min(months, 12);
              fica += (annualFica / 12) * Math.min(months, 12);
              retirement += (annualRetirement / 12) * Math.min(months, 12);
              healthInsurance += (annualHealth / 12) * Math.min(months, 12);
              other += (annualOther / 12) * Math.min(months, 12);
            }
          }
        }

        // Handle one-time income
        if (entry.type === 'bonus' && entry.receivedDate) {
          const receivedYear = new Date(entry.receivedDate).getFullYear();
          if (receivedYear === year) {
            const frequency = entry.frequency || 'one-time';
            const multiplier =
              INCOME_FREQUENCY_MULTIPLIERS[
                frequency as keyof typeof INCOME_FREQUENCY_MULTIPLIERS
              ] || 1;

            if (entry.effectiveRanges && entry.effectiveRanges.length > 0) {
              const range = entry.effectiveRanges[0];
              net += range.netAmount * multiplier;

              const deductions = range.deductions || {};
              federalTax += (deductions.federalTax || 0) * multiplier;
              stateTax += (deductions.stateTax || 0) * multiplier;
              fica += (deductions.fica || 0) * multiplier;
              retirement += (deductions.retirement || 0) * multiplier;
              healthInsurance += (deductions.healthInsurance || 0) * multiplier;
              other += (deductions.other || 0) * multiplier;
            }
          }
        }
      }

      const gross =
        net +
        federalTax +
        stateTax +
        fica +
        retirement +
        healthInsurance +
        other;

      return {
        year: String(year),
        net,
        retirement,
        federalTax,
        stateTax,
        fica,
        healthInsurance,
        other,
        gross,
      };
    },
    [incomeEntries],
  );

  /**
   * Year-over-year data for the last 5 years
   */
  const yearOverYearData = useMemo((): YearOverYearDataPoint[] => {
    const currentYear = new Date().getFullYear();
    const years = [
      currentYear - 4,
      currentYear - 3,
      currentYear - 2,
      currentYear - 1,
      currentYear,
    ];

    if (displayType === 'breakdown') {
      return years.map((year) => calculateBreakdownForYear(year));
    }

    return years.map((year) => ({
      year: String(year),
      income: incomeEntries.reduce(
        (sum, entry) => sum + calculateIncomeForYear(entry, year),
        0,
      ),
    }));
  }, [
    incomeEntries,
    displayType,
    calculateIncomeForYear,
    calculateBreakdownForYear,
  ]);

  /**
   * Monthly breakdown for a selected year
   */
  const getMonthlyBreakdownData = useCallback(
    (year: number): MonthlyBreakdownDataPoint[] => {
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];

      return months.map((month, monthIndex) => {
        let monthlyIncome = 0;

        for (const entry of incomeEntries) {
          // Handle continuous income - distribute evenly across months
          if (entry.type === 'regular' && entry.effectiveRanges?.length) {
            for (const range of entry.effectiveRanges) {
              const rangeStart = new Date(range.startDate);
              const rangeEnd = range.endDate ? new Date(range.endDate) : null;
              const monthDate = new Date(year, monthIndex, 1);

              // Check if this month is within the range
              if (rangeStart <= monthDate) {
                if (!rangeEnd || monthDate <= rangeEnd) {
                  const amount =
                    displayType === 'gross'
                      ? range.grossAmount
                      : range.netAmount;
                  // Distribute annual amount evenly across 12 months
                  monthlyIncome += (amount * range.periods) / 12;
                }
              }
            }
          }

          // Handle one-time income - place in received month
          if (entry.type === 'bonus' && entry.receivedDate) {
            const receivedDate = new Date(entry.receivedDate);
            if (
              receivedDate.getFullYear() === year &&
              receivedDate.getMonth() === monthIndex
            ) {
              const frequency = entry.frequency || 'one-time';
              const multiplier =
                INCOME_FREQUENCY_MULTIPLIERS[
                  frequency as keyof typeof INCOME_FREQUENCY_MULTIPLIERS
                ] || 1;

              // Get amount from first effective range (required, no fallback)
              if (entry.effectiveRanges && entry.effectiveRanges.length > 0) {
                const range = entry.effectiveRanges[0];
                const amount =
                  displayType === 'gross' ? range.grossAmount : range.netAmount;
                monthlyIncome += amount * multiplier;
              }
            }
          }
        }

        return {
          month,
          income: monthlyIncome,
        };
      });
    },
    [incomeEntries, displayType],
  );

  return {
    yearOverYearData,
    getMonthlyBreakdownData,
  };
}
