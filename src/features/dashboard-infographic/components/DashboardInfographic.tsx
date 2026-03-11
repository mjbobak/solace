/**
 * Main orchestrator component for the financial infographic dashboard
 * Renders all infographic sections
 */

import React from 'react';

import { EmergencyRunwaySection } from './EmergencyRunwaySection';
import { FinancialHealthSection } from './FinancialHealthSection';
import { MoneyFlowSection } from './MoneyFlowSection';
import { SpendingAnalysisSection } from './SpendingAnalysisSection';
import { SpendingPulseSection } from './SpendingPulseSection';

export const DashboardInfographic: React.FC = () => {
  const period = 'monthly';

  return (
    <div>
      <main className="surface-card mx-auto max-w-6xl px-6">
        <div id="financial-health">
          <FinancialHealthSection />
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
          <MoneyFlowSection period={period} />
        </div>
      </main>

      <div className="h-20" />
    </div>
  );
};
