/**
 * Hook for grouping income entries by stream name and managing expansion state
 * Handles all data transformation from flat list to grouped with history expansion
 */

import { useCallback, useMemo, useState } from 'react';

import type { IncomeEntry } from '../types/income';
import type {
  DisplayValues,
  EffectiveDateRangeWithEntry,
  GroupedIncomeEntry,
  IncomeDisplayType,
  IncomePeriod,
} from '../types/incomeView';
import { calculateDisplayValues } from '../utils/incomeCalculations';

/**
 * Return type for the grouping hook
 */
export interface UseIncomeGroupingReturn {
  groupedEntries: GroupedIncomeEntry[];
  toggleExpansion: (streamName: string) => void;
}

/**
 * Group income entries by stream name with expansion support
 * Automatically finds active range and calculates display values
 * Manages expansion state for showing historical ranges
 *
 * @param entries - Array of income entries to group
 * @param period - Display period ('annual' or 'monthly')
 * @param type - Display type ('gross' or 'net')
 * @returns Grouped entries and expansion toggle function
 */
export function useIncomeGrouping(
  entries: IncomeEntry[],
  period: IncomePeriod,
  type: IncomeDisplayType,
): UseIncomeGroupingReturn {
  const [expandedStreams, setExpandedStreams] = useState<Set<string>>(
    new Set(),
  );

  const groupedEntries = useMemo(() => {
    // 1. Group entries by stream name
    const groups = new Map<string, IncomeEntry[]>();
    entries.forEach((entry) => {
      const existing = groups.get(entry.stream) || [];
      groups.set(entry.stream, [...existing, entry]);
    });

    // 2. For each group, find active range and calculate display values
    return Array.from(groups.entries()).map(([streamName, groupEntries]) => {
      // Find currently active range (endDate is null or in future)
      let activeEntry: IncomeEntry | null = null;
      let activeRange = groupEntries[0].effectiveRanges?.[0] || null;

      for (const entry of groupEntries) {
        const active = entry.effectiveRanges?.find((range) => {
          if (!range.endDate) return true; // No end date means ongoing
          return new Date(range.endDate) >= new Date();
        });

        if (active) {
          activeEntry = entry;
          activeRange = active;
          break;
        }
      }

      // Fallback: most recent range by startDate
      if (!activeEntry || !activeRange) {
        let mostRecent: (typeof activeRange & { entry: IncomeEntry }) | null =
          null;

        for (const entry of groupEntries) {
          for (const range of entry.effectiveRanges || []) {
            if (
              !mostRecent ||
              new Date(range.startDate) > new Date(mostRecent.startDate)
            ) {
              mostRecent = { ...range, entry };
            }
          }
        }

        if (mostRecent) {
          const { entry, ...range } = mostRecent;
          activeEntry = entry;
          activeRange = range;
        }
      }

      // Collect all ranges from all entries
      const allRanges: EffectiveDateRangeWithEntry[] = [];
      groupEntries.forEach((entry) => {
        (entry.effectiveRanges || []).forEach((range) => {
          allRanges.push({
            ...range,
            entryId: entry.id,
            entryType: entry.type,
            entryFrequency: entry.frequency || 'annual',
          });
        });
      });

      // Sort by startDate descending (most recent first)
      allRanges.sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
      );

      // Calculate display values
      let displayValues: DisplayValues;
      if (activeRange && type !== 'breakdown') {
        displayValues = calculateDisplayValues(activeRange, period, type);
      } else {
        displayValues = {
          income: '$0',
          payPeriods: null,
          federalTax: '$0',
          stateTax: '$0',
          fica: '$0',
          retirement: '$0',
          healthInsurance: '$0',
        };
      }

      return {
        streamName,
        entries: groupEntries,
        activeEntry,
        activeRange,
        allRanges,
        displayValues,
        type: activeEntry?.type || 'regular',
        frequency: activeEntry?.frequency || null,
        isExpanded: expandedStreams.has(streamName),
      };
    });
  }, [entries, period, type, expandedStreams]);

  const toggleExpansion = useCallback((streamName: string) => {
    setExpandedStreams((prev) => {
      const next = new Set(prev);
      if (next.has(streamName)) {
        next.delete(streamName);
      } else {
        next.add(streamName);
      }
      return next;
    });
  }, []);

  return { groupedEntries, toggleExpansion };
}
