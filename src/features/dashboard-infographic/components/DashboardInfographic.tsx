/**
 * Main orchestrator component for the financial infographic dashboard
 * Renders either the visual dashboard or a simple KPI report.
 */

import React from 'react';

import type { SpendBasis } from '@/features/budget/types/budgetView';
import { ToggleButtonGroup } from '@/shared/components/ToggleButtonGroup';

import { DashboardKpiReport } from './DashboardKpiReport';
import { EmergencyRunwaySection } from './EmergencyRunwaySection';
import { FinancialHealthSection } from './FinancialHealthSection';
import { MoneyFlowSection } from './MoneyFlowSection';
import { SpendingPulseSection } from './SpendingPulseSection';

export type DashboardMode = 'visual' | 'report';

interface DashboardInfographicProps {
  year: number;
  availableYears: number[];
  spendBasis: SpendBasis;
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
}

export const DashboardInfographic: React.FC<DashboardInfographicProps> = ({
  year,
  availableYears,
  spendBasis,
  mode,
  onModeChange,
}) => {
  return (
    <div>
      <main className="surface-card mx-auto max-w-6xl px-6">
        <div className="py-8">
          <ToggleButtonGroup
            value={mode}
            onChange={onModeChange}
            options={[
              { value: 'visual', label: 'Visual' },
              { value: 'report', label: 'Report' },
            ]}
            className="w-full sm:w-auto"
          />
        </div>

        {mode === 'report' ? (
          <DashboardKpiReport
            year={year}
            availableYears={availableYears}
            spendBasis={spendBasis}
          />
        ) : (
          <>
            <div id="financial-health">
              <FinancialHealthSection year={year} />
            </div>

            <div id="spending-pulse">
              <SpendingPulseSection period={'monthly'} />
            </div>

            <div id="emergency-runway">
              <EmergencyRunwaySection
                year={year}
                spendBasis={spendBasis}
                period={'monthly'}
              />
            </div>

            <div id="money-flow">
              <MoneyFlowSection year={year} />
            </div>
          </>
        )}
      </main>

      <div className="h-20" />
    </div>
  );
};
