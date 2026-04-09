/**
 * Financial Health Section
 * Displays a top-level income allocation waterfall for the current plan.
 */

import React from 'react';

import { useBudgetData } from '@/features/budget/hooks/useBudgetData';

import { useIncomeAnalysis } from '../hooks/useIncomeAnalysis';

import { IncomeAllocationCard } from './IncomeAllocationCard';
import { ScrollAnimatedSection } from './ScrollAnimatedSection';
import { SectionNarrative } from './SectionNarrative';

interface FinancialHealthSectionProps {
  year: number;
}

export const FinancialHealthSection: React.FC<FinancialHealthSectionProps> = ({
  year,
}) => {
  const incomeAnalysis = useIncomeAnalysis(year);
  const annualNetIncome = incomeAnalysis.plannedNetIncome;
  const monthlyIncome = annualNetIncome / 12;

  const { budgetEntries } = useBudgetData(year, 'monthly_current_month', false);

  return (
    <ScrollAnimatedSection className="py-12 px-6 space-y-8">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-app">
          Financial Health Overview
        </h2>
        <SectionNarrative
          text="Your complete financial picture showing income, spending, savings, and wealth generation. All percentages are relative to total income."
          highlight={true}
        />
      </div>
      <IncomeAllocationCard
        monthlyIncome={monthlyIncome}
        budgetEntries={budgetEntries}
      />
    </ScrollAnimatedSection>
  );
};
