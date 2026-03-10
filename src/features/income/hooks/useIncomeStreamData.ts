/**
 * Hook for generating income stream trend data
 * Transforms income entry data into monthly time series for a selected stream
 * Handles effective date ranges to show changes over time
 */

import { useMemo } from 'react';

import type { IncomeEntry, EffectiveDateRange } from '../types/income';
import type { IncomeDisplayType } from '../types/incomeView';

interface StreamTrendDataPoint {
  month: string; // Format: "Jan 2024"
  value: number;
}

export interface StreamTrendData {
  data: StreamTrendDataPoint[];
  streams: string[]; // List of available income streams
}

/**
 * Generate monthly time series data for a selected income stream
 * Handles effective date ranges (salary changes over time)
 *
 * @param incomeEntries - All income entries
 * @param selectedStream - Selected stream name (e.g., "Salary A")
 * @param displayType - Display type (gross, net, breakdown)
 * @returns Data points for chart and list of available streams
 */
export function useIncomeStreamData(
  incomeEntries: IncomeEntry[],
  selectedStream: string | null,
  displayType: IncomeDisplayType,
): StreamTrendData {
  return useMemo(() => {
    // Get list of regular income streams (exclude bonus income)
    const regularStreams = incomeEntries
      .filter((entry) => entry.type === 'regular')
      .map((entry) => entry.stream)
      .sort();

    // If no stream selected or selected stream doesn't exist, return empty
    if (!selectedStream || !regularStreams.includes(selectedStream)) {
      return {
        data: [],
        streams: regularStreams,
      };
    }

    // Find the selected income entry
    const entry = incomeEntries.find((e) => e.stream === selectedStream);
    if (!entry) {
      return {
        data: [],
        streams: regularStreams,
      };
    }

    // Generate monthly data from effective date ranges
    const data = generateMonthlyData(entry, displayType);

    return {
      data,
      streams: regularStreams,
    };
  }, [incomeEntries, selectedStream, displayType]);
}

/**
 * Generate monthly time series from effective date ranges
 * If no ranges exist, uses deprecated fields (amount/annual)
 */
function generateMonthlyData(
  entry: IncomeEntry,
  displayType: IncomeDisplayType,
): StreamTrendDataPoint[] {
  const dataPoints: StreamTrendDataPoint[] = [];

  // Determine date range to display (last 12-24 months)
  const today = new Date();
  const startDate = new Date(today.getFullYear() - 1, today.getMonth(), 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Use effective ranges (all entries must have at least one)
  const ranges = entry.effectiveRanges || [];

  // Sort ranges by start date
  const sortedRanges = [...ranges].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  // Generate data point for each month
  const current = new Date(startDate);
  while (current <= endDate) {
    const monthStr = formatMonthYear(current);
    const value = getValueForDate(current, sortedRanges, displayType);

    dataPoints.push({
      month: monthStr,
      value: Math.round(value * 100) / 100, // Round to 2 decimals
    });

    current.setMonth(current.getMonth() + 1);
  }

  return dataPoints;
}

/**
 * Get monthly value for a given date from effective ranges
 */
function getValueForDate(
  date: Date,
  ranges: EffectiveDateRange[],
  displayType: IncomeDisplayType,
): number {
  // Find the range that covers this date
  const activeRange = ranges.find((range) => {
    const rangeStart = new Date(range.startDate);
    const rangeEnd = range.endDate ? new Date(range.endDate) : null;

    return rangeStart <= date && (!rangeEnd || date <= rangeEnd);
  });

  if (!activeRange) {
    // If date is before first range, return 0
    // If date is after last range, use last range
    const lastRange = ranges[ranges.length - 1];
    if (lastRange && new Date(lastRange.startDate) > date) {
      return 0;
    }
    if (!activeRange && lastRange) {
      // Date is after all ranges, use last range
      return calculateMonthlyAmount(lastRange, displayType);
    }
    return 0;
  }

  return calculateMonthlyAmount(activeRange, displayType);
}

/**
 * Calculate monthly amount from period amounts
 * Handles annual, quarterly, biweekly, etc.
 */
function calculateMonthlyAmount(
  range: EffectiveDateRange,
  displayType: IncomeDisplayType,
): number {
  const baseAmount =
    displayType === 'net' ? range.netAmount : range.grossAmount;

  // Convert pay period amount to monthly
  // periods = pay periods per year (26 = biweekly, 24 = semi-monthly, 12 = monthly)
  const monthlyAmount = (baseAmount * range.periods) / 12;

  return monthlyAmount;
}

/**
 * Format date as "Jan 2024"
 */
function formatMonthYear(date: Date): string {
  const monthNames = [
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
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}
