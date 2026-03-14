/**
 * Main orchestrator component for the financial infographic dashboard
 * Renders either the visual dashboard or a simple KPI report.
 */

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { PlanningYearDropdown } from '@/shared/components/PlanningYearDropdown';
import { ToggleButtonGroup } from '@/shared/components/ToggleButtonGroup';
import { usePlanningYearSelection } from '@/shared/hooks/usePlanningYearSelection';

import { DashboardKpiReport } from './DashboardKpiReport';
import { EmergencyRunwaySection } from './EmergencyRunwaySection';
import { FinancialHealthSection } from './FinancialHealthSection';
import { MoneyFlowSection } from './MoneyFlowSection';
import { SpendingAnalysisSection } from './SpendingAnalysisSection';
import { SpendingPulseSection } from './SpendingPulseSection';

type DashboardMode = 'visual' | 'report';

export const DashboardInfographic: React.FC = () => {
  const period = 'monthly' as const;
  const currentYear = new Date().getFullYear();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>('report');
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
        <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <ToggleButtonGroup
            value={dashboardMode}
            onChange={setDashboardMode}
            options={[
              { value: 'visual', label: 'Visual' },
              { value: 'report', label: 'Report' },
            ]}
            className="w-full sm:w-auto"
          />
          <PlanningYearDropdown
            year={selectedYear}
            years={planningYears}
            onYearChange={handleYearChange}
            className="w-full sm:w-fit sm:min-w-[216px]"
          />
        </div>

        {dashboardMode === 'report' ? (
          <DashboardKpiReport
            year={selectedYear}
            availableYears={planningYears}
          />
        ) : (
          <>
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
          </>
        )}
      </main>

      <div className="h-20" />
    </div>
  );
};
