/**
 * Main orchestrator component for the financial infographic dashboard
 * Renders all infographic sections
 */

import React from 'react';
import { useSearchParams } from 'react-router-dom';

import { PlanningYearDropdown } from '@/shared/components/PlanningYearDropdown';
import { usePlanningYearSelection } from '@/shared/hooks/usePlanningYearSelection';

import { EmergencyRunwaySection } from './EmergencyRunwaySection';
import { FinancialHealthSection } from './FinancialHealthSection';
import { MoneyFlowSection } from './MoneyFlowSection';
import { SpendingAnalysisSection } from './SpendingAnalysisSection';
import { SpendingPulseSection } from './SpendingPulseSection';

export const DashboardInfographic: React.FC = () => {
  const period = 'monthly' as const;
  const currentYear = new Date().getFullYear();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    availableYears: planningYears,
    selectedYear,
    setSelectedYear,
  } = usePlanningYearSelection({
    searchParams,
    setSearchParams,
    fallbackYear: currentYear,
  });

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  return (
    <div>
      <main className="surface-card mx-auto max-w-6xl px-6">
        <div className="flex justify-end py-8">
          <PlanningYearDropdown
            year={selectedYear}
            years={planningYears}
            onYearChange={handleYearChange}
            className="w-full sm:w-fit sm:min-w-[216px]"
          />
        </div>

        <div id="financial-health">
          <FinancialHealthSection year={selectedYear} />
        </div>

        <div id="spending-analysis">
          <SpendingAnalysisSection period={period} />
        </div>

        <div id="spending-pulse">
          <SpendingPulseSection period={period} />
        </div>

        <div id="emergency-runway">
          <EmergencyRunwaySection period={period} />
        </div>

        <div id="money-flow">
          <MoneyFlowSection period={period} year={selectedYear} />
        </div>
      </main>

      <div className="h-20" />
    </div>
  );
};
