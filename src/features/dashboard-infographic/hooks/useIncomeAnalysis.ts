/**
 * Hook for analyzing and aggregating income data
 */

import { useEffect, useMemo, useState } from 'react';

import { incomeApiService } from '@/features/income/services/incomeApiService';
import { calculateAnnualGross } from '@/features/income/types/income';
import type { IncomeEntry } from '@/features/income/types/income';

export interface IncomeAnalysisData {
  totalIncome: number;
  streamBreakdown: { stream: string; amount: number; percentage: number }[];
  typeBreakdown: { type: string; amount: number; percentage: number }[];
  trend: { month: string; income: number }[];
}

export function useIncomeAnalysis(): IncomeAnalysisData {
  const [incomeData, setIncomeData] = useState<IncomeEntry[]>([]);

  useEffect(() => {
    const fetchIncomeData = async () => {
      try {
        const data = await incomeApiService.getAllIncomes();
        setIncomeData(data);
      } catch (error) {
        console.error('Failed to fetch income data for analysis:', error);
      }
    };

    fetchIncomeData();
  }, []);

  return useMemo(() => {
    // Aggregate income by stream
    const byStream = new Map<string, number>();
    let totalIncome = 0;

    incomeData.forEach((entry: IncomeEntry) => {
      // Use annual gross income (period toggle doesn't apply to income analysis - always show annual)
      const amount = calculateAnnualGross(entry);
      const current = byStream.get(entry.stream) || 0;
      byStream.set(entry.stream, current + amount);
      totalIncome += amount;
    });

    // Create breakdown with percentages
    const streamBreakdown = Array.from(byStream.entries())
      .map(([stream, amount]) => ({
        stream,
        amount,
        percentage: (amount / totalIncome) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Aggregate income by type
    const byType = new Map<string, number>();
    incomeData.forEach((entry: IncomeEntry) => {
      // Use annual gross income
      const amount = calculateAnnualGross(entry);
      const current = byType.get(entry.type) || 0;
      byType.set(entry.type, current + amount);
    });

    // Create type breakdown with percentages
    const typeBreakdown = Array.from(byType.entries())
      .map(([type, amount]) => ({
        type,
        amount,
        percentage: (amount / totalIncome) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Mock 12-month trend (in real implementation, derive from historical data)
    const trend = [
      { month: 'Jan', income: totalIncome },
      { month: 'Feb', income: totalIncome * 1.02 },
      { month: 'Mar', income: totalIncome },
      { month: 'Apr', income: totalIncome * 1.05 },
      { month: 'May', income: totalIncome },
      { month: 'Jun', income: totalIncome },
      { month: 'Jul', income: totalIncome * 1.03 },
      { month: 'Aug', income: totalIncome },
      { month: 'Sep', income: totalIncome },
      { month: 'Oct', income: totalIncome },
      { month: 'Nov', income: totalIncome * 1.01 },
      { month: 'Dec', income: totalIncome * 1.08 },
    ];

    return {
      totalIncome,
      streamBreakdown,
      typeBreakdown,
      trend,
    };
  }, [incomeData]);
}
