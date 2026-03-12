/**
 * Main orchestrator component for the financial infographic dashboard
 * Renders all infographic sections
 */

import React from 'react';
import { useSearchParams } from 'react-router-dom';

import { PlanningYearDropdown } from '@/shared/components/PlanningYearDropdown';

import { EmergencyRunwaySection } from './EmergencyRunwaySection';
import { FinancialHealthSection } from './FinancialHealthSection';
import { MoneyFlowSection } from './MoneyFlowSection';
import { SpendingAnalysisSection } from './SpendingAnalysisSection';
import { SpendingPulseSection } from './SpendingPulseSection';

const YEAR_WINDOW = 2;

function getSelectedYear(searchParams: URLSearchParams, fallbackYear: number) {
  const parsedYear = Number(searchParams.get('year'));
  return Number.isFinite(parsedYear) && parsedYear > 2000
    ? parsedYear
    : fallbackYear;
}

export const DashboardInfographic: React.FC = () => {
  const period = 'monthly' as const;
  const currentYear = new Date().getFullYear();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedYear = getSelectedYear(searchParams, currentYear);
  const yearOptions = Array.from(
    { length: YEAR_WINDOW * 2 + 1 },
    (_, index) => selectedYear - YEAR_WINDOW + index,
  );

  const handleYearChange = (year: number) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set('year', String(year));
    setSearchParams(nextSearchParams, { replace: true });
  };

  return (
    <div>
      <main className="surface-card mx-auto max-w-6xl px-6">
        <div className="flex justify-end py-8">
          <PlanningYearDropdown
            year={selectedYear}
            years={yearOptions}
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
