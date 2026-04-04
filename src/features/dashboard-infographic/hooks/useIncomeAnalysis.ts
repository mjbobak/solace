import { useEffect, useMemo, useState } from 'react';

import { incomeApiService } from '@/features/income/services/incomeApiService';
import type {
  IncomeYearProjection,
  ProjectedIncomeComponent,
} from '@/features/income/types/income';
import { parseDateOnly } from '@/shared/utils/dateOnly';

export interface IncomeAnalysisData {
  totalIncome: number;
  plannedNetIncome: number;
  sourceBreakdown: {
    source: string;
    member: string;
    amount: number;
    percentage: number;
  }[];
  typeBreakdown: { type: string; amount: number; percentage: number }[];
  trend: { month: string; income: number }[];
}

const MONTH_NAMES = [
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

function flattenComponents(projection: IncomeYearProjection) {
  return projection.sources.flatMap((source) =>
    source.components.map((component) => ({ source, component })),
  );
}

function getMonthlyPlannedNet(
  component: ProjectedIncomeComponent,
  year: number,
): number[] {
  const values = Array.from({ length: 12 }, () => 0);
  const daysInYear = new Date(year, 1, 29).getMonth() === 1 ? 366 : 365;

  component.versions.forEach((version) => {
    const rangeStart = parseDateOnly(version.startDate);
    const rangeEnd = version.endDate
      ? parseDateOnly(version.endDate)
      : new Date(year, 11, 31);
    const annualNet = version.netAmount * version.periodsPerYear;

    MONTH_NAMES.forEach((_, monthIndex) => {
      const monthStart = new Date(year, monthIndex, 1);
      const monthEnd = new Date(year, monthIndex + 1, 0);
      const effectiveStart = new Date(
        Math.max(rangeStart.getTime(), monthStart.getTime()),
      );
      const effectiveEnd = new Date(
        Math.min(rangeEnd.getTime(), monthEnd.getTime()),
      );

      if (effectiveStart > effectiveEnd) {
        return;
      }

      const overlapDays =
        Math.floor(
          (effectiveEnd.getTime() - effectiveStart.getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1;
      values[monthIndex] += (annualNet * overlapDays) / daysInYear;
    });
  });

  component.occurrences.forEach((occurrence) => {
    const effectiveDate = parseDateOnly(
      occurrence.paidDate ?? occurrence.plannedDate,
    );
    if (effectiveDate.getFullYear() !== year) {
      return;
    }
    if (occurrence.status === 'expected' || occurrence.status === 'actual') {
      values[effectiveDate.getMonth()] += occurrence.netAmount;
    }
  });

  return values;
}

export function useIncomeAnalysis(
  year = new Date().getFullYear(),
): IncomeAnalysisData {
  const [projection, setProjection] = useState<IncomeYearProjection | null>(
    null,
  );

  useEffect(() => {
    const fetchProjection = async () => {
      try {
        const response = await incomeApiService.getYearProjection(year);
        setProjection(response);
      } catch (error) {
        console.error('Failed to fetch income projection for analysis:', error);
      }
    };

    void fetchProjection();
  }, [year]);

  return useMemo(() => {
    if (!projection) {
      return {
        totalIncome: 0,
        plannedNetIncome: 0,
        sourceBreakdown: [],
        typeBreakdown: [],
        trend: [],
      };
    }

    const sourceBreakdown = projection.sources
      .map((source) => ({
        source: source.name,
        member: source.name,
        amount: source.totals.plannedCashNet,
        percentage:
          projection.totals.plannedCashNet > 0
            ? (source.totals.plannedCashNet /
                projection.totals.plannedCashNet) *
              100
            : 0,
      }))
      .sort((left, right) => right.amount - left.amount);

    const typeTotals = new Map<string, number>();
    flattenComponents(projection).forEach(({ component }) => {
      const current = typeTotals.get(component.componentType) ?? 0;
      typeTotals.set(
        component.componentType,
        current + component.totals.plannedCashNet,
      );
    });

    const typeBreakdown = Array.from(typeTotals.entries())
      .map(([type, amount]) => ({
        type,
        amount,
        percentage:
          projection.totals.plannedCashNet > 0
            ? (amount / projection.totals.plannedCashNet) * 100
            : 0,
      }))
      .sort((left, right) => right.amount - left.amount);

    const monthlyTotals = Array.from({ length: 12 }, () => 0);
    flattenComponents(projection).forEach(({ component }) => {
      const componentMonthly = getMonthlyPlannedNet(component, year);
      componentMonthly.forEach((amount, index) => {
        monthlyTotals[index] += amount;
      });
    });

    const trend = monthlyTotals.map((income, index) => ({
      month: MONTH_NAMES[index],
      income: Math.round(income),
    }));

    return {
      totalIncome: projection.totals.plannedCashNet,
      plannedNetIncome: projection.totals.plannedNet,
      sourceBreakdown,
      typeBreakdown,
      trend,
    };
  }, [projection, year]);
}
