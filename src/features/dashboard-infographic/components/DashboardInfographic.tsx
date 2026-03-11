/**
 * Main orchestrator component for the financial infographic dashboard
 * Manages global state (period) and renders all sections
 */

import React, { useState } from 'react';

import { ToggleButtonGroup } from '@/shared/components/ToggleButtonGroup';

import type { Period } from '../types/infographic';

import { EmergencyRunwaySection } from './EmergencyRunwaySection';
import { FinancialHealthSection } from './FinancialHealthSection';
import { MoneyFlowSection } from './MoneyFlowSection';
import { SpendingAnalysisSection } from './SpendingAnalysisSection';
import { SpendingPulseSection } from './SpendingPulseSection';

export const DashboardInfographic: React.FC = () => {
  const [period, setPeriod] = useState<Period>('monthly');

  return (
    <div>
      <main className="surface-card mx-auto max-w-6xl px-6">
        <div className="py-12">
          <ToggleButtonGroup
            options={[
              { value: 'monthly' as const, label: 'Monthly' },
              { value: 'annual' as const, label: 'Annual' },
            ]}
            value={period}
            onChange={setPeriod}
          />
        </div>

        <div id="financial-health">
          <FinancialHealthSection period={period} />
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
